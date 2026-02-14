import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AccountingService } from '../accounting/accounting.service';
import { PostingType } from '../accounting/dto/create-journal-entry.dto';

@Injectable()
export class InvoiceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly accountingService: AccountingService,
    ) { }

    private async generateInvoiceNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `INV-${year}-`;
        const lastDoc = await this.prisma.invoice.findFirst({
            where: { invoiceNumber: { startsWith: prefix } },
            orderBy: { invoiceNumber: 'desc' },
        });

        let seq = 1;
        if (lastDoc) {
            const parts = lastDoc.invoiceNumber.split('-');
            if (parts.length === 3) {
                seq = parseInt(parts[2], 10) + 1;
            }
        }
        return `${prefix}${String(seq).padStart(6, '0')}`;
    }

    async create(dto: CreateInvoiceDto) {
        const delivery = await this.prisma.outboundDelivery.findUnique({
            where: { id: dto.deliveryId },
            include: { items: { include: { salesOrderItem: true } } },
        });
        if (!delivery) throw new NotFoundException('Teslimat belgesi bulunamadı.');

        const invoiceNumber = await this.generateInvoiceNumber();
        let totalNet = 0;
        const itemsData = [];

        for (const itemDto of dto.items) {
            const delItem = delivery.items.find(i => i.id === itemDto.deliveryItemId);
            if (!delItem) continue;

            const salesOrderItem = await this.prisma.salesOrderItem.findUnique({
                where: { id: delItem.salesOrderItemId }
            });

            const unitPrice = salesOrderItem ? Number(salesOrderItem.netPrice) : 0;
            const netAmount = Number(itemDto.quantity) * unitPrice;
            totalNet += netAmount;

            itemsData.push({
                salesOrderItemId: delItem.salesOrderItemId,
                outboundDeliveryItemId: delItem.id,
                materialId: delItem.materialId,
                quantity: itemDto.quantity,
                unit: delItem.unit, // Assuming unit matches
                netPrice: unitPrice,
                netAmount: netAmount,
                taxAmount: netAmount * 0.20, // 20% VAT hardcoded
                grossAmount: netAmount * 1.20,
            });
        }

        const totalTax = totalNet * 0.20;
        const totalGross = totalNet + totalTax;

        return this.prisma.invoice.create({
            data: {
                invoiceNumber,
                companyCodeId: '1000', // Hardcoded or fetch from linked structures
                customerId: delivery.customerId,
                salesOrderId: delivery.salesOrderId,
                invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : new Date(),
                dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // +30 days
                currency: 'TRY', // Should come from SO
                totalNetAmount: totalNet,
                totalTaxAmount: totalTax,
                totalGrossAmount: totalGross,
                status: 'DRAFT',
                items: {
                    create: itemsData
                }
            },
            include: { items: true }
        });
    }

    async postToAccounting(id: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!invoice) throw new NotFoundException('Fatura bulunamadı.');
        if (invoice.status === 'POSTED') throw new BadRequestException('Bu fatura zaten muhasebeleşmiş.');

        // 1. Prepare Journal Entry
        // Debit: Receivables (120) - Total Gross
        // Credit: Revenue (600) - Total Net
        // Credit: VAT Output (391) - Total Tax

        // Get GL Accounts (Mock lookup for now, real implementation would use AccountDeterminationService)
        const accReceivables = await this.accountingService.getAccountForProcess('RECEIVABLES');
        const accRevenue = await this.accountingService.getAccountForProcess('REVENUE_DOMESTIC');
        const accVat = await this.accountingService.getAccountForProcess('VAT_OUTPUT');

        const items = [
            {
                glAccountId: accReceivables,
                postingType: PostingType.DEBIT,
                amount: Number(invoice.totalGrossAmount),
                description: `Invoice ${invoice.invoiceNumber} - Customer ${invoice.customerId}`
            },
            {
                glAccountId: accRevenue,
                postingType: PostingType.CREDIT,
                amount: Number(invoice.totalNetAmount),
                description: `Revenue - Invoice ${invoice.invoiceNumber}`
            },
            {
                glAccountId: accVat,
                postingType: PostingType.CREDIT,
                amount: Number(invoice.totalTaxAmount),
                description: `VAT - Invoice ${invoice.invoiceNumber}`
            }
        ];

        // 2. Post Journal Entry
        const je = await this.accountingService.createJournalEntry({
            headerText: `Invoice ${invoice.invoiceNumber}`,
            reference: invoice.invoiceNumber,
            postingDate: new Date().toISOString(), // Or invoice date
            currency: invoice.currency,
            items: items,
        });

        // 3. Update Invoice Status
        return this.prisma.invoice.update({
            where: { id },
            data: { status: 'POSTED' }
        });
    }

    async findAll() {
        return this.prisma.invoice.findMany({
            include: { items: true, customer: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.invoice.findUnique({
            where: { id },
            include: { items: true, customer: true }
        });
    }
}
