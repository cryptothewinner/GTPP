import { PrismaClient, AccountType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFI() {
    console.log('Seeding FI data...');

    const company = await prisma.companyCode.findUnique({ where: { code: '1000' } });
    if (!company) {
        throw new Error('Company Code 1000 not found! Please run the main seed first.');
    }

    // Standard Chart of Accounts (Tek Düzen Hesap Planı - Simplified)
    const accounts = [
        { code: '100.01.001', name: 'Merkez Kasa (TRY)', type: AccountType.ASSET },
        { code: '120.01.001', name: 'Alıcılar (Yurt İçi)', type: AccountType.ASSET, isReconciliation: true },
        { code: '150.01.001', name: 'Hammadde Stokları', type: AccountType.ASSET },
        { code: '151.01.001', name: 'Yarı Mamul Üretim', type: AccountType.ASSET },
        { code: '152.01.001', name: 'Mamul Stokları', type: AccountType.ASSET },
        { code: '191.01.001', name: 'İndirilecek KDV (%1)', type: AccountType.ASSET, isTax: true },
        { code: '191.01.018', name: 'İndirilecek KDV (%18/20)', type: AccountType.ASSET, isTax: true },

        { code: '320.01.001', name: 'Satıcılar (Yurt İçi)', type: AccountType.LIABILITY, isReconciliation: true },
        { code: '360.01.001', name: 'Ödenecek Vergiler', type: AccountType.LIABILITY },
        { code: '391.01.001', name: 'Hesaplanan KDV (%1)', type: AccountType.LIABILITY, isTax: true },
        { code: '391.01.018', name: 'Hesaplanan KDV (%18/20)', type: AccountType.LIABILITY, isTax: true },

        { code: '600.01.001', name: 'Yurt İçi Satışlar', type: AccountType.REVENUE },
        { code: '620.01.001', name: 'Satılan Mamul Maliyeti', type: AccountType.EXPENSE },
        { code: '710.01.001', name: 'Direkt İlk Madde ve Malzeme', type: AccountType.EXPENSE },
        { code: '720.01.001', name: 'Direkt İşçilik Giderleri', type: AccountType.EXPENSE },
        { code: '730.01.001', name: 'Genel Üretim Giderleri', type: AccountType.EXPENSE },
    ];

    for (const acc of accounts) {
        await prisma.gLAccount.upsert({
            where: { accountNumber: acc.code },
            update: {},
            create: {
                accountNumber: acc.code,
                name: acc.name,
                type: acc.type,
                companyCodeId: company.id,
                currency: 'TRY',
                isTaxAccount: acc.isTax || false,
                isReconciliation: acc.isReconciliation || false,
            }
        });
    }

    console.log('FI Seeding completed.');
}

seedFI()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
