import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGLAccountDto } from './dto/create-gl-account.dto';
import { CreateJournalEntryDto, PostingType } from './dto/create-journal-entry.dto';

@Injectable()
export class AccountingService {
    constructor(private readonly prisma: PrismaService) { }

    // --- G/L Accounts ---

    async createGLAccount(dto: CreateGLAccountDto) {
        const existing = await this.prisma.gLAccount.findUnique({ where: { accountNumber: dto.accountNumber } });
        if (existing) throw new BadRequestException('Bu hesap numarası zaten var.');

        // Fetch default company if not provided (Simplification)
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

    // --- Journal Entries ---

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
        const period = date.getMonth() + 1; // Month 1-12
        const entryNumber = await this.generateDocNumber(year);

        // Fetch default company
        const company = await this.prisma.companyCode.findFirst();
        if (!company) throw new BadRequestException('Şirket kodu bulunamadı.');

        // Validation: Debits must equal Credits
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


    // --- Automatic Account Determination Helper ---
    // In a real system, this would look up configuration tables (T030).
    async getAccountForProcess(processKey: string): Promise<string> {
        // Mock Implementation
        const mapping = {
            'REVENUE_DOMESTIC': '600.01.001', // Yurt İçi Satışlar
            'VAT_OUTPUT': '391.01.001',       // Hesaplanan KDV
            'RECEIVABLES': '120.01.001',      // Alıcılar
            'INVENTORY_RAW': '150.01.001',    // İlk Madde ve Malzeme
            'KDV_INPUT': '191.01.001',
            // Add more as needed
        };

        const accNum = mapping[processKey];
        if (!accNum) throw new BadRequestException(`GL Account mapping missing for ${processKey}`);

        const account = await this.prisma.gLAccount.findUnique({ where: { accountNumber: accNum } });
        if (!account) throw new BadRequestException(`Configured GL Account ${accNum} does not exist in master data.`);

        return account.id;
    }
}
