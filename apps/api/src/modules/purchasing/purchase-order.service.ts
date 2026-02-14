import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseOrderDto, CreatePurchaseOrderFromRequisitionDto, UpdatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { POStatus, PRStatus } from '@prisma/client';

@Injectable()
export class PurchaseOrderService {
    constructor(private readonly prisma: PrismaService) { }

    private async generatePONumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `PO-${year}-`;

        const lastPO = await this.prisma.purchaseOrder.findFirst({
            where: { poNumber: { startsWith: prefix } },
            orderBy: { poNumber: 'desc' },
        });

        let seq = 1;
        if (lastPO) {
            const parts = lastPO.poNumber.split('-');
            if (parts.length === 3) {
                seq = parseInt(parts[2], 10) + 1;
            }
        }

        return `${prefix}${String(seq).padStart(4, '0')}`; // PO-2024-0001
    }

    async create(dto: CreatePurchaseOrderDto) {
        const poNumber = await this.generatePONumber();

        // Validate supplier and orgs existence if needed, but FK constraints handle it mostly.

        return this.prisma.purchaseOrder.create({
            data: {
                poNumber,
                supplierId: dto.supplierId,
                companyCodeId: dto.companyCodeId,
                purchOrgId: dto.purchOrgId,
                purchGroupId: dto.purchGroupId,
                documentDate: dto.documentDate ? new Date(dto.documentDate) : new Date(),
                currency: dto.currency || 'TRY',
                paymentTerm: dto.paymentTerm,
                incoterms: dto.incoterms,
                notes: dto.notes,
                status: POStatus.DRAFT,
                items: {
                    create: dto.items.map(item => ({
                        materialId: item.materialId,
                        quantity: item.quantity,
                        unit: item.unit,
                        netPrice: item.netPrice,
                        taxRate: item.taxRate ?? 20,
                        plantId: item.plantId,
                        storageLocId: item.storageLocId,
                        deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : null,
                        receivedQuantity: 0,
                        isOpen: true,
                    })),
                },
            },
            include: { items: true },
        });
    }


    async createFromRequisition(requisitionId: string, dto: CreatePurchaseOrderFromRequisitionDto) {
        const requisition = await this.prisma.purchaseRequisition.findUnique({
            where: { id: requisitionId },
            include: { items: true },
        });

        if (!requisition) {
            throw new NotFoundException(`Purchase Requisition not found: ${requisitionId}`);
        }

        if (requisition.status !== PRStatus.APPROVED) {
            throw new BadRequestException('Only approved requisitions can be converted to PO');
        }

        if (!requisition.items.length) {
            throw new BadRequestException('Requisition has no items to convert');
        }

        const nonMaterialItem = requisition.items.find(item => !item.materialId);
        if (nonMaterialItem) {
            throw new BadRequestException('All PR items must be linked to a material for PO conversion');
        }

        const poNumber = await this.generatePONumber();

        const po = await this.prisma.purchaseOrder.create({
            data: {
                poNumber,
                supplierId: dto.supplierId,
                companyCodeId: dto.companyCodeId,
                purchOrgId: dto.purchOrgId,
                purchGroupId: dto.purchGroupId,
                documentDate: dto.documentDate ? new Date(dto.documentDate) : new Date(),
                currency: dto.currency || 'TRY',
                notes: dto.notes || requisition.notes,
                status: POStatus.DRAFT,
                items: {
                    create: requisition.items.map((item) => ({
                        materialId: item.materialId!,
                        quantity: item.quantity,
                        unit: item.unit,
                        netPrice: 0,
                        taxRate: 20,
                        plantId: dto.plantId,
                        storageLocId: dto.storageLocId,
                        deliveryDate: item.deliveryDate,
                        receivedQuantity: 0,
                        isOpen: true,
                    })),
                },
            },
            include: { items: true },
        });

        await this.prisma.purchaseRequisition.update({
            where: { id: requisitionId },
            data: { status: PRStatus.CLOSED },
        });

        return po;
    }

    async findAll() {
        return this.prisma.purchaseOrder.findMany({
            include: {
                supplier: true,
                items: {
                    include: { material: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const po = await this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                purchasingOrg: true,
                companyCode: true,
                items: {
                    include: { material: true, plant: true }
                },
                inboundDeliveries: { // History
                    include: { items: true }
                }
            },
        });
        if (!po) throw new NotFoundException(`Purchase Order not found: ${id}`);
        return po;
    }

    async update(id: string, dto: UpdatePurchaseOrderDto) {
        await this.findOne(id);
        const data: any = { ...dto };
        return this.prisma.purchaseOrder.update({
            where: { id },
            data,
            include: { items: true },
        });
    }

    async updateStatus(id: string, status: POStatus) {
        const po = await this.findOne(id);

        // Add more complex state transition logic here
        if (po.status === POStatus.COMPLETED || po.status === POStatus.CANCELLED) {
            // Maybe allow reopening in strict cases, but generally no.
            throw new BadRequestException(`Cannot change status of a completed/cancelled PO`);
        }

        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status },
        });
    }

    async remove(id: string) {
        // Only allow delete if DRAFT
        const po = await this.findOne(id);
        if (po.status !== POStatus.DRAFT) {
            throw new BadRequestException('Only Draft POs can be deleted');
        }
        return this.prisma.purchaseOrder.delete({ where: { id } });
    }

    // ─── Metadata ───

    async findAllPurchasingOrgs() {
        return this.prisma.purchasingOrg.findMany();
    }

    async findAllPurchasingGroups() {
        return this.prisma.purchasingGroup.findMany();
    }

    async findAllCompanyCodes() {
        return this.prisma.companyCode.findMany();
    }
}
