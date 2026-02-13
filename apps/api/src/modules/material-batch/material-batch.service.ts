import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaterialBatchDto } from './dto/create-material-batch.dto';

interface FindAllParams {
    page: number;
    pageSize: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, any>;
}

@Injectable()
export class MaterialBatchService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: CreateMaterialBatchDto) {
        return this.prisma.materialBatch.create({
            data: {
                ...data,
                remainingQuantity: data.quantity, // Initialize remaining quantity
                manufacturingDate: data.manufacturingDate ? new Date(data.manufacturingDate) : undefined,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
            },
        });
    }

    async findAll(params: FindAllParams) {
        const { page, pageSize, sortField, sortOrder, search, filters } = params;
        const skip = (page - 1) * pageSize;

        const where: Record<string, any> = {};

        if (search) {
            where.OR = [
                { batchNumber: { contains: search, mode: 'insensitive' } },
                { supplierLotNo: { contains: search, mode: 'insensitive' } },
                { storageLocation: { contains: search, mode: 'insensitive' } },
                { material: { name: { contains: search, mode: 'insensitive' } } },
                { material: { code: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (filters) {
            for (const [key, filter] of Object.entries(filters)) {
                if (!filter) continue;
                if (filter.filterType === 'text') {
                    if (key === 'material.code' || key === 'material.name') {
                        // Handle potential nested filtering if AG Grid sends it like this
                        // Simplification for now: assuming flat structure or handling in controller
                    }
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

        const orderBy: any = {};
        if (sortField) {
            if (sortField.includes('.')) {
                // Handle nested sort like material.name
                const [relation, field] = sortField.split('.');
                orderBy[relation] = { [field]: sortOrder || 'asc' };
            } else {
                orderBy[sortField] = sortOrder || 'asc';
            }
        } else {
            orderBy.createdAt = 'desc';
        }

        const [data, total] = await Promise.all([
            this.prisma.materialBatch.findMany({
                where,
                orderBy: orderBy as any, // Cast to any to bypass strict typing for dynamic sort
                skip,
                take: pageSize,
                include: {
                    material: { select: { code: true, name: true, type: true, unitOfMeasure: true } },
                },
            }),
            this.prisma.materialBatch.count({ where }),
        ]);

        return { success: true, data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } };
    }

    async findOne(id: string) {
        const batch = await this.prisma.materialBatch.findUnique({
            where: { id },
            include: {
                material: true,
                consumptions: {
                    include: {
                        productionBatch: {
                            include: {
                                productionOrder: {
                                    include: {
                                        product: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        timestamp: 'desc',
                    },
                },
            },
        });
        if (!batch) throw new NotFoundException(`Malzeme partisi bulunamadı: ${id}`);
        return batch;
    }
}
