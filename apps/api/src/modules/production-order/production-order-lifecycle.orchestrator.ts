import { Injectable, NotFoundException } from '@nestjs/common';
import { MovementType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MaterialDocumentService } from '../material-document/material-document.service';
import { ProductionOrderDomainEvent } from './production-order-domain-events';
import { ProductionOrderStatusPolicy } from './production-order-status.policy';

@Injectable()
export class ProductionOrderLifecycleOrchestrator {
    constructor(
        private readonly prisma: PrismaService,
        private readonly materialDocumentService: MaterialDocumentService,
        private readonly statusPolicy: ProductionOrderStatusPolicy,
    ) { }

    async handle(event: ProductionOrderDomainEvent) {
        switch (event.type) {
            case 'production-order.start.requested':
                return this.onStart(event.orderId);
            case 'production-order.operation.confirmed':
                return this.onOperationConfirm(event.orderId, event.operationId, event.dto);
            case 'production-order.complete.requested':
                return this.onComplete(event.orderId);
        }
    }

    private async onStart(orderId: string) {
        const order = await this.prisma.productionOrder.findUnique({
            where: { id: orderId },
            include: {
                recipe: { include: { items: { include: { material: true } } } },
            },
        });

        if (!order) throw new NotFoundException(`Üretim emri bulunamadı: ${orderId}`);

        const now = new Date();
        const scalingFactor = Number(order.plannedQuantity) / Number(order.recipe.batchSize || 1);

        return this.prisma.$transaction(async (tx) => {
            let currentStatus = order.status;

            if (currentStatus === 'DRAFT') {
                this.statusPolicy.assertTransition(currentStatus, 'PLANNED');
                await tx.productionOrder.update({ where: { id: orderId }, data: { status: 'PLANNED' } });
                currentStatus = 'PLANNED';
            }

            this.statusPolicy.assertTransition(currentStatus, 'IN_PROGRESS');

            const started = await tx.productionOrder.update({
                where: { id: orderId },
                data: { status: 'IN_PROGRESS', actualStart: now },
            });

            const reservationItems = order.recipe.items.map((item) => {
                const requiredBase = Number(item.quantity) * scalingFactor;
                const requiredWithWastage = requiredBase * (1 + Number(item.wastagePercent) / 100);
                return {
                    materialId: item.materialId,
                    materialCode: item.material.code,
                    materialName: item.material.name,
                    requiredQuantity: Number(requiredWithWastage.toFixed(4)),
                    unit: item.material.unitOfMeasure,
                };
            });

            await tx.eventOutbox.createMany({
                data: [
                    {
                        eventType: 'production-order.material-reservation.created',
                        aggregateType: 'production-order',
                        aggregateId: orderId,
                        payload: {
                            orderId,
                            orderNumber: order.orderNumber,
                            createdAt: now.toISOString(),
                            items: reservationItems,
                        },
                        status: 'PENDING',
                    },
                    {
                        eventType: 'production-order.gi261-draft.created',
                        aggregateType: 'production-order',
                        aggregateId: orderId,
                        payload: {
                            orderId,
                            orderNumber: order.orderNumber,
                            movementType: MovementType.GI_FOR_ORDER,
                            draft: true,
                            createdAt: now.toISOString(),
                            items: reservationItems,
                        },
                        status: 'PENDING',
                    },
                ],
            });

            return started;
        });
    }

    private async onOperationConfirm(orderId: string, operationId: string, dto: any) {
        const operation = await this.prisma.productionOrderOperation.findUnique({
            where: { id: operationId },
            include: {
                productionOrder: true,
                workCenter: { include: { costCenter: true, plant: { include: { companyCode: true } } } },
            },
        });

        if (!operation || operation.productionOrderId !== orderId) {
            throw new NotFoundException('Operasyon bulunamadı.');
        }

        const now = new Date();
        const activityDurationMinutes = Number(dto?.activityDurationMinutes ?? 0);
        const durationHours = activityDurationMinutes > 0
            ? activityDurationMinutes / 60
            : (operation.actualStart ? Math.max(0, (now.getTime() - operation.actualStart.getTime()) / 3600000) : 0);
        const hourlyCost = Number(operation.workCenter?.hourlyCost ?? 0);
        const operationCost = Number((durationHours * hourlyCost).toFixed(2));

        return this.prisma.$transaction(async (tx) => {
            const updatedOperation = await tx.productionOrderOperation.update({
                where: { id: operationId },
                data: {
                    status: 'QC_PENDING',
                    producedQuantity: { increment: dto.producedQuantity },
                    wasteQuantity: { increment: dto.wasteQuantity || 0 },
                    actualEnd: now,
                    notes: dto.notes
                        ? (operation.notes ? `${operation.notes}\n${dto.notes}` : dto.notes)
                        : operation.notes,
                },
            });

            if (operationCost > 0 && operation.workCenter?.costCenterId && operation.workCenter?.plant?.companyCodeId) {
                const companyCode = operation.workCenter.plant.companyCode;
                const expenseAccount = await tx.gLAccount.findFirst({
                    where: { companyCodeId: companyCode.id, type: 'EXPENSE', isActive: true },
                });
                const offsetAccount = await tx.gLAccount.findFirst({
                    where: { companyCodeId: companyCode.id, type: 'LIABILITY', isActive: true },
                });

                if (expenseAccount && offsetAccount) {
                    const fiscalYear = now.getFullYear();
                    const period = now.getMonth() + 1;
                    const entryNumber = await this.generateFiDocNumber(tx, fiscalYear);

                    await tx.journalEntry.create({
                        data: {
                            entryNumber,
                            companyCodeId: companyCode.id,
                            fiscalYear,
                            postingDate: now,
                            documentDate: now,
                            period,
                            currency: companyCode.currency,
                            headerText: `Operasyon maliyet kaydı - ${operation.productionOrder.orderNumber}`,
                            reference: operation.productionOrder.orderNumber,
                            status: 'POSTED',
                            items: {
                                create: [
                                    {
                                        glAccountId: expenseAccount.id,
                                        debit: operationCost,
                                        credit: 0,
                                        costCenterId: operation.workCenter.costCenterId,
                                        description: `WorkCenter ${operation.workCenter.code} aktivite maliyeti`,
                                    },
                                    {
                                        glAccountId: offsetAccount.id,
                                        debit: 0,
                                        credit: operationCost,
                                        description: 'Operasyon maliyet karşılığı',
                                    },
                                ],
                            },
                        },
                    });
                }
            }

            return updatedOperation;
        });
    }

