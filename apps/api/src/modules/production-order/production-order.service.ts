import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductionOrderStatus } from '@prisma/client';

interface FindAllParams {
    page: number;
    pageSize: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, any>;
}

@Injectable()
export class ProductionOrderService {
    constructor(private readonly prisma: PrismaService) { }

    private async generateOrderNumber(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `UE-${dateStr}-`;

        const lastOrder = await this.prisma.productionOrder.findFirst({
            where: { orderNumber: { startsWith: prefix } },
            orderBy: { orderNumber: 'desc' },
        });

        let seq = 1;
        if (lastOrder) {
            const lastSeq = parseInt(lastOrder.orderNumber.split('-').pop() || '0', 10);
            seq = lastSeq + 1;
        }

        return `${prefix}${String(seq).padStart(3, '0')}`;
    }

    async findAll(params: FindAllParams) {
        const { page, pageSize, sortField, sortOrder, search, filters } = params;
        const skip = (page - 1) * pageSize;

        const where: Record<string, any> = {};

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { assignedTo: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } },
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
            orderBy.createdAt = 'desc';
        }

        const [data, total] = await Promise.all([
            this.prisma.productionOrder.findMany({
                where, orderBy: orderBy as any, skip, take: pageSize,
                include: {
                    product: { select: { id: true, code: true, name: true } },
                    recipe: { select: { id: true, code: true, name: true } },
                },
            }),
            this.prisma.productionOrder.count({ where }),
        ]);

        return { success: true, data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } };
    }

    async findOne(id: string) {
        const order = await this.prisma.productionOrder.findUnique({
            where: { id },
            include: { product: true, recipe: true, batches: true },
        });
        if (!order) throw new NotFoundException(`Üretim emri bulunamadı: ${id}`);
        return order;
    }

    async create(dto: any) {
        const orderNumber = await this.generateOrderNumber();
        const data: any = {
            ...dto,
            orderNumber,
        };

        if (dto.plannedStart) data.plannedStart = new Date(dto.plannedStart);
        if (dto.plannedEnd) data.plannedEnd = new Date(dto.plannedEnd);

        return this.prisma.productionOrder.create({
            data,
            include: { product: true, recipe: true },
        });
    }

    async update(id: string, dto: any) {
        await this.findOne(id);
        const data: any = { ...dto };
        if (dto.plannedStart) data.plannedStart = new Date(dto.plannedStart);
        if (dto.plannedEnd) data.plannedEnd = new Date(dto.plannedEnd);
        if (dto.status) data.status = dto.status as ProductionOrderStatus;

        return this.prisma.productionOrder.update({ where: { id }, data });
    }

    async start(id: string) {
        const order = await this.findOne(id);
        if (order.status !== 'DRAFT' && order.status !== 'PLANNED') {
            throw new BadRequestException(`Bu sipariş başlatılamaz. Mevcut durum: ${order.status}`);
        }
        return this.prisma.productionOrder.update({
            where: { id },
            data: { status: 'IN_PROGRESS', actualStart: new Date() },
        });
    }

    async complete(id: string) {
        const order = await this.findOne(id);
        if (order.status !== 'IN_PROGRESS') {
            throw new BadRequestException(`Bu sipariş tamamlanamaz. Mevcut durum: ${order.status}`);
        }
        return this.prisma.productionOrder.update({
            where: { id },
            data: { status: 'COMPLETED', actualEnd: new Date() },
        });
    }

    async getSummary() {
        const [byStatusRaw, overdueCount, totalPlannedResult] = await Promise.all([
            this.prisma.productionOrder.groupBy({ by: ['status'], _count: { id: true } }),
            this.prisma.productionOrder.count({
                where: {
                    plannedEnd: { lt: new Date() },
                    status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] },
                },
            }),
            this.prisma.productionOrder.aggregate({ _sum: { plannedQuantity: true } }),
        ]);

        const byStatus = byStatusRaw.map((item) => ({ status: item.status, count: item._count.id }));

        return {
            byStatus,
            overdueCount,
            totalPlannedQuantity: Number(totalPlannedResult._sum.plannedQuantity || 0),
        };
    }
    async checkMaterialAvailability(id: string) {
        const order = await this.prisma.productionOrder.findUnique({
            where: { id },
            include: {
                recipe: {
                    include: {
                        items: {
                            include: {
                                material: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order) throw new NotFoundException(`Üretim emri bulunamadı: ${id}`);
        if (!order.recipe) throw new BadRequestException(`Bu emre bağlı bir reçete bulunamadı.`);

        const scalingFactor = Number(order.plannedQuantity) / Number(order.recipe.batchSize);
        const missingItems: any[] = [];
        let isAvailable = true;

        for (const item of order.recipe.items) {
            const requiredBase = Number(item.quantity) * scalingFactor;
            const requiredWithWastage = requiredBase * (1 + (Number(item.wastagePercent) / 100));

            const currentStock = Number(item.material.currentStock);

            if (currentStock < requiredWithWastage) {
                isAvailable = false;
                missingItems.push({
                    materialId: item.material.id,
                    materialName: item.material.name,
                    materialCode: item.material.code,
                    required: requiredWithWastage,
                    available: currentStock,
                    missing: requiredWithWastage - currentStock,
                    unit: item.material.unitOfMeasure,
                });
            }
        }

        return {
            isAvailable,
            missingItems,
            orderId: id,
            orderNumber: order.orderNumber,
        };
    }

    async reschedule(id: string, plannedStart: Date, plannedEnd: Date) {
        const order = await this.findOne(id);
        if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
            throw new BadRequestException(`Tamamlanmış veya iptal edilmiş siparişler yeniden planlanamaz.`);
        }

        return this.prisma.productionOrder.update({
            where: { id },
            data: {
                plannedStart,
                plannedEnd,
            },
        });
    }
}
