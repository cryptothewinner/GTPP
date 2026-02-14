import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEquipmentDto, UpdateEquipmentDto } from './dto/create-equipment.dto';
import { CreateEquipmentCapabilityDto } from './dto/create-equipment-capability.dto';
import { EquipmentStatus } from '@prisma/client';

@Injectable()
export class EquipmentService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateEquipmentDto) {
        const data: any = { ...dto };
        if (dto.lastCalibration) data.lastCalibration = new Date(dto.lastCalibration);
        if (dto.nextCalibration) data.nextCalibration = new Date(dto.nextCalibration);
        if (dto.installDate) data.installDate = new Date(dto.installDate);

        return this.prisma.equipment.create({
            data,
            include: { workCenter: true, capabilities: true },
        });
    }

    async findAll(workCenterId?: string, status?: EquipmentStatus) {
        const where: any = {};
        if (workCenterId) where.workCenterId = workCenterId;
        if (status) where.status = status;

        return this.prisma.equipment.findMany({
            where,
            include: {
                workCenter: { include: { plantStep: true } },
                capabilities: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const eq = await this.prisma.equipment.findUnique({
            where: { id },
            include: {
                workCenter: { include: { plantStep: true } },
                capabilities: true,
                operations: { take: 5, orderBy: { createdAt: 'desc' } },
            },
        });
        if (!eq) throw new NotFoundException(`Equipment not found: ${id}`);
        return eq;
    }

    async update(id: string, dto: UpdateEquipmentDto) {
        await this.findOne(id);
        const data: any = { ...dto };
        if (dto.lastCalibration) data.lastCalibration = new Date(dto.lastCalibration);
        if (dto.nextCalibration) data.nextCalibration = new Date(dto.nextCalibration);
        if (dto.installDate) data.installDate = new Date(dto.installDate);

        return this.prisma.equipment.update({
            where: { id },
            data,
            include: { workCenter: true, capabilities: true },
        });
    }

    async updateStatus(id: string, status: EquipmentStatus) {
        await this.findOne(id);
        return this.prisma.equipment.update({
            where: { id },
            data: { status },
        });
    }

    async addCapability(equipmentId: string, dto: CreateEquipmentCapabilityDto) {
        await this.findOne(equipmentId);
        return this.prisma.equipmentCapability.create({
            data: { equipmentId, ...dto },
        });
    }

    async removeCapability(capabilityId: string) {
        const cap = await this.prisma.equipmentCapability.findUnique({ where: { id: capabilityId } });
        if (!cap) throw new NotFoundException(`Capability not found: ${capabilityId}`);
        return this.prisma.equipmentCapability.delete({ where: { id: capabilityId } });
    }

    async findByCapability(processType: string) {
        return this.prisma.equipment.findMany({
            where: {
                isActive: true,
                capabilities: { some: { processType } },
            },
            include: {
                workCenter: true,
                capabilities: { where: { processType } },
            },
        });
    }
}
