import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaterialDocumentDto } from './dto/create-material-document.dto';
import { MovementType, POStatus, MaterialBatchStatus, Prisma, MaterialType } from '@prisma/client';
import { AccountDeterminationService } from '../accounting/account-determination.service';

type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class MaterialDocumentService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly accountDeterminationService: AccountDeterminationService,
    ) { }

    private async generateDocNumber(year: number): Promise<string> {
        const prefix = `M-${year}-`;
        const lastDoc = await this.prisma.materialDocument.findFirst({
            where: { year },
            orderBy: { docNumber: 'desc' },
        });

        let seq = 1;
        if (lastDoc) {
            const parts = lastDoc.docNumber.split('-');
            if (parts.length === 3) {
                seq = parseInt(parts[2], 10) + 1;
            }
        }
        return `${prefix}${String(seq).padStart(6, '0')}`;
    }

    async create(dto: CreateMaterialDocumentDto) {
        const year = new Date().getFullYear();
        const docNumber = await this.generateDocNumber(year);

        return this.prisma.$transaction(async (tx) => {
            // 1. Create Header
            const doc = await tx.materialDocument.create({
                data: {
                    docNumber,
                    year,
                    movementType: dto.movementType,
                    documentDate: dto.documentDate ? new Date(dto.documentDate) : new Date(),
                    postingDate: dto.postingDate ? new Date(dto.postingDate) : new Date(),
                    reference: dto.reference,
                    headerText: dto.headerText,
                    purchaseOrderId: dto.purchaseOrderId,
                },
            });

            // 2. Process Items
            for (const item of dto.items) {
                await this.processInventoryImpact(tx, dto.movementType, item);

                const material = await tx.material.findUnique({ where: { id: item.materialId } });
                if (!material) throw new NotFoundException(`Material not found: ${item.materialId}`);

                const amountLC = Number(item.quantity) * Number(material.unitPrice);

                await tx.materialDocumentItem.create({
                    data: {
                        materialDocId: doc.id,
                        materialId: item.materialId,
                        plantId: item.plantId,
                        storageLocId: item.storageLocId,
                        batchNumber: item.batchNumber,
                        quantity: item.quantity,
                        unit: item.unit,
                        amountLC,
                        debitCredit: this.getDebitCredit(dto.movementType),
                    },
                });

                if (dto.movementType === MovementType.GR_PURCHASE_ORDER && dto.purchaseOrderId && item.refItemId) {
                    await this.updatePOHistory(tx, dto.purchaseOrderId, item.refItemId, item.quantity);
                }
            }

            await this.postAccountingForMaterialDocument(tx, doc.id);

            return doc;
        });
    }

    private getDebitCredit(type: MovementType): 'S' | 'H' {
        // S = Debit (Stok Artışı), H = Credit (Stok Azalışı)
        switch (type) {
            case MovementType.GR_PURCHASE_ORDER:
            case MovementType.GR_FOR_ORDER:
            case MovementType.INITIAL_STOCK_ENTRY:
                return 'S';
            case MovementType.GI_FOR_ORDER:
            case MovementType.GI_COST_CENTER:
            case MovementType.GI_SALES_ORDER:
                return 'H'; // Credit (Stock Decrease)
            default:
                return 'S';
        }
    }

    private async postAccountingForMaterialDocument(tx: PrismaTx, materialDocumentId: string) {
        const materialDoc = await tx.materialDocument.findUnique({
            where: { id: materialDocumentId },
            include: {
                items: {
                    include: {
                        material: true,
                        plant: { include: { companyCode: true } },
                    },
                },
            },
        });

        if (!materialDoc) throw new NotFoundException(`Material document not found: ${materialDocumentId}`);
        if (!materialDoc.items.length) throw new BadRequestException('Material document must contain at least one item.');

        const companyCode = materialDoc.items[0].plant.companyCode;
        for (const item of materialDoc.items) {
            if (item.plant.companyCodeId !== companyCode.id) {
                throw new BadRequestException('All material document items must belong to the same company code for FI posting.');
            }
        }

        let totalAmount = 0;
        const inventoryBuckets = new Map<string, number>();
        const offsetBuckets = new Map<string, number>();

        for (const item of materialDoc.items) {
            const amount = Number(item.amountLC ?? Number(item.quantity) * Number(item.material.unitPrice));
            if (amount <= 0) {
                throw new BadRequestException(`Material item amount must be greater than zero. Material: ${item.material.code}`);
            }

            const determination = await this.accountDeterminationService.resolveAccounts(tx, {
                movementType: materialDoc.movementType,
                valuationClass: item.material.valuationClass,
                materialType: item.material.type as MaterialType,
                companyCode: companyCode.code,
            });

            if (materialDoc.movementType === MovementType.GI_SALES_ORDER) {
                const [inventoryAccount, offsetAccount] = await Promise.all([
                    tx.gLAccount.findUnique({ where: { id: determination.inventoryGlAccountId } }),
                    tx.gLAccount.findUnique({ where: { id: determination.offsetGlAccountId } }),
                ]);

                if (!inventoryAccount || inventoryAccount.type !== 'ASSET') {
                    throw new BadRequestException('PGI accounting failed: inventory account must be an ASSET account.');
                }

                if (!offsetAccount || offsetAccount.type !== 'EXPENSE') {
                    throw new BadRequestException('PGI accounting failed: COGS account must be an EXPENSE account.');
                }
            }

            totalAmount += amount;
            inventoryBuckets.set(
                determination.inventoryGlAccountId,
                (inventoryBuckets.get(determination.inventoryGlAccountId) ?? 0) + amount,
            );
            offsetBuckets.set(
                determination.offsetGlAccountId,
                (offsetBuckets.get(determination.offsetGlAccountId) ?? 0) + amount,
            );
        }

        const isInventoryDebit = this.getDebitCredit(materialDoc.movementType) === 'S';
        const journalItems: Array<{
            glAccountId: string;
            debit: number;
            credit: number;
            description: string;
        }> = [];

        for (const [glAccountId, amount] of inventoryBuckets.entries()) {
            journalItems.push({
                glAccountId,
                debit: isInventoryDebit ? amount : 0,
                credit: isInventoryDebit ? 0 : amount,
                description: materialDoc.movementType === MovementType.GI_SALES_ORDER
                    ? 'Stock decrease for PGI'
                    : `Inventory posting (${materialDoc.movementType})`,
            });
        }

        for (const [glAccountId, amount] of offsetBuckets.entries()) {
            journalItems.push({
                glAccountId,
                debit: isInventoryDebit ? 0 : amount,
                credit: isInventoryDebit ? amount : 0,
                description: materialDoc.movementType === MovementType.GI_SALES_ORDER
                    ? 'COGS posting for PGI'
                    : `Offset posting (${materialDoc.movementType})`,
            });
        }

        const sumDebit = journalItems.reduce((acc, item) => acc + item.debit, 0);
        const sumCredit = journalItems.reduce((acc, item) => acc + item.credit, 0);
        if (Math.abs(sumDebit - sumCredit) > 0.01) {
            throw new BadRequestException(`Journal is not balanced for material document ${materialDoc.docNumber}`);
        }

        const fiscalYear = materialDoc.postingDate.getFullYear();
        const period = materialDoc.postingDate.getMonth() + 1;
        const entryNumber = await this.generateFiDocNumber(tx, fiscalYear);

        await tx.journalEntry.create({
            data: {
                companyCodeId: companyCode.id,
                fiscalYear,
                period,
                entryNumber,
                documentDate: materialDoc.documentDate,
                postingDate: materialDoc.postingDate,
                headerText: materialDoc.headerText ?? `MM posting ${materialDoc.docNumber}`,
                reference: materialDoc.docNumber,
                currency: companyCode.currency,
                status: 'POSTED',
                items: {
                    create: journalItems.map((item) => ({
                        glAccountId: item.glAccountId,
                        debit: Number(item.debit.toFixed(2)),
                        credit: Number(item.credit.toFixed(2)),
                        description: item.description,
                    })),
                },
            },
        });

        if (totalAmount <= 0) {
            throw new BadRequestException(`Material document ${materialDoc.docNumber} generated zero accounting amount.`);
        }
    }

    private async generateFiDocNumber(tx: PrismaTx, year: number): Promise<string> {
        const prefix = `FI-${year}-`;
        const lastDoc = await tx.journalEntry.findFirst({
            where: { fiscalYear: year },
            orderBy: { entryNumber: 'desc' },
        });

        let seq = 1;
        if (lastDoc) {
            const parts = lastDoc.entryNumber.split('-');
            if (parts.length === 3) {
                seq = parseInt(parts[2], 10) + 1;
            }
        }
        return `${prefix}${String(seq).padStart(8, '0')}`;
    }

    private async processInventoryImpact(tx: any, type: MovementType, item: any) {
        const material = await tx.material.findUnique({ where: { id: item.materialId } });
        if (!material) throw new NotFoundException(`Material not found: ${item.materialId}`);

        let newStock = Number(material.currentStock);
        const qty = Number(item.quantity);
        const isDebit = this.getDebitCredit(type) === 'S';

        if (isDebit) {
            newStock += qty;
        } else {
            newStock -= qty;
        }

        if (newStock < 0 && !material.allowNegativeStock) {
            throw new BadRequestException(`Insufficient stock for material ${material.code}`);
        }

        await tx.material.update({
            where: { id: material.id },
            data: { currentStock: newStock },
        });

        let batchNumber = item.batchNumber;

        if (isDebit) {
            if (!batchNumber && material.autoBatch) {
                const now = new Date();
                const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
                const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
                batchNumber = `B-${dateStr}-${timeStr}`;
                item.batchNumber = batchNumber;
            }

            if (batchNumber) {
                const status = material.qualityControl ? MaterialBatchStatus.QUARANTINE : MaterialBatchStatus.AVAILABLE;
                const existingBatch = await tx.materialBatch.findUnique({
                    where: {
                        materialId_batchNumber: {
                            materialId: material.id,
                            batchNumber,
                        },
                    },
                });

                if (existingBatch) {
                    await tx.materialBatch.update({
                        where: {
                            materialId_batchNumber: {
                                materialId: material.id,
                                batchNumber,
                            },
                        },
                        data: {
                            remainingQuantity: { increment: qty },
                            quantity: { increment: qty },
                        },
                    });
                } else {
                    await tx.materialBatch.create({
                        data: {
                            batchNumber,
                            materialId: material.id,
                            quantity: qty,
                            remainingQuantity: qty,
                            status,
                            storageLocation: item.storageLocId,
                            manufacturingDate: new Date(),
                            expiryDate: material.shelfLife ? new Date(Date.now() + material.shelfLife * 24 * 60 * 60 * 1000) : null,
                        },
                    });
                }
            }
        } else if (batchNumber) {
            const batch = await tx.materialBatch.findUnique({
                where: {
                    materialId_batchNumber: {
                        materialId: material.id,
                        batchNumber,
                    },
                },
            });
            if (!batch) throw new NotFoundException(`Batch ${batchNumber} not found`);

            if (Number(batch.remainingQuantity) < qty && !material.allowNegativeStock) {
                throw new BadRequestException(`Insufficient stock in batch ${batchNumber}`);
            }

            await tx.materialBatch.update({
                where: {
                    materialId_batchNumber: {
                        materialId: material.id,
                        batchNumber,
                    },
                },
                data: {
                    remainingQuantity: { decrement: qty },
                },
            });
        }
    }

    private async updatePOHistory(tx: any, poId: string, poItemId: string, qty: number) {
        const item = await tx.purchaseOrderItem.findUnique({ where: { id: poItemId } });
        if (!item) throw new NotFoundException('PO Item not found');

        const newReceived = Number(item.receivedQuantity) + Number(qty);
        const isOpen = newReceived < Number(item.quantity);

        await tx.purchaseOrderItem.update({
            where: { id: poItemId },
            data: {
                receivedQuantity: newReceived,
                isOpen,
            },
        });

        const openItems = await tx.purchaseOrderItem.count({ where: { poId, isOpen: true } });
        if (openItems === 0) {
            await tx.purchaseOrder.update({
                where: { id: poId },
                data: { status: POStatus.COMPLETED },
            });
        }
    }

    async findAll() {
        return this.prisma.materialDocument.findMany({
            include: { items: { include: { material: true } } },
            orderBy: { docNumber: 'desc' },
        });
    }

    async findByMaterial(materialId: string) {
        return this.prisma.materialDocumentItem.findMany({
            where: { materialId },
            include: {
                materialDocument: true,
                plant: true,
                storageLocation: true,
            },
            orderBy: { materialDocument: { documentDate: 'desc' } },
        });
    }

    async findOne(id: string) {
        return this.prisma.materialDocument.findUnique({
            where: { id },
            include: { items: { include: { material: true } } },
        });
    }
}
