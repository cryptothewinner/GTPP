import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { MaterialType } from '@prisma/client';

interface FindAllParams {
    page: number;
    pageSize: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, any>;
}

@Injectable()
export class MaterialService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: FindAllParams) {
        const { page, pageSize, sortField, sortOrder, search, filters } = params;
        const skip = (page - 1) * pageSize;

        const where: Record<string, any> = {};

        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
                { casNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (filters) {
            for (const [key, filter] of Object.entries(filters)) {
                if (!filter) continue;
                if (filter.filterType === 'text') {
                    switch (filter.type) {
                        case 'contains': where[key] = { contains: filter.filter, mode: 'insensitive' }; break;
                        case 'equals': where[key] = filter.filter; break;
                        case 'startsWith': where[key] = { startsWith: filter.filter, mode: 'insensitive' }; break;
                        case 'endsWith': where[key] = { endsWith: filter.filter, mode: 'insensitive' }; break;
                    }
                } else if (filter.filterType === 'number') {
                    switch (filter.type) {
                        case 'equals': where[key] = filter.filter; break;
                        case 'greaterThan': where[key] = { gt: filter.filter }; break;
                        case 'lessThan': where[key] = { lt: filter.filter }; break;
                        case 'inRange': where[key] = { gte: filter.filter, lte: filter.filterTo }; break;
                    }
                }
            }
        }

        const orderBy: Record<string, 'asc' | 'desc'> = {};
        if (sortField) {
            orderBy[sortField as any] = sortOrder || 'asc';
        } else {
            orderBy.code = 'asc';
        }

        const [data, total] = await Promise.all([
            this.prisma.material.findMany({
                where,
                orderBy: orderBy as any,
                skip,
                take: pageSize,
                include: {
                    supplier: { select: { id: true, code: true, name: true } },
                    batches: {
                        select: { batchNumber: true, status: true, remainingQuantity: true },
                        where: { status: 'AVAILABLE' },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    }
                }
            }),
            this.prisma.material.count({ where }),
        ]);

        return { success: true, data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } };
    }

    async findOne(id: string) {
        const material = await this.prisma.material.findUnique({ where: { id }, include: { supplier: true } });
        if (!material) throw new NotFoundException(`Malzeme bulunamadı: ${id}`);
        return material;
    }

    async create(dto: CreateMaterialDto) {
        const data = {
            ...dto,
            code: dto.code || await this.generateCode(dto.type),
        };
        return this.prisma.material.create({ data });
    }

    private async generateCode(type: MaterialType): Promise<string> {
        const prefixes: Record<MaterialType, string> = {
            RAW_MATERIAL: 'HM',
            PACKAGING: 'AM',
            SEMI_FINISHED: 'YM',
            FINISHED_PRODUCT: 'UR',
        };
        const prefix = prefixes[type] || 'M';

        const lastItem = await this.prisma.material.findFirst({
            where: { code: { startsWith: prefix } },
            orderBy: { code: 'desc' },
        });

        if (!lastItem) return `${prefix}-001`;

        const lastCode = lastItem.code;
        const numberPart = lastCode.split('-')[1];
        if (!numberPart || isNaN(Number(numberPart))) return `${prefix}-${Date.now()}`;

        const nextNumber = Number(numberPart) + 1;
        return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
    }

    async update(id: string, dto: any) {
        await this.findOne(id);
        return this.prisma.material.update({ where: { id }, data: dto });
    }

    async getSummary() {
        const [totalMaterials, lowStockRaw, byTypeRaw] = await Promise.all([
            this.prisma.material.count({ where: { isActive: true } }),
            this.prisma.$queryRaw`SELECT COUNT(*) as count FROM materials WHERE is_active = true AND current_stock < min_stock_level AND min_stock_level > 0` as Promise<any[]>,
            this.prisma.material.groupBy({ by: ['type'], where: { isActive: true }, _count: { id: true } }),
        ]);

        const lowStockCount = Number(lowStockRaw?.[0]?.count || 0);
        const byType = byTypeRaw.map((item) => ({ type: item.type, count: item._count.id }));

        return { totalMaterials, lowStockCount, byType };
    }

    async syncInitialBatches() {
        const materials = await this.prisma.material.findMany({
            include: { batches: true },
        });

        let createdCount = 0;

        for (const material of materials) {
            const currentStock = Number(material.currentStock);
            if (currentStock <= 0) continue;

            const batchTotal = material.batches.reduce((sum, b) => sum + Number(b.remainingQuantity), 0);

            // If there's a discrepancy or no batches at all for positive stock
            if (batchTotal < currentStock) {
                const diff = currentStock - batchTotal;

                await this.prisma.materialBatch.create({
                    data: {
                        materialId: material.id,
                        batchNumber: `${material.code}-INIT-${new Date().getFullYear()}`,
                        supplierLotNo: 'DEVIR',
                        quantity: diff,
                        remainingQuantity: diff,
                        status: 'AVAILABLE',
                        manufacturingDate: new Date(),
                        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                        storageLocation: 'DEPO-1',
                    },
                });
                createdCount++;
            }
        }

        return { success: true, message: `${createdCount} adet malzeme için açılış partisi oluşturuldu.` };
    }
}
