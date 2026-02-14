import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaterialDocumentDto } from './dto/create-material-document.dto';
import { MovementType, POStatus, MaterialBatchStatus } from '@prisma/client';

@Injectable()
export class MaterialDocumentService {
    constructor(private readonly prisma: PrismaService) { }

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
                // Calculation of local currency amount would go here (Unit Price * Qty)

                // Inventory Impact
                await this.processInventoryImpact(tx, dto.movementType, item);

                // Document Line Item
                await tx.materialDocumentItem.create({
                    data: {
                        materialDocId: doc.id,
                        materialId: item.materialId,
                        plantId: item.plantId,
                        storageLocId: item.storageLocId,
                        batchNumber: item.batchNumber,
                        quantity: item.quantity,
                        unit: item.unit,
                        debitCredit: this.getDebitCredit(dto.movementType),
                    },
                });

                // 3. Movement Specific Logic (e.g. PO Update)
                if (dto.movementType === MovementType.GR_PURCHASE_ORDER && dto.purchaseOrderId && item.refItemId) {
                    await this.updatePOHistory(tx, dto.purchaseOrderId, item.refItemId, item.quantity);
                }
            }

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
                return 'S'; // Default handling needed
        }
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
            where: { id: item.materialId },
            data: { currentStock: newStock },
        });

        // Batch Handling
        let batchNumber = item.batchNumber;

        if (isDebit) {
            // Goods Receipt (Stock Increase)
            if (!batchNumber && material.autoBatch) {
                // Generate simple batch number: B-YYYYMMDD-HHMMSS
                const now = new Date();
                const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
                const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
                batchNumber = `B-${dateStr}-${timeStr}`;
                item.batchNumber = batchNumber; // Update item so it gets saved in DocumentItem
            }

            if (batchNumber) {
                const status = material.qualityControl ? MaterialBatchStatus.QUARANTINE : MaterialBatchStatus.AVAILABLE;

                // Check if batch exists (e.g. adding to existing batch) or create new
                const existingBatch = await tx.materialBatch.findUnique({
                    where: {
                        materialId_batchNumber: {
                            materialId: material.id,
                            batchNumber,
                        }
                    }
                });

                if (existingBatch) {
                    await tx.materialBatch.update({
                        where: {
                            materialId_batchNumber: {
                                materialId: material.id,
                                batchNumber,
                            }
                        },
                        data: {
                            remainingQuantity: { increment: qty },
                            quantity: { increment: qty } // Total quantity ever received
                        }
                    });
                } else {
                    await tx.materialBatch.create({
                        data: {
                            batchNumber, // No longer unique on its own
                            materialId: material.id,
                            quantity: qty,
                            remainingQuantity: qty, // Initial remaining
                            status: status,
                            storageLocation: item.storageLocId,
                            manufacturingDate: new Date(), // Assumption
                            expiryDate: material.shelfLife ? new Date(Date.now() + material.shelfLife * 24 * 60 * 60 * 1000) : null
                        }
                    });
                }
            }
        } else {
            // Goods Issue (Stock Decrease)
            if (batchNumber) {
                const batch = await tx.materialBatch.findUnique({
                    where: {
                        materialId_batchNumber: {
                            materialId: material.id,
                            batchNumber,
                        }
                    }
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
                        }
                    },
                    data: {
                        remainingQuantity: { decrement: qty }
                    }
                });
            } else {
                // FIFO consumption if no batch specified? 
                // For now, if no batch is specified in GI, we just reduce total stock (already done above)
                // In strict batch management, batchNumber MUST be provided for GI.
                // We'll leave it as is for flexible/non-batch materials.
            }
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
                isOpen
            }
        });

        // Update PO status if all items received?
        // (Simplified logic for now)
    }

    async findAll() {
        return this.prisma.materialDocument.findMany({
            include: { items: { include: { material: true } } },
            orderBy: { docNumber: 'desc' }
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
            orderBy: { materialDocument: { documentDate: 'desc' } }
        });
    }

    async findOne(id: string) {
        return this.prisma.materialDocument.findUnique({
            where: { id },
            include: { items: { include: { material: true } } }
        });
    }
}
