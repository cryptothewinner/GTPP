import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGLAccountDto } from './dto/create-gl-account.dto';
import { CreateJournalEntryDto, PostingType } from './dto/create-journal-entry.dto';

@Injectable()
export class AccountingService {
    constructor(private readonly prisma: PrismaService) { }

    async createGLAccount(dto: CreateGLAccountDto) {
        const existing = await this.prisma.gLAccount.findUnique({ where: { accountNumber: dto.accountNumber } });
        if (existing) throw new BadRequestException('Bu hesap numarası zaten var.');

        const company = await this.prisma.companyCode.findFirst();
        if (!company) throw new BadRequestException('Şirket kodu bulunamadı.');

        return this.prisma.gLAccount.create({
            data: {
                ...dto,
                companyCode: { connect: { id: company.id } }
            }
        });
    }

    async findAllGLAccounts() {
        return this.prisma.gLAccount.findMany({ orderBy: { accountNumber: 'asc' } });
    }

    private async generateDocNumber(year: number): Promise<string> {
        const prefix = `FI-${year}-`;
        const lastDoc = await this.prisma.journalEntry.findFirst({
            where: { fiscalYear: year },
            orderBy: { entryNumber: 'desc' },
        });

        let seq = 1;
        if (lastDoc) {
            const parts = lastDoc.entryNumber.split('-');
            if (parts.length === 3) {
                seq = parseInt(parts[2], 10) + 1;
            }
        }
        return `${prefix}${String(seq).padStart(8, '0')}`;
    }

    async createJournalEntry(dto: CreateJournalEntryDto) {
        const date = dto.postingDate ? new Date(dto.postingDate) : new Date();
        const year = date.getFullYear();
        const period = date.getMonth() + 1;
        const entryNumber = await this.generateDocNumber(year);

        const company = await this.prisma.companyCode.findFirst();
        if (!company) throw new BadRequestException('Şirket kodu bulunamadı.');

        let totalDebit = 0;
        let totalCredit = 0;

        for (const item of dto.items) {
            if (item.postingType === PostingType.DEBIT) totalDebit += item.amount;
            else totalCredit += item.amount;
        }

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new BadRequestException(`Borç ve Alacak eşit değil! Fark: ${totalDebit - totalCredit}`);
        }

        return this.prisma.journalEntry.create({
            data: {
                companyCode: { connect: { id: company.id } },
                fiscalYear: year,
                period,
                entryNumber,
                documentDate: new Date(),
                postingDate: date,
                headerText: dto.headerText,
                reference: dto.reference,
                currency: dto.currency,
                status: 'POSTED',
                items: {
                    create: dto.items.map(item => ({
                        glAccountId: item.glAccountId,
                        debit: item.postingType === PostingType.DEBIT ? item.amount : 0,
                        credit: item.postingType === PostingType.CREDIT ? item.amount : 0,
                        costCenterId: item.costCenterId,
                        description: item.description,
                    }))
                }
            },
            include: { items: { include: { glAccount: true } } }
        });
    }

    async findAllJournalEntries() {
        return this.prisma.journalEntry.findMany({
            include: { items: { include: { glAccount: true } } },
            orderBy: { entryNumber: 'desc' }
        });
    }

    async getAccountForProcess(processKey: string, companyCodeId?: string): Promise<string> {
        const resolvedCompanyCodeId = companyCodeId ?? (await this.prisma.companyCode.findFirst())?.id;
        if (!resolvedCompanyCodeId) {
            throw new BadRequestException({
                error: 'ACCOUNTING_COMPANY_CODE_NOT_CONFIGURED',
                message: 'Hesap belirleme için şirket kodu bulunamadı.',
                details: { processKey },
            });
        }

        const mapping = await this.prisma.accountingProcessMapping.findUnique({
            where: {
                companyCodeId_processKey: {
                    companyCodeId: resolvedCompanyCodeId,
                    processKey,
                },
            },
        });

        if (!mapping || !mapping.isActive) {
            throw new BadRequestException({
                error: 'ACCOUNTING_PROCESS_MAPPING_MISSING',
                message: 'Süreç için GL hesap mapping kaydı bulunamadı.',
                details: { companyCodeId: resolvedCompanyCodeId, processKey },
            });
        }

        const account = await this.prisma.gLAccount.findUnique({ where: { accountNumber: mapping.glAccountNumber } });
        if (!account) {
            throw new BadRequestException({
                error: 'ACCOUNTING_PROCESS_GL_ACCOUNT_INVALID',
                message: 'Süreç mapping kaydındaki GL hesap ana veride bulunamadı.',
                details: {
                    companyCodeId: resolvedCompanyCodeId,
                    processKey,
                    glAccountNumber: mapping.glAccountNumber,
                },
            });
        }

        return account.id;
    }
}
