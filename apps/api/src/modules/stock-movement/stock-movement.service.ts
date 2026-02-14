import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovementType } from '@prisma/client';

interface FindAllParams {
    page: number;
    pageSize: number;
    search?: string;
    type?: StockMovementType;
}

@Injectable()
export class StockMovementService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateStockMovementDto) {
        if (!dto.materialId && !dto.productId) {
            throw new BadRequestException('materialId veya productId zorunludur.');
        }

        const movementNumber = `SM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const qty = dto.quantity;
        const unit = dto.unit ?? 'Kg';

        return this.prisma.$transaction(async (tx) => {
            let previousStock: number | null = null;
            let newStock: number | null = null;

            const isInbound = (
                [StockMovementType.INBOUND, StockMovementType.PRODUCTION_IN, StockMovementType.RETURN] as StockMovementType[]
            ).includes(dto.type);

            const isOutbound = (
                [StockMovementType.OUTBOUND, StockMovementType.PRODUCTION_OUT, StockMovementType.WASTE] as StockMovementType[]
            ).includes(dto.type);

            if (dto.materialId) {
                const material = await tx.material.findUnique({ where: { id: dto.materialId } });
                if (!material) throw new BadRequestException('Malzeme bulunamadı.');
                previousStock = Number(material.currentStock);
                newStock = isInbound
                    ? previousStock + qty
                    : isOutbound
                        ? previousStock - qty
                        : previousStock + (dto.type === StockMovementType.ADJUSTMENT ? qty - previousStock : 0);

                await tx.material.update({
                    where: { id: dto.materialId },
                    data: { currentStock: newStock },
                });

                if (dto.materialBatchId) {
                    await tx.materialBatch.update({
                        where: { id: dto.materialBatchId },
                        data: {
                            remainingQuantity: {
                                ...(isOutbound ? { decrement: qty } : { increment: qty }),
                            },
                        },
                    });
                }
            }

            if (dto.productId) {
                const product = await tx.product.findUnique({ where: { id: dto.productId } });
                if (!product) throw new BadRequestException('Ürün bulunamadı.');
                previousStock = Number(product.currentStock);
                newStock = isInbound
                    ? previousStock + qty
                    : isOutbound
                        ? previousStock - qty
                        : previousStock;

                await tx.product.update({
                    where: { id: dto.productId },
                    data: { currentStock: newStock },
                });
            }

            const totalValue = dto.unitPrice ? dto.unitPrice * qty : null;

            return tx.stockMovement.create({
                data: {
                    movementNumber,
                    type: dto.type,
                    materialId: dto.materialId ?? null,
                    productId: dto.productId ?? null,
                    materialBatchId: dto.materialBatchId ?? null,
                    quantity: qty,
                    unit,
                    previousStock: previousStock ?? undefined,
                    newStock: newStock ?? undefined,
                    unitPrice: dto.unitPrice ?? undefined,
                    totalValue: totalValue ?? undefined,
                    referenceType: dto.referenceType ?? null,
                    referenceId: dto.referenceId ?? null,
                    description: dto.description ?? null,
                    performedBy: dto.performedBy ?? null,
                },
            });
        });
    }

    async findAll(params: FindAllParams) {
        const { page, pageSize, search, type } = params;
        const skip = (page - 1) * pageSize;

        const where: any = {};
        if (type) where.type = type;
        if (search) {
            where.OR = [
                { movementNumber: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { performedBy: { contains: search, mode: 'insensitive' } },
                { referenceId: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.stockMovement.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            this.prisma.stockMovement.count({ where }),
        ]);

        // Enrich with material/product names
        const materialIds = [...new Set(data.filter(d => d.materialId).map(d => d.materialId!))];
        const productIds = [...new Set(data.filter(d => d.productId).map(d => d.productId!))];

        const [materials, products] = await Promise.all([
            materialIds.length > 0
                ? this.prisma.material.findMany({ where: { id: { in: materialIds } }, select: { id: true, code: true, name: true } })
                : [],
            productIds.length > 0
                ? this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, code: true, name: true } })
                : [],
        ]);

        const materialMap = new Map(materials.map(m => [m.id, m] as [string, typeof m]));
        const productMap = new Map(products.map(p => [p.id, p] as [string, typeof p]));

        const enriched = data.map(item => ({
            ...item,
            material: item.materialId ? materialMap.get(item.materialId) : null,
            product: item.productId ? productMap.get(item.productId) : null,
        }));

        return { success: true, data: enriched, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } };
    }

    async getSummary() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalMovements, todayMovements, inboundStats, outboundStats] = await Promise.all([
            this.prisma.stockMovement.count(),
            this.prisma.stockMovement.count({ where: { createdAt: { gte: today } } }),
            this.prisma.stockMovement.aggregate({
                where: { type: { in: [StockMovementType.INBOUND, StockMovementType.PRODUCTION_IN, StockMovementType.RETURN] } },
                _sum: { totalValue: true },
                _count: true,
            }),
            this.prisma.stockMovement.aggregate({
                where: { type: { in: [StockMovementType.OUTBOUND, StockMovementType.PRODUCTION_OUT, StockMovementType.WASTE] } },
                _sum: { totalValue: true },
                _count: true,
            }),
        ]);

        return {
            success: true,
            data: {
                totalMovements,
                todayMovements,
                inboundCount: inboundStats._count,
                outboundCount: outboundStats._count,
                totalInboundValue: Number(inboundStats._sum.totalValue ?? 0),
                totalOutboundValue: Number(outboundStats._sum.totalValue ?? 0),
            },
        };
    }

    async getRecentMovements(limit: number) {
        const data = await this.prisma.stockMovement.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        const materialIds = [...new Set(data.filter(d => d.materialId).map(d => d.materialId!))];
        const productIds = [...new Set(data.filter(d => d.productId).map(d => d.productId!))];

        const [materials, products] = await Promise.all([
            materialIds.length > 0
                ? this.prisma.material.findMany({ where: { id: { in: materialIds } }, select: { id: true, name: true } })
                : [],
            productIds.length > 0
                ? this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
                : [],
        ]);

        const materialMap = new Map(materials.map(m => [m.id, m] as [string, typeof m]));
        const productMap = new Map(products.map(p => [p.id, p] as [string, typeof p]));

        return {
            success: true,
            data: data.map(item => ({
                ...item,
                material: item.materialId ? materialMap.get(item.materialId) : null,
                product: item.productId ? productMap.get(item.productId) : null,
            })),
        };
    }
}
