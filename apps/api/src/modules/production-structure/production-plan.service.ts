import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductionPlanDto } from './dto/create-production-plan.dto';
import { ProductionPlanStatus } from '@prisma/client';

@Injectable()
export class ProductionPlanService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateProductionPlanDto) {
        return this.prisma.productionPlan.create({
            data: {
                ...dto,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
            },
        });
    }

    async findAll() {
        return this.prisma.productionPlan.findMany({
            orderBy: { startDate: 'desc' },
            include: {
                productionOrders: {
                    select: { id: true, orderNumber: true, status: true },
                },
            },
        });
    }

    async findOne(id: string) {
        const plan = await this.prisma.productionPlan.findUnique({
            where: { id },
            include: {
                productionOrders: {
                    include: { product: true },
                },
            },
        });
        if (!plan) throw new NotFoundException(`Plan not found: ${id}`);
        return plan;
    }

    async updateStatus(id: string, status: ProductionPlanStatus) {
        return this.prisma.productionPlan.update({
            where: { id },
            data: { status },
        });
    }
}
