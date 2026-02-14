import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
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

    private throwCustomizingError(code: string, message: string, details?: Record<string, unknown>): never {
        throw new BadRequestException({
            error: code,
            message,
            details,
        });
    }

    async create(dto: CreateInvoiceDto) {
        const delivery = await this.prisma.outboundDelivery.findUnique({
            where: { id: dto.deliveryId },
            include: {
                salesOrder: {
                    include: {
                        salesOrg: true,
                    },
                },
                items: { include: { salesOrderItem: true } },
            },
        });
        if (!delivery) throw new NotFoundException('Teslimat belgesi bulunamadı.');

        if (!delivery.salesOrder) {
            this.throwCustomizingError(
                'INVOICE_SOURCE_SALES_ORDER_MISSING',
                'Teslimat belgesi bağlı satış siparişi olmadan faturalandırılamaz.',
                { deliveryId: dto.deliveryId },
            );
        }

        const invoiceDate = dto.invoiceDate ? new Date(dto.invoiceDate) : new Date();
        const companyCodeIdFromSO = delivery.salesOrder.salesOrg?.companyCodeId;

        const companyCodeConfig = await this.prisma.companyCodeConfiguration.findUnique({
            where: { salesOrgId: delivery.salesOrder.salesOrgId },
        });

        const companyCodeId = companyCodeIdFromSO ?? companyCodeConfig?.defaultCompanyCodeId;
        if (!companyCodeId) {
            this.throwCustomizingError(
                'INVOICE_COMPANY_CODE_NOT_CONFIGURED',
                'Fatura için şirket kodu belirlenemedi. Satış organizasyonu için şirket kodu customizing kaydı eksik.',
                { salesOrgId: delivery.salesOrder.salesOrgId },
            );
        }

        const taxConfig = await this.prisma.taxConfiguration.findFirst({
            where: {
                companyCodeId,
                taxCode: 'OUTPUT_VAT',
                isActive: true,
                validFrom: { lte: invoiceDate },
                OR: [{ validTo: null }, { validTo: { gte: invoiceDate } }],
            },
            orderBy: { validFrom: 'desc' },
        });

        if (!taxConfig) {
            this.throwCustomizingError(
                'INVOICE_TAX_RATE_NOT_CONFIGURED',
                'Fatura vergi oranı customizing kaydı bulunamadı.',
                { companyCodeId, taxCode: 'OUTPUT_VAT' },
            );
        }

        const taxRate = Number(taxConfig.rate);
        if (!Number.isFinite(taxRate) || taxRate < 0) {
            this.throwCustomizingError(
                'INVOICE_TAX_RATE_INVALID',
                'Fatura için tanımlı vergi oranı geçersiz.',
                { companyCodeId, taxCode: taxConfig.taxCode, rate: taxConfig.rate.toString() },
            );
        }

        const paymentTermConfig = await this.prisma.paymentTermConfiguration.findUnique({
            where: {
                companyCodeId_process: {
                    companyCodeId,
                    process: 'INVOICE_CREATE',
                },
            },
        });

        if (!paymentTermConfig || !paymentTermConfig.isActive) {
            this.throwCustomizingError(
                'INVOICE_PAYMENT_TERM_NOT_CONFIGURED',
                'Fatura ödeme vadesi customizing kaydı bulunamadı.',
                { companyCodeId, process: 'INVOICE_CREATE' },
            );
        }

        const currencyConfig = await this.prisma.currencyConfiguration.findUnique({
            where: { companyCodeId },
        });
        const currency = delivery.salesOrder.currency || currencyConfig?.defaultCurrency;
        if (!currency) {
            this.throwCustomizingError(
                'INVOICE_CURRENCY_NOT_CONFIGURED',
                'Fatura para birimi belirlenemedi. Satış siparişi para birimi veya şirket varsayılan para birimi eksik.',
                { companyCodeId, salesOrderId: delivery.salesOrderId },
            );
        }

        const deliveryItemIds = delivery.items.map((item) => item.id);
        if (deliveryItemIds.length > 0) {
            const existingInvoice = await this.prisma.invoice.findFirst({
                where: {
                    items: {
                        some: {
                            outboundDeliveryItemId: {
                                in: deliveryItemIds,
                            },
                        },
                    },
                },
                select: {
                    id: true,
                    invoiceNumber: true,
                },
            });

            if (existingInvoice) {
                throw new ConflictException({
                    message: 'Bu teslimat için zaten bir fatura mevcut.',
                    existingInvoiceId: existingInvoice.id,
                    existingInvoiceNumber: existingInvoice.invoiceNumber,
                });
            }
        }

        const invoiceNumber = await this.generateInvoiceNumber();
        let totalNet = 0;
        const itemsData = [];

        const sourceItems = dto.items?.length
            ? dto.items.map((itemDto) => ({
                deliveryItemId: itemDto.deliveryItemId,
                quantity: Number(itemDto.quantity),
            }))
            : delivery.items.map((deliveryItem) => ({
                deliveryItemId: deliveryItem.id,
                quantity: Number(deliveryItem.quantity),
            }));

        for (const itemDto of sourceItems) {
            const delItem = delivery.items.find(i => i.id === itemDto.deliveryItemId);
            if (!delItem) continue;

            const unitPrice = delItem.salesOrderItem ? Number(delItem.salesOrderItem.netPrice) : 0;
            const netAmount = Number(itemDto.quantity) * unitPrice;
            totalNet += netAmount;

            const taxAmount = netAmount * (taxRate / 100);
            itemsData.push({
                salesOrderItemId: delItem.salesOrderItemId,
                outboundDeliveryItemId: delItem.id,
                materialId: delItem.materialId,
                quantity: itemDto.quantity,
                unit: delItem.unit,
                netPrice: unitPrice,
                netAmount: netAmount,
                taxAmount,
                grossAmount: netAmount + taxAmount,
            });
        }

        const totalTax = totalNet * (taxRate / 100);
        const totalGross = totalNet + totalTax;

        return this.prisma.invoice.create({
            data: {
                invoiceNumber,
                companyCodeId,
                customerId: delivery.customerId,
                salesOrderId: delivery.salesOrderId,
                invoiceDate,
                dueDate: new Date(new Date(invoiceDate).setDate(invoiceDate.getDate() + paymentTermConfig.dueDays)),
                currency,
                totalNetAmount: totalNet,
                totalTaxAmount: totalTax,
                totalGrossAmount: totalGross,
                status: 'DRAFT',
                items: {
                    create: itemsData,
                },
            },
            include: {
                customer: true,
                salesOrder: true,
                items: true,
            },
        });
    }

    async postToAccounting(id: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!invoice) throw new NotFoundException('Fatura bulunamadı.');
        if (invoice.status === 'POSTED') throw new BadRequestException('Bu fatura zaten muhasebeleşmiş.');

        const accReceivables = await this.accountingService.getAccountForProcess('RECEIVABLES', invoice.companyCodeId);
        const accRevenue = await this.accountingService.getAccountForProcess('REVENUE_DOMESTIC', invoice.companyCodeId);
        const accVat = await this.accountingService.getAccountForProcess('VAT_OUTPUT', invoice.companyCodeId);

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

        await this.accountingService.createJournalEntry({
            headerText: `Invoice ${invoice.invoiceNumber}`,
            reference: invoice.invoiceNumber,
            postingDate: new Date().toISOString(),
            currency: invoice.currency,
            items: items,
        });

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
