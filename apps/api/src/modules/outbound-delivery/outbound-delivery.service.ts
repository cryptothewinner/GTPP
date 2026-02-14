import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOutboundDeliveryDto } from './dto/create-outbound-delivery.dto';
import { MaterialDocumentService } from '../material-document/material-document.service';
import { MovementType } from '@prisma/client';

@Injectable()
export class OutboundDeliveryService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly materialDocService: MaterialDocumentService,
    ) { }

    private async generateDeliveryNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `DN-${year}-`;
        const lastDoc = await this.prisma.outboundDelivery.findFirst({
            where: { deliveryNumber: { startsWith: prefix } },
            orderBy: { deliveryNumber: 'desc' },
        });

        let seq = 1;
        if (lastDoc) {
            const parts = lastDoc.deliveryNumber.split('-');
            if (parts.length === 3) {
                seq = parseInt(parts[2], 10) + 1;
            }
        }
        return `${prefix}${String(seq).padStart(6, '0')}`;
    }

    async create(dto: CreateOutboundDeliveryDto) {
        const salesOrder = await this.prisma.salesOrder.findUnique({
            where: { id: dto.salesOrderId },
            include: { items: true },
        });
        if (!salesOrder) throw new NotFoundException('Satış siparişi bulunamadı.');

        const deliveryNumber = await this.generateDeliveryNumber();

        const itemsData = [];
        for (const itemDto of dto.items) {
            const soItem = salesOrder.items.find(i => i.id === itemDto.salesOrderItemId);
            if (!soItem) continue;

            itemsData.push({
                salesOrderItemId: soItem.id,
                materialId: soItem.materialId,
                plantId: soItem.plantId,
                quantity: itemDto.quantity,
                unit: soItem.unit,
                batchNumber: itemDto.batchNumber,
            });
        }

        return this.prisma.outboundDelivery.create({
            data: {
                deliveryNumber,
                salesOrderId: dto.salesOrderId,
                customerId: salesOrder.customerId,
                deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : new Date(),
                status: 'Open', // Changed from DRAFT to Open based on generic string type or enum
                items: {
                    create: itemsData
                }
            },
            include: { items: true }
        });
    }

    async postGoodsIssue(id: string) {
        const delivery = await this.prisma.outboundDelivery.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!delivery) throw new NotFoundException('Teslimat belgesi bulunamadı.');
        if (delivery.status === 'Shipped') throw new BadRequestException('Bu teslimat zaten sevk edilmiş (PGI yapılmış).');

        // Create Material Document (Movement 601)
        const matDocDto = {
            movementType: MovementType.GI_SALES_ORDER,
            postingDate: new Date().toISOString(),
            reference: delivery.deliveryNumber,
            headerText: `Delivery ${delivery.deliveryNumber}`,
            items: delivery.items.map(item => ({
                materialId: item.materialId,
                plantId: item.plantId,
                quantity: Number(item.quantity),
                unit: item.unit,
                batchNumber: item.batchNumber,
            })),
        };

        // Execute Material Movement
        await this.materialDocService.create(matDocDto as any);

        // Update Delivery Status
        const updatedDelivery = await this.prisma.outboundDelivery.update({
            where: { id },
            data: {
                status: 'Shipped',
                actualGI: new Date(),
            }
        });

        // Update Sales Order Status to DELIVERED (Assumption: Full Delivery)
        // Ideally checking if all items are delivered
        await this.prisma.salesOrder.update({
            where: { id: delivery.salesOrderId },
            data: { status: 'DELIVERED' }
        });

        return updatedDelivery;
    }

    async findAll() {
        return this.prisma.outboundDelivery.findMany({
            include: { items: true, customer: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.outboundDelivery.findUnique({
            where: { id },
            include: { items: true, customer: true }
        });
    }
}
