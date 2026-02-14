import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOutboundDeliveryDto } from './dto/create-outbound-delivery.dto';
import { MaterialDocumentService } from '../material-document/material-document.service';
import { MovementType, Prisma } from '@prisma/client';

type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class OutboundDeliveryService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly materialDocService: MaterialDocumentService,
    ) { }

    private async getPlantStockAvailability(
        tx: PrismaTx,
        materialId: string,
        plantId: string,
        batchNumber?: string,
    ): Promise<number> {
        const where = {
            materialId,
            plantId,
            ...(batchNumber ? { batchNumber } : {}),
        };

        const [debits, credits] = await Promise.all([
            tx.materialDocumentItem.aggregate({
                where: { ...where, debitCredit: 'S' },
                _sum: { quantity: true },
            }),
            tx.materialDocumentItem.aggregate({
                where: { ...where, debitCredit: 'H' },
                _sum: { quantity: true },
            }),
        ]);

        return Number(debits._sum.quantity ?? 0) - Number(credits._sum.quantity ?? 0);
    }

    private async validateDeliveryItemStocks(
        tx: PrismaTx,
        items: Array<{ materialId: string; plantId: string; quantity: number; batchNumber?: string | null }>,
    ) {
        const demandByKey = new Map<string, { materialId: string; plantId: string; batchNumber?: string; quantity: number }>();

        for (const item of items) {
            const batchNumber = item.batchNumber?.trim() || undefined;
            const key = `${item.materialId}|${item.plantId}|${batchNumber ?? '*'}`;
            const existing = demandByKey.get(key);
            if (existing) {
                existing.quantity += Number(item.quantity);
                continue;
            }
            demandByKey.set(key, {
                materialId: item.materialId,
                plantId: item.plantId,
                batchNumber,
                quantity: Number(item.quantity),
            });
        }

        for (const demand of demandByKey.values()) {
            if (demand.batchNumber) {
                const batch = await tx.materialBatch.findUnique({
                    where: {
                        materialId_batchNumber: {
                            materialId: demand.materialId,
                            batchNumber: demand.batchNumber,
                        },
                    },
                });

                if (!batch) {
                    throw new BadRequestException(`Batch bulunamadı: ${demand.batchNumber}`);
                }

                if (Number(batch.remainingQuantity) < demand.quantity) {
                    throw new BadRequestException(`Batch stok yetersiz: ${demand.batchNumber}`);
                }
            }

            const available = await this.getPlantStockAvailability(
                tx,
                demand.materialId,
                demand.plantId,
                demand.batchNumber,
            );

            if (available < demand.quantity) {
                throw new BadRequestException(
                    `Stok yetersiz (material=${demand.materialId}, plant=${demand.plantId}, batch=${demand.batchNumber ?? 'N/A'}). Mevcut=${available}, Talep=${demand.quantity}`,
                );
            }
        }
    }

    private async logPgiAudit(
        tx: PrismaTx,
        deliveryId: string,
        action: 'POST_GOODS_ISSUE' | 'POST_GOODS_ISSUE_DUPLICATE_BLOCKED',
        metadata: Prisma.InputJsonValue,
    ) {
        await tx.auditLog.create({
            data: {
                entityType: 'OutboundDelivery',
                entityId: deliveryId,
                action,
                metadata,
                endpoint: '/outbound-deliveries/:id/post-goods-issue',
            },
        });
    }

    private async updateSalesOrderDeliveryStatus(tx: PrismaTx, salesOrderId: string) {
        const order = await tx.salesOrder.findUnique({
            where: { id: salesOrderId },
            include: {
                items: {
                    include: {
                        deliveryItems: {
                            include: { delivery: true },
                        },
                    },
                },
            },
        });

        if (!order) return;

        let allFull = order.items.length > 0;
        let anyDelivered = false;

        for (const item of order.items) {
            const shippedQty = item.deliveryItems
                .filter((deliveryItem) => deliveryItem.delivery.status === 'Shipped')
                .reduce((sum, deliveryItem) => sum + Number(deliveryItem.quantity), 0);

            const orderedQty = Number(item.quantity);
            const deliveryStatus = shippedQty <= 0 ? 'PENDING' : shippedQty < orderedQty ? 'PARTIAL' : 'FULL';

            if (deliveryStatus !== 'FULL') {
                allFull = false;
            }
            if (deliveryStatus !== 'PENDING') {
                anyDelivered = true;
            }

            await tx.salesOrderItem.update({
                where: { id: item.id },
                data: { deliveryStatus },
            });
        }

        const status = allFull ? 'DELIVERED' : anyDelivered ? 'PARTIALLY_DELIVERED' : order.status;
        if (status !== order.status) {
            await tx.salesOrder.update({
                where: { id: order.id },
                data: { status },
            });
        }
    }

    private async generateDeliveryNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `DN-${year}-`;
        const lastDoc = await this.prisma.outboundDelivery.findFirst({
            where: { deliveryNumber: { startsWith: prefix } },
            orderBy: { deliveryNumber: 'desc' },
        });

        let seq = 1;
        if (lastDoc) {
            const parts = lastDoc.deliveryNumber.split('-');
            if (parts.length === 3) {
                seq = parseInt(parts[2], 10) + 1;
            }
        }
        return `${prefix}${String(seq).padStart(6, '0')}`;
    }

    async create(dto: CreateOutboundDeliveryDto) {
        return this.prisma.$transaction(async (tx) => {
            const salesOrder = await tx.salesOrder.findUnique({
                where: { id: dto.salesOrderId },
                include: { items: true },
            });
            if (!salesOrder) throw new NotFoundException('Satış siparişi bulunamadı.');

            const deliveryNumber = await this.generateDeliveryNumber();

            const itemsData = [];
            for (const itemDto of dto.items) {
                const soItem = salesOrder.items.find(i => i.id === itemDto.salesOrderItemId);
                if (!soItem || !soItem.plantId) continue;

                itemsData.push({
                    salesOrderItemId: soItem.id,
                    materialId: soItem.materialId,
                    plantId: soItem.plantId,
                    quantity: itemDto.quantity,
                    unit: soItem.unit,
                    batchNumber: itemDto.batchNumber,
                });
            }

            await this.validateDeliveryItemStocks(tx, itemsData.map((item) => ({
                materialId: item.materialId,
                plantId: item.plantId,
                quantity: Number(item.quantity),
                batchNumber: item.batchNumber,
            })));

            return tx.outboundDelivery.create({
                data: {
                    deliveryNumber,
                    salesOrderId: dto.salesOrderId,
                    customerId: salesOrder.customerId,
                    deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : new Date(),
                    status: 'Open',
                    items: {
                        create: itemsData
                    }
                },
                include: { items: true }
            });
        });
    }

    async postGoodsIssue(id: string) {
        return this.prisma.$transaction(async (tx) => {
            const delivery = await tx.outboundDelivery.findUnique({
                where: { id },
                include: { items: true },
            });

            if (!delivery) throw new NotFoundException('Teslimat belgesi bulunamadı.');
            if (delivery.status === 'Shipped') {
                await this.logPgiAudit(tx, id, 'POST_GOODS_ISSUE_DUPLICATE_BLOCKED', {
                    reason: 'ALREADY_SHIPPED',
                    deliveryNumber: delivery.deliveryNumber,
                });
                throw new BadRequestException('Bu teslimat zaten sevk edilmiş (PGI yapılmış).');
            }

            await this.validateDeliveryItemStocks(tx, delivery.items.map((item) => ({
                materialId: item.materialId,
                plantId: item.plantId,
                quantity: Number(item.quantity),
                batchNumber: item.batchNumber,
            })));

            const matDocDto = {
                movementType: MovementType.GI_SALES_ORDER,
                postingDate: new Date().toISOString(),
                reference: delivery.deliveryNumber,
                headerText: `Delivery ${delivery.deliveryNumber}`,
                items: delivery.items.map(item => ({
                    materialId: item.materialId,
                    plantId: item.plantId,
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    batchNumber: item.batchNumber,
                })),
            };

            await this.materialDocService.create(matDocDto as any);

            const updateResult = await tx.outboundDelivery.updateMany({
                where: { id, status: { not: 'Shipped' } },
                data: {
                    status: 'Shipped',
                    actualGI: new Date(),
                },
            });

            if (updateResult.count === 0) {
                await this.logPgiAudit(tx, id, 'POST_GOODS_ISSUE_DUPLICATE_BLOCKED', {
                    reason: 'CONCURRENT_POST_BLOCKED',
                    deliveryNumber: delivery.deliveryNumber,
                });
                throw new BadRequestException('PGI işlemi tekrarlı olarak engellendi.');
            }

            await this.updateSalesOrderDeliveryStatus(tx, delivery.salesOrderId);

            await this.logPgiAudit(tx, id, 'POST_GOODS_ISSUE', {
                deliveryNumber: delivery.deliveryNumber,
                movementType: MovementType.GI_SALES_ORDER,
            });

            return tx.outboundDelivery.findUnique({ where: { id } });
        });
    }

    async findAll() {
        return this.prisma.outboundDelivery.findMany({
            include: { items: true, customer: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.outboundDelivery.findUnique({
            where: { id },
            include: { items: true, customer: true }
        });
    }
}