    private async onComplete(orderId: string) {
        const order = await this.prisma.productionOrder.findUnique({
            where: { id: orderId },
            include: {
                product: true,
                operations: { include: { workCenter: { include: { plant: { include: { companyCode: true } } } } } },
            },
        });
        if (!order) throw new NotFoundException(`Üretim emri bulunamadı: ${orderId}`);

        this.statusPolicy.assertTransition(order.status, 'COMPLETED');

        const finishedGoodMaterial = await this.prisma.material.findFirst({ where: { code: order.product.code } });
        const productionPlant = order.operations.find((x) => x.workCenter?.plantId)?.workCenter?.plant;

        if (finishedGoodMaterial && productionPlant) {
            await this.materialDocumentService.create({
                movementType: MovementType.GR_FOR_ORDER,
                documentDate: new Date().toISOString(),
                postingDate: new Date().toISOString(),
                reference: order.orderNumber,
                headerText: `Üretim emri mamul girişi - ${order.orderNumber}`,
                items: [
                    {
                        materialId: finishedGoodMaterial.id,
                        plantId: productionPlant.id,
                        quantity: Number(order.actualQuantity ?? order.plannedQuantity),
                        unit: finishedGoodMaterial.unitOfMeasure,
                    },
                ],
            });
        }

        await this.postOrderClosingCostDistribution(orderId);

        return this.prisma.productionOrder.update({
            where: { id: orderId },
            data: { status: 'COMPLETED', actualEnd: new Date() },
        });
    }

    private async postOrderClosingCostDistribution(orderId: string) {
        const order = await this.prisma.productionOrder.findUnique({
            where: { id: orderId },
            include: {
                operations: {
                    include: {
                        workCenter: {
                            include: {
                                plant: { include: { companyCode: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!order || order.operations.length === 0) return;

        const anchorOperation = order.operations.find((x) => x.workCenter?.plant?.companyCodeId);
        if (!anchorOperation?.workCenter?.plant?.companyCode) return;

        const totalOperationCost = order.operations.reduce((acc, op) => {
            const end = op.actualEnd?.getTime() ?? Date.now();
            const start = op.actualStart?.getTime() ?? end;
            const hours = Math.max(0, (end - start) / 3600000);
            return acc + (hours * Number(op.workCenter?.hourlyCost ?? 0));
        }, 0);

        const amount = Number(totalOperationCost.toFixed(2));
        if (amount <= 0) return;

        const companyCode = anchorOperation.workCenter.plant.companyCode;
        const inventoryAccount = await this.prisma.gLAccount.findFirst({
            where: { companyCodeId: companyCode.id, type: 'ASSET', isActive: true },
        });
        const clearingAccount = await this.prisma.gLAccount.findFirst({
            where: { companyCodeId: companyCode.id, type: 'EXPENSE', isActive: true },
        });

        if (!inventoryAccount || !clearingAccount) return;

        const now = new Date();
        const fiscalYear = now.getFullYear();
        const period = now.getMonth() + 1;
        const entryNumber = await this.generateFiDocNumber(this.prisma, fiscalYear);

        await this.prisma.journalEntry.create({
            data: {
                companyCodeId: companyCode.id,
                fiscalYear,
                period,
                entryNumber,
                documentDate: now,
                postingDate: now,
                currency: companyCode.currency,
                status: 'POSTED',
                headerText: `Sipariş kapanış maliyet dağıtımı - ${order.orderNumber}`,
                reference: order.orderNumber,
                items: {
                    create: [
                        {
                            glAccountId: inventoryAccount.id,
                            debit: amount,
                            credit: 0,
                            description: 'Mamul stok maliyet aktivasyonu',
                        },
                        {
                            glAccountId: clearingAccount.id,
                            debit: 0,
                            credit: amount,
                            description: 'Sipariş kapanış maliyet mahsup kaydı',
                        },
                    ],
                },
            },
        });
    }

    private async generateFiDocNumber(tx: Prisma.TransactionClient | PrismaService, year: number) {
        const prefix = `FI-${year}-`;
        const lastDoc = await tx.journalEntry.findFirst({
            where: { fiscalYear: year },
            orderBy: { entryNumber: 'desc' },
        });

        let seq = 1;
        if (lastDoc) {
            const parts = lastDoc.entryNumber.split('-');
            if (parts.length === 3) seq = parseInt(parts[2], 10) + 1;
        }
        return `${prefix}${String(seq).padStart(8, '0')}`;
    }
}

