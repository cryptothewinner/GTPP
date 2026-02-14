import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkStationDto } from './dto/create-work-station.dto';
import { WorkStationStatus } from '@prisma/client';

@Injectable()
export class WorkStationService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateWorkStationDto) {
        return this.prisma.workStation.create({ data: dto });
    }

    async findAll(siteId?: string) {
        return this.prisma.workStation.findMany({
            where: siteId ? { siteId } : {},
            include: { site: true },
        });
    }

    async findOne(id: string) {
        const station = await this.prisma.workStation.findUnique({
            where: { id },
            include: { site: true, operations: { take: 5, orderBy: { createdAt: 'desc' } } },
        });
        if (!station) throw new NotFoundException(`Station not found: ${id}`);
        return station;
    }

    async updateStatus(id: string, status: WorkStationStatus) {
        return this.prisma.workStation.update({
            where: { id },
            data: { status },
        });
    }

    // Additional methods for capacity checks could go here
}
