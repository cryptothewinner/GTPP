import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoutingDto } from './dto/create-routing.dto';
import { UpdateRoutingDto } from './dto/update-routing.dto';

@Injectable()
export class RoutingService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateRoutingDto) {
        return this.prisma.routing.create({
            data: {
                ...dto,
                steps: {
                    create: dto.steps,
                },
            },
            include: { steps: true, product: true },
        });
    }

    async findAll() {
        return this.prisma.routing.findMany({
            include: { steps: true, product: { select: { id: true, code: true, name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const routing = await this.prisma.routing.findUnique({
            where: { id },
            include: { steps: { orderBy: { stepNumber: 'asc' } }, product: true },
        });
        if (!routing) throw new NotFoundException(`Routing not found: ${id}`);
        return routing;
    }

    async findActiveByProduct(productId: string) {
        return this.prisma.routing.findFirst({
            where: { productId, isActive: true },
            orderBy: { version: 'desc' },
            include: { steps: { orderBy: { stepNumber: 'asc' } } },
        });
    }

    async update(id: string, dto: UpdateRoutingDto) {
        const { steps, ...data } = dto;

        if (steps) {
            await this.prisma.routingStep.deleteMany({ where: { routingId: id } });
            return this.prisma.routing.update({
                where: { id },
                data: {
                    ...data,
                    steps: {
                        create: steps,
                    },
                },
                include: { steps: true },
            });
        }

        return this.prisma.routing.update({
            where: { id },
            data: data,
            include: { steps: true },
        });
    }

    async remove(id: string) {
        return this.prisma.routing.delete({ where: { id } });
    }
}
