import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseRequisitionDto, UpdatePurchaseRequisitionDto } from './dto/create-purchase-requisition.dto';
import { PRStatus } from '@prisma/client';

@Injectable()
export class PurchaseRequisitionService {
    constructor(private readonly prisma: PrismaService) { }

    private async generatePRNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `PR-${year}-`;

        const lastPR = await this.prisma.purchaseRequisition.findFirst({
            where: { prNumber: { startsWith: prefix } },
            orderBy: { prNumber: 'desc' },
        });

        let seq = 1;
        if (lastPR) {
            const parts = lastPR.prNumber.split('-');
            if (parts.length === 3) {
                seq = parseInt(parts[2], 10) + 1;
            }
        }

        return `${prefix}${String(seq).padStart(4, '0')}`; // PR-2024-0001
    }

    async create(dto: CreatePurchaseRequisitionDto) {
        const prNumber = await this.generatePRNumber();

        return this.prisma.purchaseRequisition.create({
            data: {
                prNumber,
                requestedBy: dto.requestedBy,
                notes: dto.notes,
                status: PRStatus.DRAFT,
                items: {
                    create: dto.items.map(item => ({
                        materialId: item.materialId,
                        materialName: item.materialName,
                        quantity: item.quantity,
                        unit: item.unit,
                        deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : null,
                        status: PRStatus.DRAFT,
                    })),
                },
            },
            include: { items: true },
        });
    }

    async findAll() {
        return this.prisma.purchaseRequisition.findMany({
            include: {
                items: {
                    include: { material: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const pr = await this.prisma.purchaseRequisition.findUnique({
            where: { id },
            include: {
                items: {
                    include: { material: true }
                }
            },
        });
        if (!pr) throw new NotFoundException(`Purchase Requisition not found: ${id}`);
        return pr;
    }

    async update(id: string, dto: UpdatePurchaseRequisitionDto) {
        await this.findOne(id);
        return this.prisma.purchaseRequisition.update({
            where: { id },
            data: dto,
            include: { items: true },
        });
    }

    async updateStatus(id: string, status: PRStatus) {
        const pr = await this.findOne(id);

        const transitionMap: Partial<Record<PRStatus, PRStatus[]>> = {
            [PRStatus.DRAFT]: [PRStatus.APPROVED, PRStatus.CANCELLED],
            [PRStatus.APPROVED]: [PRStatus.CLOSED, PRStatus.CANCELLED],
            [PRStatus.CLOSED]: [],
            [PRStatus.CANCELLED]: [],
        };

        const allowed = transitionMap[pr.status] ?? [];
        if (!allowed.includes(status)) {
            throw new BadRequestException(`Invalid PR status transition: ${pr.status} -> ${status}`);
        }

        return this.prisma.purchaseRequisition.update({
            where: { id },
            data: { status },
        });
    }

    async remove(id: string) {
        return this.prisma.purchaseRequisition.delete({ where: { id } });
    }
}
