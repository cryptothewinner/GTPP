import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlantService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.plant.findMany({
            include: {
                companyCode: true,
                _count: { select: { workCenters: true, plantSteps: true } }
            },
            orderBy: { code: 'asc' }
        });
    }

    async findOne(id: string) {
        const plant = await this.prisma.plant.findUnique({
            where: { id },
            include: {
                companyCode: true,
                storageLocs: true,
            }
        });
        if (!plant) throw new NotFoundException(`Plant not found: ${id}`);
        return plant;
    }
}
