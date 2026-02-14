import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSalesQuotationDto } from './dto/create-sales-quotation.dto';
import { UpdateSalesQuotationDto } from './dto/update-sales-quotation.dto';
import { SalesOrderService } from '../sales-order/sales-order.service';

@Injectable()
export class SalesQuotationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly salesOrderService: SalesOrderService,
    ) { }

    private async generateQuoteNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `QT-${year}-`;
        const last = await this.prisma.salesQuotation.findFirst({
            where: { quoteNumber: { startsWith: prefix } },
            orderBy: { quoteNumber: 'desc' },
        });

        let seq = 1;
        if (last) {
            const parts = last.quoteNumber.split('-');
            if (parts.length === 3) {
                seq = parseInt(parts[2], 10) + 1;
            }
        }
        return `${prefix}${String(seq).padStart(5, '0')}`;
    }

    async create(dto: CreateSalesQuotationDto) {
        const customer = await this.prisma.businessPartner.findUnique({ where: { id: dto.customerId } });
        if (!customer) throw new NotFoundException('Müşteri bulunamadı.');

        const quoteNumber = await this.generateQuoteNumber();
        const currency = dto.currency || 'TRY';

        let totalNet = 0;
        const itemsData = dto.items.map(item => {
            const netAmount = item.quantity * item.unitPrice;
            const taxAmount = netAmount * 0.20;
            totalNet += netAmount;
            return {
                materialId: item.materialId,
                quantity: item.quantity,
                unit: item.unit || 'Adet',
                unitPrice: item.unitPrice,
                netAmount,
                taxAmount,
                notes: item.notes,
            };
        });

        const totalTax = totalNet * 0.20;

        return this.prisma.salesQuotation.create({
            data: {
                quoteNumber,
                customerId: dto.customerId,
                salesOrgId: dto.salesOrgId,
                validFrom: new Date(dto.validFrom),
                validTo: new Date(dto.validTo),
                currency,
                totalNetAmount: totalNet,
                totalTaxAmount: totalTax,
                totalGrossAmount: totalNet + totalTax,
                notes: dto.notes,
                items: { create: itemsData },
            },
            include: { items: true, customer: true },
        });
    }

    async findAll() {
        return this.prisma.salesQuotation.findMany({
            include: { customer: true, items: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const quotation = await this.prisma.salesQuotation.findUnique({
            where: { id },
            include: {
                customer: true,
                items: { include: { material: true } },
                salesOrg: true,
            },
        });
        if (!quotation) throw new NotFoundException('Teklif bulunamadı.');
        return quotation;
    }

    async update(id: string, dto: UpdateSalesQuotationDto) {
        const existing = await this.prisma.salesQuotation.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Teklif bulunamadı.');

        // If items are provided, recalculate totals and replace items
        if (dto.items) {
            let totalNet = 0;
            const itemsData = dto.items.map(item => {
                const netAmount = item.quantity * item.unitPrice;
                const taxAmount = netAmount * 0.20;
                totalNet += netAmount;
                return {
                    materialId: item.materialId,
                    quantity: item.quantity,
                    unit: item.unit || 'Adet',
                    unitPrice: item.unitPrice,
                    netAmount,
                    taxAmount,
                    notes: item.notes,
                };
            });

            const totalTax = totalNet * 0.20;

            return this.prisma.salesQuotation.update({
                where: { id },
                data: {
                    customerId: dto.customerId,
                    salesOrgId: dto.salesOrgId,
                    validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
                    validTo: dto.validTo ? new Date(dto.validTo) : undefined,
                    status: dto.status,
                    currency: dto.currency,
                    notes: dto.notes,
                    totalNetAmount: totalNet,
                    totalTaxAmount: totalTax,
                    totalGrossAmount: totalNet + totalTax,
                    items: {
                        deleteMany: {},
                        create: itemsData,
                    },
                },
                include: { items: true, customer: true },
            });
        }

        // Update header only
        return this.prisma.salesQuotation.update({
            where: { id },
            data: {
                customerId: dto.customerId,
                salesOrgId: dto.salesOrgId,
                validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
                validTo: dto.validTo ? new Date(dto.validTo) : undefined,
                status: dto.status,
                currency: dto.currency,
                notes: dto.notes,
            },
            include: { items: true, customer: true },
        });
    }

    async remove(id: string) {
        const existing = await this.prisma.salesQuotation.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Teklif bulunamadı.');
        return this.prisma.salesQuotation.delete({ where: { id } });
    }

    async convertToOrder(id: string, salesOrgId?: string, defaultPlantId?: string) {
        const quotation = await this.prisma.salesQuotation.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!quotation) throw new NotFoundException('Teklif bulunamadı.');
        if (quotation.status === 'CONVERTED') {
            throw new BadRequestException('Bu teklif zaten siparişe dönüştürüldü.');
        }
        if (quotation.status !== 'ACCEPTED') {
            throw new BadRequestException('Yalnızca Kabul Edilmiş teklifler siparişe dönüştürülebilir.');
        }

        const resolvedSalesOrgId = salesOrgId || quotation.salesOrgId;
        if (!resolvedSalesOrgId) {
            throw new BadRequestException('Satış Org. belirtilmelidir.');
        }

        const order = await this.salesOrderService.create({
            customerId: quotation.customerId,
            salesOrgId: resolvedSalesOrgId,
            currency: quotation.currency,
            items: quotation.items.map(item => ({
                materialId: item.materialId,
                quantity: Number(item.quantity),
                unit: item.unit,
                unitPrice: Number(item.unitPrice),
                plantId: defaultPlantId,
            })),
        });

        await this.prisma.salesQuotation.update({
            where: { id },
            data: { status: 'CONVERTED' },
        });

        return order;
    }
}
