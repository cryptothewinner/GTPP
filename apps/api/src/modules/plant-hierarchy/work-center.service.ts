import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkCenterDto, UpdateWorkCenterDto } from './dto/create-work-center.dto';

@Injectable()
export class WorkCenterService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateWorkCenterDto) {
        return this.prisma.workCenter.create({
            data: dto,
            include: { plantStep: true, plant: true },
        });
    }

    async findAll(plantId?: string, plantStepId?: string) {
        const where: any = {};
        if (plantId) where.plantId = plantId;
        if (plantStepId) where.plantStepId = plantStepId;

        return this.prisma.workCenter.findMany({
            where,
            include: {
                plant: true,
                plantStep: true,
                _count: { select: { equipment: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const wc = await this.prisma.workCenter.findUnique({
            where: { id },
            include: {
                plant: true,
                plantStep: true,
                costCenter: true,
                equipment: { include: { capabilities: true } },
            },
        });
        if (!wc) throw new NotFoundException(`WorkCenter not found: ${id}`);
        return wc;
    }

    async update(id: string, dto: UpdateWorkCenterDto) {
        await this.findOne(id);
        return this.prisma.workCenter.update({
            where: { id },
            data: dto,
            include: { plantStep: true },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.workCenter.delete({ where: { id } });
    }
}
