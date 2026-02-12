import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { FieldDefinition } from '@sepenatural/shared';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // --- Seed Entity Definitions ---
    const productCardFields: FieldDefinition[] = [
        {
            key: 'sku',
            label: 'Stok Kodu (SKU)',
            type: 'readonly',
            required: true,
            readonly: true,
            gridVisible: true,
            gridWidth: 160,
            gridPinned: 'left',
            order: 1,
            section: 'general',
            tooltip: 'Netsis tarafından atanan benzersiz stok kodu',
        },
        {
            key: 'productName',
            label: 'Ürün Adı',
            type: 'text',
            required: true,
            placeholder: 'Ürün adını giriniz...',
            gridVisible: true,
            gridWidth: 280,
            order: 2,
            section: 'general',
            validation: {
                minLength: 3,
                maxLength: 200,
            },
        },
        {
            key: 'barcode',
            label: 'Barkod',
            type: 'text',
            required: false,
            placeholder: 'Barkod numarası',
            gridVisible: true,
            gridWidth: 150,
            order: 3,
            section: 'general',
            validation: {
                pattern: '^[0-9]{8,13}$',
                patternMessage: 'Barkod 8-13 haneli sayısal olmalıdır',
            },
        },
        {
            key: 'groupCode',
            label: 'Grup Kodu',
            type: 'text',
            required: false,
            gridVisible: true,
            gridWidth: 130,
            order: 4,
            section: 'general',
        },
        {
            key: 'unitOfMeasure',
            label: 'Birim',
            type: 'select',
            required: true,
            options: [
                { label: 'Kilogram', value: 'KG' },
                { label: 'Litre', value: 'LT' },
                { label: 'Adet', value: 'AD' },
                { label: 'Gram', value: 'GR' },
                { label: 'Mililitre', value: 'ML' },
            ],
            gridVisible: true,
            gridWidth: 100,
            order: 5,
            section: 'general',
        },
        {
            key: 'stockAmount',
            label: 'Stok Miktarı',
            type: 'number',
            required: true,
            min: 0,
            gridVisible: true,
            gridWidth: 140,
            order: 6,
            section: 'stock',
            tooltip: 'Mevcut depo stok miktarı',
        },
        {
            key: 'criticalLevel',
            label: 'Kritik Seviye',
            type: 'number',
            required: true,
            min: 0,
            gridVisible: true,
            gridWidth: 130,
            order: 7,
            section: 'stock',
            tooltip: 'Bu seviyenin altına düşünce uyarı verilir',
        },
        {
            key: 'purchasePrice',
            label: 'Alış Fiyatı',
            type: 'number',
            required: false,
            min: 0,
            gridVisible: true,
            gridWidth: 130,
            order: 8,
            section: 'pricing',
        },
        {
            key: 'salePrice',
            label: 'Satış Fiyatı',
            type: 'number',
            required: false,
            min: 0,
            gridVisible: true,
            gridWidth: 130,
            order: 9,
            section: 'pricing',
        },
        {
            key: 'currency',
            label: 'Para Birimi',
            type: 'select',
            required: true,
            defaultValue: 'TRY',
            options: [
                { label: 'Türk Lirası', value: 'TRY' },
                { label: 'ABD Doları', value: 'USD' },
                { label: 'Euro', value: 'EUR' },
            ],
            gridVisible: true,
            gridWidth: 100,
            order: 10,
            section: 'pricing',
        },
        {
            key: 'warehouseCode',
            label: 'Depo Kodu',
            type: 'select',
            required: true,
            options: [
                { label: 'Ana Depo (WH-01)', value: 'WH-01' },
                { label: 'Yedek Depo (WH-02)', value: 'WH-02' },
                { label: 'Satış Deposu (WH-03)', value: 'WH-03' },
            ],
            gridVisible: true,
            gridWidth: 120,
            order: 11,
            section: 'location',
        },
        {
            key: 'shelfCode',
            label: 'Raf Kodu',
            type: 'text',
            required: false,
            placeholder: 'Ör: A-01-03',
            gridVisible: true,
            gridWidth: 110,
            order: 12,
            section: 'location',
        },
        {
            key: 'isActive',
            label: 'Aktif',
            type: 'boolean',
            required: false,
            defaultValue: true,
            gridVisible: true,
            gridWidth: 90,
            order: 13,
            section: 'status',
        },
    ];

    await prisma.entityDefinition.upsert({
        where: { slug: 'product-card' },
        update: {
            fields: productCardFields as any,
            updatedAt: new Date(),
        },
        create: {
            slug: 'product-card',
            name: 'Ürün Kartı',
            description: 'Stok ve envanter yönetimi için ürün kartı tanımı',
            icon: 'Package',
            fields: productCardFields as any,
        },
    });

    console.log('✅ Entity Definition "product-card" seeded.');

    // --- Seed Admin User ---
    const adminPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@sepenatural.com' },
        update: {},
        create: {
            email: 'admin@sepenatural.com',
            passwordHash: adminPassword,
            fullName: 'Sistem Yöneticisi',
            role: 'ADMIN',
        },
    });

    console.log('✅ Admin user seeded: admin@sepenatural.com / admin123');
    console.log('🌱 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
