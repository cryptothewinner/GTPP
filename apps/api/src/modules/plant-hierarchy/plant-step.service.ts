import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlantStepDto, UpdatePlantStepDto } from './dto/create-plant-step.dto';
import { PlantStepType } from '@prisma/client';

@Injectable()
export class PlantStepService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreatePlantStepDto) {
        return this.prisma.plantStep.create({ data: dto });
    }

    async findAll(plantId?: string, parentId?: string, type?: PlantStepType) {
        const where: any = {};
        if (plantId) where.plantId = plantId;
        if (parentId !== undefined) where.parentId = parentId || null;
        if (type) where.type = type;

        return this.prisma.plantStep.findMany({
            where,
            include: { parent: true, _count: { select: { children: true, workCenters: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async findTree(plantId?: string) {
        const where: any = {};
        if (plantId) where.plantId = plantId;

        const allSteps = await this.prisma.plantStep.findMany({
            where,
            include: { _count: { select: { workCenters: true } } },
            orderBy: { name: 'asc' },
        });

        const map = new Map<string, any>();
        const roots: any[] = [];

        for (const step of allSteps) {
            map.set(step.id, { ...step, children: [] });
        }

        for (const step of allSteps) {
            const node = map.get(step.id);
            if (step.parentId && map.has(step.parentId)) {
                map.get(step.parentId).children.push(node);
            } else {
                roots.push(node);
            }
        }

        return roots;
    }

    async findOne(id: string) {
        const step = await this.prisma.plantStep.findUnique({
            where: { id },
            include: {
                plant: true,
                parent: true,
                children: true,
                workCenters: { include: { _count: { select: { equipment: true } } } },
            },
        });
        if (!step) throw new NotFoundException(`PlantStep not found: ${id}`);
        return step;
    }

    async update(id: string, dto: UpdatePlantStepDto) {
        await this.findOne(id);
        return this.prisma.plantStep.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.plantStep.delete({ where: { id } });
    }
}
