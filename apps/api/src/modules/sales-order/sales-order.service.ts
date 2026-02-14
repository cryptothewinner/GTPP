import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';

@Injectable()
export class SalesOrderService {
    constructor(private readonly prisma: PrismaService) { }

    private deriveDeliveryStatus(order: {
        deliveries: Array<{ status: string }>;
        items: Array<{ deliveryStatus: string }>;
    }): string | undefined {
        const itemStatuses = order.items
            .map((item) => item.deliveryStatus)
            .filter(Boolean);

        if (itemStatuses.length > 0) {
            const normalizedItemStatuses = itemStatuses.map((status) => status.toUpperCase());
            if (normalizedItemStatuses.every((status) => status === 'FULL')) return 'FULL';
            if (normalizedItemStatuses.every((status) => status === 'PENDING')) return 'PENDING';
            return 'PARTIAL';
        }

        if (order.deliveries.length === 0) return undefined;

        const deliveryStatuses = order.deliveries
            .map((delivery) => delivery.status)
            .filter(Boolean)
            .map((status) => status.toUpperCase());

        if (deliveryStatuses.length === 0) return undefined;
        if (deliveryStatuses.every((status) => ['ISSUED', 'SHIPPED'].includes(status))) return 'FULL';
        if (deliveryStatuses.every((status) => ['DRAFT', 'OPEN', 'PENDING'].includes(status))) return 'PENDING';
        return 'PARTIAL';
    }

    private deriveBillingStatus(order: {
        invoices: Array<{ status: string }>;
    }): string | undefined {
        if (order.invoices.length === 0) return undefined;

        const invoiceStatuses = order.invoices
            .map((invoice) => invoice.status)
            .filter(Boolean)
            .map((status) => status.toUpperCase());

        if (invoiceStatuses.length === 0) return undefined;
        if (invoiceStatuses.every((status) => status === 'POSTED')) return 'BILLED';
        if (invoiceStatuses.every((status) => status === 'DRAFT')) return 'PENDING';
        if (invoiceStatuses.every((status) => status === 'CANCELLED')) return 'CANCELLED';
        return 'PARTIAL';
    }

    private async generateOrderNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `SO-${year}-`;
        const lastOrder = await this.prisma.salesOrder.findFirst({
            where: { orderNumber: { startsWith: prefix } },
            orderBy: { orderNumber: 'desc' },
        });

        let seq = 1;
        if (lastOrder) {
            const parts = lastOrder.orderNumber.split('-');
            if (parts.length === 3) {
                seq = parseInt(parts[2], 10) + 1;
            }
        }
        return `${prefix}${String(seq).padStart(6, '0')}`;
    }

    async create(dto: CreateSalesOrderDto) {
        const customer = await this.prisma.businessPartner.findUnique({ where: { id: dto.customerId } });
        if (!customer) throw new NotFoundException('Müşteri bulunamadı.');

        const orderNumber = await this.generateOrderNumber();

        let totalNet = 0;
        const currency = dto.currency || 'TRY';

        const itemsData = dto.items.map(item => {
            const netAmount = item.quantity * item.unitPrice;
            const taxAmount = netAmount * 0.20;
            totalNet += netAmount;
            return {
                materialId: item.materialId,
                plantId: item.plantId || null,
                quantity: item.quantity,
                unit: item.unit,
                netPrice: item.unitPrice,
                netAmount,
                taxAmount,
            };
        });

        return this.prisma.salesOrder.create({
            data: {
                orderNumber,
                customerId: dto.customerId,
                salesOrgId: dto.salesOrgId,
                customerRef: dto.customerRef,
                requestedDate: dto.requestedDeliveryDate ? new Date(dto.requestedDeliveryDate) : undefined,
                currency,
                totalNetAmount: totalNet,
                totalTaxAmount: totalNet * 0.20,
                totalGrossAmount: totalNet * 1.20,
                items: {
                    create: itemsData,
                },
            },
            include: { items: true, customer: true },
        });
    }

    async findAll() {
        const orders = await this.prisma.salesOrder.findMany({
            include: {
                customer: true,
                items: true,
                deliveries: { select: { status: true } },
                invoices: { select: { status: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return orders.map(({ deliveries, invoices, ...order }) => ({
            ...order,
            deliveryStatus: this.deriveDeliveryStatus({ deliveries, items: order.items }),
            billingStatus: this.deriveBillingStatus({ invoices }),
        }));
    }

    async findOne(id: string) {
        const order = await this.prisma.salesOrder.findUnique({
            where: { id },
            include: { customer: true, salesOrg: true, items: { include: { material: true } } },
        });
        if (!order) throw new NotFoundException('Sipariş bulunamadı.');
        return order;
    }

    async update(id: string, dto: UpdateSalesOrderDto) {
        const existing = await this.prisma.salesOrder.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Sipariş bulunamadı.');

        if (dto.items) {
            let totalNet = 0;

            const itemsData = dto.items.map(item => {
                const netAmount = item.quantity * item.unitPrice;
                const taxAmount = netAmount * 0.20;
                totalNet += netAmount;
                return {
                    materialId: item.materialId,
                    plantId: item.plantId || null,
                    quantity: item.quantity,
                    unit: item.unit,
                    netPrice: item.unitPrice,
                    netAmount,
                    taxAmount,
                };
            });

            return this.prisma.salesOrder.update({
                where: { id },
                data: {
                    customerId: dto.customerId,
                    salesOrgId: dto.salesOrgId,
                    customerRef: dto.customerRef,
                    requestedDate: dto.requestedDeliveryDate ? new Date(dto.requestedDeliveryDate) : undefined,
                    currency: dto.currency,
                    status: dto.status,
                    totalNetAmount: totalNet,
                    totalTaxAmount: totalNet * 0.20,
                    totalGrossAmount: totalNet * 1.20,
                    items: { deleteMany: {}, create: itemsData },
                },
                include: { items: { include: { material: true } }, customer: true },
            });
        }

        return this.prisma.salesOrder.update({
            where: { id },
            data: {
                customerId: dto.customerId,
                salesOrgId: dto.salesOrgId,
                customerRef: dto.customerRef,
                requestedDate: dto.requestedDeliveryDate ? new Date(dto.requestedDeliveryDate) : undefined,
                currency: dto.currency,
                status: dto.status,
            },
            include: { items: { include: { material: true } }, customer: true },
        });
    }

    async remove(id: string) {
        const existing = await this.prisma.salesOrder.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Sipariş bulunamadı.');
        if (existing.status !== 'DRAFT') {
            throw new BadRequestException('Yalnızca Taslak durumundaki siparişler silinebilir.');
        }
        return this.prisma.salesOrder.delete({ where: { id } });
    }

    async findAllSalesOrgs() {
        return this.prisma.salesOrg.findMany({ orderBy: { code: 'asc' } });
    }
}
