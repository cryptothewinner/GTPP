import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductionPlanDto } from './dto/create-production-plan.dto';

@Injectable()
export class ProductionPlanService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.productionPlan.findMany({
            include: {
                _count: {
                    select: {
                        productionOrders: true,
                    },
                },
            },
            orderBy: { startDate: 'desc' },
        });
    }

    async create(dto: CreateProductionPlanDto) {
        return this.prisma.productionPlan.create({
            data: {
                ...dto,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
            },
            include: {
                _count: {
                    select: {
                        productionOrders: true,
                    },
                },
            },
        });
    }

    async findOne(id: string) {
        const plan = await this.prisma.productionPlan.findUnique({
            where: { id },
            include: {
                productionOrders: true,
                _count: {
                    select: {
                        productionOrders: true,
                    },
                },
            },
        });

        if (!plan) {
            throw new NotFoundException(`Üretim planı bulunamadı: ${id}`);
        }

        return plan;
    }
}
