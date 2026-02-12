import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface FindAllParams {
    page: number;
    pageSize: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, any>;
}

@Injectable()
export class StockService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: FindAllParams) {
        const { page, pageSize, sortField, sortOrder, search, filters } = params;
        const skip = (page - 1) * pageSize;

        // Build where clause
        const where: Record<string, any> = {};

        // Global search
        if (search) {
            where.OR = [
                { stockCode: { contains: search, mode: 'insensitive' } },
                { stockName: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Column-specific filters (AG Grid filter model format)
        if (filters) {
            for (const [key, filter] of Object.entries(filters)) {
                if (!filter) continue;

                if (filter.filterType === 'text') {
                    switch (filter.type) {
                        case 'contains':
                            where[key] = { contains: filter.filter, mode: 'insensitive' };
                            break;
                        case 'equals':
                            where[key] = filter.filter;
                            break;
                        case 'startsWith':
                            where[key] = { startsWith: filter.filter, mode: 'insensitive' };
                            break;
                        case 'endsWith':
                            where[key] = { endsWith: filter.filter, mode: 'insensitive' };
                            break;
                    }
                } else if (filter.filterType === 'number') {
                    switch (filter.type) {
                        case 'equals':
                            where[key] = filter.filter;
                            break;
                        case 'greaterThan':
                            where[key] = { gt: filter.filter };
                            break;
                        case 'lessThan':
                            where[key] = { lt: filter.filter };
                            break;
                        case 'inRange':
                            where[key] = { gte: filter.filter, lte: filter.filterTo };
                            break;
                    }
                }
            }
        }

        // Build orderBy
        const orderBy: Record<string, 'asc' | 'desc'> = {};
        if (sortField) {
            orderBy[sortField as any] = sortOrder || 'asc';
        } else {
            orderBy.stockCode = 'asc';
        }

        const [data, total] = await Promise.all([
            this.prisma.stock.findMany({
                where,
                orderBy: orderBy as any,
                skip,
                take: pageSize,
            }),
            this.prisma.stock.count({ where }),
        ]);

        return {
            success: true,
            data,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async findOne(id: string) {
        const stock = await this.prisma.stock.findUnique({ where: { id } });
        if (!stock) {
            throw new NotFoundException(`Stock with id '${id}' not found`);
        }
        return stock;
    }

    async update(id: string, dto: any) {
        // Verify exists
        await this.findOne(id);

        return this.prisma.stock.update({
            where: { id },
            data: dto,
        });
    }

    async getSummary() {
        const [totalProducts, lowStockCount, outOfStockCount, totalValueResults] = await Promise.all([
            this.prisma.stock.count({ where: { isActive: true } }),
            this.prisma.stock.count({ where: { isActive: true, currentStock: { gt: 0, lte: 10 } } }),
            this.prisma.stock.count({ where: { isActive: true, currentStock: { lte: 0 } } }),
            this.prisma.stock.findMany({
                where: { isActive: true },
                select: { currentStock: true, salePrice: true },
            })
        ]);

        const totalValue = totalValueResults.reduce((acc: number, curr: { currentStock: any; salePrice: any }) => acc + (Number(curr.currentStock) * Number(curr.salePrice)), 0);

        return {
            totalProducts,
            totalValue,
            lowStockCount,
            outOfStockCount,
        };
    }
}
