import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    async getOverview() {
        const [kpis, productionStatus, recentActivity] = await Promise.all([
            this.getKpis(),
            this.getProductionStatus(),
            this.getRecentActivity(),
        ]);

        return {
            kpis,
            productionStatus,
            recentActivity,
        };
    }

    async getKpis() {
        const [activeProducts, materialVarieties, releasedBatches, avgMargin] = await Promise.all([
            this.prisma.product.count({ where: { isActive: true } }),
            this.prisma.material.count({ where: { isActive: true } }),
            this.prisma.productionBatch.count({ where: { status: 'RELEASED' } }),
            this.prisma.product.aggregate({ where: { isActive: true }, _avg: { profitMargin: true } }),
        ]);

        return {
            activeProducts,
            materialVarieties,
            releasedBatches,
            avgProfitMargin: Math.round(Number(avgMargin._avg.profitMargin || 0) * 100) / 100,
        };
    }

    async getProductionStatus() {
        const statusGroups = await this.prisma.productionOrder.groupBy({
            by: ['status'],
            _count: { id: true },
        });

        return statusGroups.map((item) => ({
            status: item.status,
            count: item._count.id,
        }));
    }

    async getRecentActivity() {
        const batches = await this.prisma.productionBatch.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                productionOrder: { select: { id: true, orderNumber: true } },
            },
        });

        return batches.map((batch) => ({
            id: batch.id,
            batchNumber: batch.batchNumber,
            status: batch.status,
            quantity: Number(batch.quantity),
            productionOrder: batch.productionOrder
                ? { id: batch.productionOrder.id, orderNumber: batch.productionOrder.orderNumber }
                : undefined,
            createdAt: batch.createdAt.toISOString(),
        }));
    }
}
