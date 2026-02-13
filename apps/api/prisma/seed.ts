// apps/api/prisma/seed.ts

import { PrismaClient, MaterialType, ProductionOrderStatus, BatchStatus, MaterialBatchStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// --- NEW: User Seed ---
async function seedUsers() {
    console.log('Seeding default users...');
    const adminEmail = 'admin@sepenatural.com';
    const adminPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            passwordHash,
            isActive: true,
            role: 'ADMIN',
        },
        create: {
            email: adminEmail,
            passwordHash,
            fullName: 'Sistem Yoneticisi',
            role: 'ADMIN',
            isActive: true,
        },
    });
    console.log('Default admin user synchronized: admin@sepenatural.com / Password123!');
}

// --- Existing constants ---
const categories = [
    'Elektronik', 'Gida', 'Tekstil', 'Kozmetik', 'Hirdavat',
    'Kirtasiye', 'Mobilya', 'Otomotiv', 'Beyaz Esya', 'Temizlik',
];

const brands = [
    'Samsung', 'Apple', 'Ulker', 'Eti', 'LC Waikiki',
    'Nivea', 'Bosch', 'Faber Castell', 'Ikea', 'Castrol',
    'Arcelik', 'Beko', 'Hayat', 'Pril', 'Colgate',
];

const units = ['Adet', 'Kg', 'Lt', 'Metre', 'Paket', 'Kutu', 'Duzine'];

function randomBetween(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function padNumber(num: number, length: number): string {
    return String(num).padStart(length, '0');
}

// --- Existing seedStocks ---
async function seedStocks() {
    console.log('Seeding 1000 stock items...');
    const stocks = Array.from({ length: 1000 }, (_, i) => {
        const idx = i + 1;
        const category = categories[i % categories.length];
        const brand = brands[i % brands.length];
        const unit = units[i % units.length];
        const purchasePrice = randomBetween(5, 5000);
        const salePrice = purchasePrice * randomBetween(1.1, 1.8);
        const vatRates = [1, 10, 20];
        return {
            stockCode: `STK-${padNumber(idx, 5)}`,
            stockName: `${brand} ${category} Urun ${idx}`,
            barcode: `869${padNumber(Math.floor(Math.random() * 10000000000), 10)}`,
            groupCode: `GRP-${padNumber((i % 50) + 1, 3)}`,
            unitOfMeasure: unit,
            purchasePrice,
            salePrice: Math.round(salePrice * 100) / 100,
            vatRate: vatRates[i % vatRates.length],
            currentStock: randomBetween(0, 10000),
            minStockLevel: randomBetween(10, 100),
            maxStockLevel: randomBetween(1000, 50000),
            category,
            brand,
            isActive: Math.random() > 0.05,
        };
    });
    await prisma.stock.createMany({ data: stocks, skipDuplicates: true });
    console.log('1000 stock items seeded.');
}

// --- Existing seedMetadata ---
async function seedMetadata() {
    console.log('Seeding entity metadata for product-card...');
    await prisma.entityMetadata.deleteMany({ where: { slug: 'product-card' } });
    const entity = await prisma.entityMetadata.create({
        data: {
            slug: 'product-card',
            displayName: 'Urun Karti',
            description: 'Stok/Urun karti duzenleme formu',
            tableName: 'stocks',
            version: 1,
            fields: {
                create: [
                    { name: 'stockCode', label: 'Stok Kodu', fieldType: 'text', placeholder: 'STK-00001', required: true, minLength: 3, maxLength: 20, group: 'general-info', order: 1, colSpan: 1, disabled: true, helpText: 'Stok kodu sistem tarafindan atanir.' },
                    { name: 'stockName', label: 'Stok Adi', fieldType: 'text', placeholder: 'Urun adini girin', required: true, minLength: 2, maxLength: 200, group: 'general-info', order: 2, colSpan: 2 },
                    { name: 'barcode', label: 'Barkod', fieldType: 'text', placeholder: '8690000000000', required: false, maxLength: 50, group: 'general-info', order: 3, colSpan: 1 },
                    { name: 'groupCode', label: 'Grup Kodu', fieldType: 'text', placeholder: 'GRP-001', required: false, maxLength: 20, group: 'general-info', order: 4, colSpan: 1 },
                    { name: 'category', label: 'Kategori', fieldType: 'select', required: false, group: 'general-info', order: 5, colSpan: 1, options: JSON.parse(JSON.stringify(categories.map((c) => ({ label: c, value: c })))) },
                    { name: 'brand', label: 'Marka', fieldType: 'text', placeholder: 'Marka adi', required: false, maxLength: 100, group: 'general-info', order: 6, colSpan: 1 },
                    { name: 'unitOfMeasure', label: 'Birim', fieldType: 'select', required: true, group: 'general-info', order: 7, colSpan: 1, options: JSON.parse(JSON.stringify(units.map((u) => ({ label: u, value: u })))) },
                    { name: 'isActive', label: 'Aktif', fieldType: 'checkbox', required: false, defaultValue: true, group: 'general-info', order: 8, colSpan: 1 },
                    { name: 'purchasePrice', label: 'Alis Fiyati', fieldType: 'currency', placeholder: '0.00', required: true, min: 0, max: 99999999, group: 'pricing', order: 10, colSpan: 1, helpText: 'KDV haric alis fiyati' },
                    { name: 'salePrice', label: 'Satis Fiyati', fieldType: 'currency', placeholder: '0.00', required: true, min: 0, max: 99999999, group: 'pricing', order: 11, colSpan: 1, helpText: 'KDV haric satis fiyati' },
                    { name: 'vatRate', label: 'KDV Orani (%)', fieldType: 'select', required: true, group: 'pricing', order: 12, colSpan: 1, options: [{ label: '%1', value: 1 }, { label: '%10', value: 10 }, { label: '%20', value: 20 }] as any },
                    { name: 'currentStock', label: 'Mevcut Stok', fieldType: 'number', placeholder: '0', required: false, min: 0, group: 'stock-levels', order: 20, colSpan: 1, disabled: true, helpText: 'Mevcut stok miktari. Fislerle guncellenir.' },
                    { name: 'minStockLevel', label: 'Minimum Stok', fieldType: 'number', placeholder: '0', required: false, min: 0, group: 'stock-levels', order: 21, colSpan: 1, helpText: 'Bu seviyenin altina dusunce uyari verilir.' },
                    { name: 'maxStockLevel', label: 'Maksimum Stok', fieldType: 'number', placeholder: '0', required: false, min: 0, group: 'stock-levels', order: 22, colSpan: 1 },
                ],
            },
        },
    });
    console.log(`Entity metadata seeded: ${entity.slug} (${entity.id})`);
}

// --- NEW: Production System Seeds ---

async function seedSuppliers() {
    console.log('Seeding suppliers...');
    await prisma.supplier.createMany({
        data: [
            { code: 'TED-001', name: 'Vitamin Dunyasi Kimya A.S.', contactPerson: 'Ahmet Yilmaz', email: 'ahmet@vitamindunya.com', phone: '0212-555-0101', address: 'Organize Sanayi Bolgesi 5. Cad. No:12', city: 'Istanbul', country: 'Turkiye', taxNumber: '1234567890', leadTimeDays: 7, isActive: true },
            { code: 'TED-002', name: 'Dogal Hammadde Ltd. Sti.', contactPerson: 'Fatma Kaya', email: 'fatma@dogalhammadde.com', phone: '0216-444-0202', address: 'Tuzla Kimya OSB Mah. 3. Sok. No:8', city: 'Istanbul', country: 'Turkiye', taxNumber: '2345678901', leadTimeDays: 14, isActive: true },
            { code: 'TED-003', name: 'BioTech Ithalat Ihracat A.S.', contactPerson: 'Mehmet Demir', email: 'mehmet@biotech-tr.com', phone: '0312-333-0303', address: 'ODTU Teknokent Silikon Blok No:5', city: 'Ankara', country: 'Turkiye', taxNumber: '3456789012', leadTimeDays: 21, isActive: true },
            { code: 'TED-004', name: 'Deniz Balik Yaglari San. Tic.', contactPerson: 'Zeynep Celik', email: 'zeynep@denizbalik.com', phone: '0232-666-0404', address: 'Kemalpasa OSB 2. Etap No:15', city: 'Izmir', country: 'Turkiye', taxNumber: '4567890123', leadTimeDays: 10, isActive: true },
            { code: 'TED-005', name: 'Ambalaj Plus Paketleme A.S.', contactPerson: 'Ali Ozturk', email: 'ali@ambalajplus.com', phone: '0224-777-0505', address: 'Nilufer OSB Yildiz Cad. No:22', city: 'Bursa', country: 'Turkiye', taxNumber: '5678901234', leadTimeDays: 5, isActive: true },
        ],
        skipDuplicates: true,
    });
    console.log('5 suppliers seeded.');
}

async function seedMaterials() {
    console.log('Seeding materials...');
    const suppliers = await prisma.supplier.findMany({ select: { id: true, code: true } });
    const supplierMap = Object.fromEntries(suppliers.map(s => [s.code, s.id]));

    await prisma.material.createMany({
        data: [
            { code: 'HM-001', name: 'Vitamin C (Askorbik Asit)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 450, currency: 'TRY', currentStock: 250, minStockLevel: 50, moq: 25, supplierId: supplierMap['TED-001'], category: 'Vitamin', casNumber: '50-81-7', shelfLife: 730, storageCondition: 'Serin ve kuru ortam, 15-25C' },
            { code: 'HM-002', name: 'Omega-3 Balik Yagi Konsantre', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Lt', unitPrice: 890, currency: 'TRY', currentStock: 180, minStockLevel: 40, moq: 20, supplierId: supplierMap['TED-004'], category: 'Yag Asidi', casNumber: '10417-94-4', shelfLife: 365, storageCondition: 'Soguk zincir, 2-8C' },
            { code: 'HM-003', name: 'D3 Vitamini (Kolekalsiferol)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 2200, currency: 'TRY', currentStock: 15, minStockLevel: 5, moq: 5, supplierId: supplierMap['TED-003'], category: 'Vitamin', casNumber: '67-97-0', shelfLife: 1095, storageCondition: 'Isiktan korunmali, oda sicakligi' },
            { code: 'HM-004', name: 'Cinko Glukonat', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 320, currency: 'TRY', currentStock: 120, minStockLevel: 30, moq: 10, supplierId: supplierMap['TED-001'], category: 'Mineral', casNumber: '4468-02-4', shelfLife: 1095, storageCondition: 'Kuru ortam, oda sicakligi' },
            { code: 'HM-005', name: 'Magnezyum Sitrat', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 280, currency: 'TRY', currentStock: 200, minStockLevel: 50, moq: 25, supplierId: supplierMap['TED-001'], category: 'Mineral', casNumber: '3344-18-1', shelfLife: 1095, storageCondition: 'Kuru ortam, oda sicakligi' },
            { code: 'HM-006', name: 'Probiyotik Karisim (50B CFU)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 4500, currency: 'TRY', currentStock: 8, minStockLevel: 3, moq: 2, supplierId: supplierMap['TED-003'], category: 'Probiyotik', casNumber: null, shelfLife: 365, storageCondition: 'Soguk zincir, 2-8C, nemden korunmali' },
            { code: 'HM-007', name: 'Kolajen Peptit (Balik Kaynakli)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 1800, currency: 'TRY', currentStock: 45, minStockLevel: 15, moq: 10, supplierId: supplierMap['TED-004'], category: 'Protein', casNumber: '9007-34-5', shelfLife: 730, storageCondition: 'Kuru ortam, 15-25C' },
            { code: 'HM-008', name: 'Biotin (B7 Vitamini)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 5800, currency: 'TRY', currentStock: 3, minStockLevel: 2, moq: 1, supplierId: supplierMap['TED-003'], category: 'Vitamin', casNumber: '58-85-5', shelfLife: 1095, storageCondition: 'Isiktan korunmali, oda sicakligi' },
            { code: 'HM-009', name: 'Demir Bisglisinat', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 680, currency: 'TRY', currentStock: 65, minStockLevel: 20, moq: 10, supplierId: supplierMap['TED-002'], category: 'Mineral', casNumber: '20150-34-9', shelfLife: 730, storageCondition: 'Nemden korunmali, oda sicakligi' },
            { code: 'HM-010', name: 'Koenzim Q10 (Ubikinon)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 12000, currency: 'TRY', currentStock: 2.5, minStockLevel: 1, moq: 1, supplierId: supplierMap['TED-003'], category: 'Antioksidan', casNumber: '303-98-0', shelfLife: 730, storageCondition: 'Soguk, isiktan korunmali, 2-8C' },
            { code: 'HM-011', name: 'Kurkumin Ekstresi (%95)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 3200, currency: 'TRY', currentStock: 18, minStockLevel: 5, moq: 5, supplierId: supplierMap['TED-002'], category: 'Bitkisel', casNumber: '458-37-7', shelfLife: 730, storageCondition: 'Kuru ortam, isiktan korunmali' },
            { code: 'AM-001', name: 'Jelatin Kapsul (Bos, Size 0)', type: 'PACKAGING' as MaterialType, unitOfMeasure: 'Adet', unitPrice: 0.08, currency: 'TRY', currentStock: 500000, minStockLevel: 100000, moq: 50000, supplierId: supplierMap['TED-005'], category: 'Kapsul' },
            { code: 'AM-002', name: 'Cam Sise 60ml (Damlalikli)', type: 'PACKAGING' as MaterialType, unitOfMeasure: 'Adet', unitPrice: 2.50, currency: 'TRY', currentStock: 15000, minStockLevel: 5000, moq: 2000, supplierId: supplierMap['TED-005'], category: 'Sise' },
            { code: 'AM-003', name: 'Blister Ambalaj (10lu)', type: 'PACKAGING' as MaterialType, unitOfMeasure: 'Adet', unitPrice: 0.45, currency: 'TRY', currentStock: 80000, minStockLevel: 20000, moq: 10000, supplierId: supplierMap['TED-005'], category: 'Blister' },
            { code: 'AM-004', name: 'Etiket ve Kutu Seti', type: 'PACKAGING' as MaterialType, unitOfMeasure: 'Adet', unitPrice: 1.20, currency: 'TRY', currentStock: 25000, minStockLevel: 8000, moq: 5000, supplierId: supplierMap['TED-005'], category: 'Kutu' },
        ],
        skipDuplicates: true,
    });
    console.log('15 materials seeded.');
}

async function seedMaterialBatches() {
    console.log('Seeding material batches...');
    const materials = await prisma.material.findMany({ select: { id: true, code: true } });
    const materialMap = Object.fromEntries(materials.map((material) => [material.code, material.id]));

    await prisma.materialBatch.createMany({
        data: [
            { batchNumber: 'MB-HM001-20260115-01', materialId: materialMap['HM-001'], supplierLotNo: 'TED001-LOT-2401', manufacturingDate: new Date('2026-01-15'), expiryDate: new Date('2028-01-15'), quantity: 120, remainingQuantity: 95, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo A / Raf 01' },
            { batchNumber: 'MB-HM002-20260110-01', materialId: materialMap['HM-002'], supplierLotNo: 'TED004-OMEGA-090', manufacturingDate: new Date('2026-01-10'), expiryDate: new Date('2026-12-31'), quantity: 80, remainingQuantity: 30, status: MaterialBatchStatus.RESERVED, storageLocation: 'Soguk Oda / Tank 02' },
            { batchNumber: 'MB-HM003-20260201-01', materialId: materialMap['HM-003'], supplierLotNo: 'TED003-D3-7781', manufacturingDate: new Date('2026-02-01'), expiryDate: new Date('2028-01-31'), quantity: 10, remainingQuantity: 10, status: MaterialBatchStatus.QUARANTINE, storageLocation: 'KK Bekleme Alani / Raf 03' },
            { batchNumber: 'MB-AM001-20251220-01', materialId: materialMap['AM-001'], supplierLotNo: 'TED005-CAPS-5512', manufacturingDate: new Date('2025-12-20'), expiryDate: new Date('2027-12-19'), quantity: 50000, remainingQuantity: 42000, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Ambalaj Depo B / Raf 08' },
            { batchNumber: 'MB-AM004-20251005-01', materialId: materialMap['AM-004'], supplierLotNo: 'TED005-LBL-9330', manufacturingDate: new Date('2025-10-05'), expiryDate: new Date('2026-10-04'), quantity: 100000, remainingQuantity: 0, status: MaterialBatchStatus.CONSUMED, storageLocation: 'Ambalaj Depo C / Raf 02' },
        ],
        skipDuplicates: true,
    });

    console.log('5 material batches seeded.');
}

async function seedProducts() {
    console.log('Seeding products...');
    await prisma.product.createMany({
        data: [
            { code: 'PRD-001', name: 'SepeNatural Vitamin C 1000mg', description: 'Yuksek dozajli C vitamini takviyesi, 60 tablet', category: 'Takviye Gida', salePrice: 189.90, costPrice: 62.50, batchSize: 5000, profitMargin: 67.1, barcode: '8691234000001', isActive: true },
            { code: 'PRD-002', name: 'SepeNatural Omega-3 Balik Yagi', description: 'Saf balik yagi, EPA/DHA zengin, 60 kapsul', category: 'Takviye Gida', salePrice: 249.90, costPrice: 95.00, batchSize: 3000, profitMargin: 62.0, barcode: '8691234000002', isActive: true },
            { code: 'PRD-003', name: 'SepeNatural D3+K2 Vitamin', description: 'D3 ve K2 vitamini kombinasyonu, 30ml damla', category: 'Vitamin', salePrice: 159.90, costPrice: 48.00, batchSize: 2000, profitMargin: 70.0, barcode: '8691234000003', isActive: true },
            { code: 'PRD-004', name: 'SepeNatural Multivitamin', description: 'Gunluk vitamin ve mineral ihtiyaci, 90 tablet', category: 'Vitamin', salePrice: 329.90, costPrice: 115.00, batchSize: 4000, profitMargin: 65.1, barcode: '8691234000004', isActive: true },
            { code: 'PRD-005', name: 'SepeNatural Probiyotik', description: '50 milyar CFU probiyotik, 30 kapsul', category: 'Probiyotik', salePrice: 279.90, costPrice: 125.00, batchSize: 2000, profitMargin: 55.3, barcode: '8691234000005', isActive: true },
            { code: 'PRD-006', name: 'SepeNatural Kolajen Peptit', description: 'Balik kaynakli kolajen peptit, 30 sase', category: 'Protein', salePrice: 399.90, costPrice: 165.00, batchSize: 1500, profitMargin: 58.7, barcode: '8691234000006', isActive: true },
            { code: 'PRD-007', name: 'SepeNatural Magnezyum Sitrat', description: 'Yuksek emilimli magnezyum, 60 tablet', category: 'Mineral', salePrice: 149.90, costPrice: 42.00, batchSize: 5000, profitMargin: 72.0, barcode: '8691234000007', isActive: true },
            { code: 'PRD-008', name: 'SepeNatural CoQ10 200mg', description: 'Koenzim Q10, antioksidan destek, 30 kapsul', category: 'Antioksidan', salePrice: 449.90, costPrice: 195.00, batchSize: 1000, profitMargin: 56.7, barcode: '8691234000008', isActive: true },
        ],
        skipDuplicates: true,
    });
    console.log('8 products seeded.');
}

async function seedRecipes() {
    console.log('Seeding recipes...');
    const products = await prisma.product.findMany({ select: { id: true, code: true } });
    const materials = await prisma.material.findMany({ select: { id: true, code: true, unitPrice: true } });
    const productMap = Object.fromEntries(products.map(p => [p.code, p.id]));
    const materialMap = Object.fromEntries(materials.map(m => [m.code, { id: m.id, price: Number(m.unitPrice) }]));

    // Recipe for Vitamin C 1000mg
    const r1 = await prisma.recipe.create({
        data: {
            code: 'REC-001', name: 'Vitamin C 1000mg Tablet Recetesi', productId: productMap['PRD-001'], version: 1, batchSize: 5000, batchUnit: 'Adet', isActive: true,
            items: {
                create: [
                    { materialId: materialMap['HM-001'].id, quantity: 5.5, unit: 'Kg', wastagePercent: 2, unitCost: materialMap['HM-001'].price, totalCost: 5.5 * materialMap['HM-001'].price * 1.02, order: 1 },
                    { materialId: materialMap['AM-003'].id, quantity: 500, unit: 'Adet', wastagePercent: 1, unitCost: materialMap['AM-003'].price, totalCost: 500 * materialMap['AM-003'].price * 1.01, order: 2 },
                    { materialId: materialMap['AM-004'].id, quantity: 5000, unit: 'Adet', wastagePercent: 1, unitCost: materialMap['AM-004'].price, totalCost: 5000 * materialMap['AM-004'].price * 1.01, order: 3 },
                ],
            },
        },
    });

    // Recipe for Omega-3
    const r2 = await prisma.recipe.create({
        data: {
            code: 'REC-002', name: 'Omega-3 Kapsul Recetesi', productId: productMap['PRD-002'], version: 1, batchSize: 3000, batchUnit: 'Adet', isActive: true,
            items: {
                create: [
                    { materialId: materialMap['HM-002'].id, quantity: 4.2, unit: 'Lt', wastagePercent: 3, unitCost: materialMap['HM-002'].price, totalCost: 4.2 * materialMap['HM-002'].price * 1.03, order: 1 },
                    { materialId: materialMap['AM-001'].id, quantity: 3000, unit: 'Adet', wastagePercent: 2, unitCost: materialMap['AM-001'].price, totalCost: 3000 * materialMap['AM-001'].price * 1.02, order: 2 },
                    { materialId: materialMap['AM-004'].id, quantity: 3000, unit: 'Adet', wastagePercent: 1, unitCost: materialMap['AM-004'].price, totalCost: 3000 * materialMap['AM-004'].price * 1.01, order: 3 },
                ],
            },
        },
    });

    // Recipe for D3+K2
    const r3 = await prisma.recipe.create({
        data: {
            code: 'REC-003', name: 'D3+K2 Damla Recetesi', productId: productMap['PRD-003'], version: 1, batchSize: 2000, batchUnit: 'Adet', isActive: true,
            items: {
                create: [
                    { materialId: materialMap['HM-003'].id, quantity: 0.12, unit: 'Kg', wastagePercent: 5, unitCost: materialMap['HM-003'].price, totalCost: 0.12 * materialMap['HM-003'].price * 1.05, order: 1 },
                    { materialId: materialMap['AM-002'].id, quantity: 2000, unit: 'Adet', wastagePercent: 2, unitCost: materialMap['AM-002'].price, totalCost: 2000 * materialMap['AM-002'].price * 1.02, order: 2 },
                    { materialId: materialMap['AM-004'].id, quantity: 2000, unit: 'Adet', wastagePercent: 1, unitCost: materialMap['AM-004'].price, totalCost: 2000 * materialMap['AM-004'].price * 1.01, order: 3 },
                ],
            },
        },
    });

    // Update total costs
    for (const recipe of [r1, r2, r3]) {
        const items = await prisma.recipeItem.findMany({ where: { recipeId: recipe.id } });
        const totalCost = items.reduce((acc, item) => acc + Number(item.totalCost), 0);
        await prisma.recipe.update({ where: { id: recipe.id }, data: { totalCost } });
    }

    console.log('3 recipes seeded.');
}

async function seedProductionOrders() {
    console.log('Seeding production orders...');
    const products = await prisma.product.findMany({ select: { id: true, code: true } });
    const recipes = await prisma.recipe.findMany({ select: { id: true, code: true } });
    const productMap = Object.fromEntries(products.map(p => [p.code, p.id]));
    const recipeMap = Object.fromEntries(recipes.map(r => [r.code, r.id]));

    const orders = [
        { orderNumber: 'UE-20260201-001', productId: productMap['PRD-001'], recipeId: recipeMap['REC-001'], plannedQuantity: 5000, status: 'COMPLETED' as ProductionOrderStatus, priority: 1, plannedStart: new Date('2026-02-01'), plannedEnd: new Date('2026-02-05'), actualStart: new Date('2026-02-01'), actualEnd: new Date('2026-02-04'), assignedTo: 'Ahmet Usta' },
        { orderNumber: 'UE-20260203-001', productId: productMap['PRD-002'], recipeId: recipeMap['REC-002'], plannedQuantity: 3000, status: 'COMPLETED' as ProductionOrderStatus, priority: 1, plannedStart: new Date('2026-02-03'), plannedEnd: new Date('2026-02-07'), actualStart: new Date('2026-02-03'), actualEnd: new Date('2026-02-06'), assignedTo: 'Mehmet Usta' },
        { orderNumber: 'UE-20260205-001', productId: productMap['PRD-003'], recipeId: recipeMap['REC-003'], plannedQuantity: 2000, status: 'IN_PROGRESS' as ProductionOrderStatus, priority: 2, plannedStart: new Date('2026-02-05'), plannedEnd: new Date('2026-02-10'), actualStart: new Date('2026-02-05'), assignedTo: 'Zeynep Teknisyen' },
        { orderNumber: 'UE-20260208-001', productId: productMap['PRD-001'], recipeId: recipeMap['REC-001'], plannedQuantity: 10000, status: 'IN_PROGRESS' as ProductionOrderStatus, priority: 1, plannedStart: new Date('2026-02-08'), plannedEnd: new Date('2026-02-15'), actualStart: new Date('2026-02-08'), assignedTo: 'Ahmet Usta' },
        { orderNumber: 'UE-20260210-001', productId: productMap['PRD-002'], recipeId: recipeMap['REC-002'], plannedQuantity: 6000, status: 'PLANNED' as ProductionOrderStatus, priority: 2, plannedStart: new Date('2026-02-15'), plannedEnd: new Date('2026-02-20'), assignedTo: 'Mehmet Usta' },
        { orderNumber: 'UE-20260210-002', productId: productMap['PRD-003'], recipeId: recipeMap['REC-003'], plannedQuantity: 4000, status: 'PLANNED' as ProductionOrderStatus, priority: 3, plannedStart: new Date('2026-02-18'), plannedEnd: new Date('2026-02-22') },
        { orderNumber: 'UE-20260212-001', productId: productMap['PRD-001'], recipeId: recipeMap['REC-001'], plannedQuantity: 8000, status: 'DRAFT' as ProductionOrderStatus, priority: 0, notes: 'Mart ayi uretim plani icin taslak' },
        { orderNumber: 'UE-20260101-001', productId: productMap['PRD-002'], recipeId: recipeMap['REC-002'], plannedQuantity: 2000, status: 'CANCELLED' as ProductionOrderStatus, priority: 0, plannedStart: new Date('2026-01-15'), plannedEnd: new Date('2026-01-20'), notes: 'Hammadde tedarik sorunu nedeniyle iptal' },
    ];

    for (const order of orders) {
        await prisma.productionOrder.create({ data: order });
    }
    console.log('8 production orders seeded.');
}

async function seedProductionBatches() {
    console.log('Seeding production batches...');
    const orders = await prisma.productionOrder.findMany({ select: { id: true, orderNumber: true } });
    const orderMap = Object.fromEntries(orders.map(o => [o.orderNumber, o.id]));

    const batches = [
        { batchNumber: 'BAT-20260201-001', productionOrderId: orderMap['UE-20260201-001'], quantity: 2500, status: 'RELEASED' as BatchStatus, manufacturingDate: new Date('2026-02-01'), expiryDate: new Date('2027-02-01'), qcDate: new Date('2026-02-03'), qcApprovedBy: 'Dr. Ayse KK', storageLocation: 'Depo A - Raf 1' },
        { batchNumber: 'BAT-20260201-002', productionOrderId: orderMap['UE-20260201-001'], quantity: 2500, status: 'RELEASED' as BatchStatus, manufacturingDate: new Date('2026-02-02'), expiryDate: new Date('2027-02-02'), qcDate: new Date('2026-02-04'), qcApprovedBy: 'Dr. Ayse KK', storageLocation: 'Depo A - Raf 2' },
        { batchNumber: 'BAT-20260203-001', productionOrderId: orderMap['UE-20260203-001'], quantity: 1500, status: 'RELEASED' as BatchStatus, manufacturingDate: new Date('2026-02-03'), expiryDate: new Date('2027-02-03'), qcDate: new Date('2026-02-05'), qcApprovedBy: 'Dr. Ayse KK', storageLocation: 'Depo B - Raf 1' },
        { batchNumber: 'BAT-20260203-002', productionOrderId: orderMap['UE-20260203-001'], quantity: 1500, status: 'QC_PASSED' as BatchStatus, manufacturingDate: new Date('2026-02-04'), expiryDate: new Date('2027-02-04'), qcDate: new Date('2026-02-06'), storageLocation: 'Depo B - Raf 2' },
        { batchNumber: 'BAT-20260205-001', productionOrderId: orderMap['UE-20260205-001'], quantity: 1000, status: 'QC_PENDING' as BatchStatus, manufacturingDate: new Date('2026-02-05'), expiryDate: new Date('2027-02-05'), storageLocation: 'Depo C - Raf 1' },
        { batchNumber: 'BAT-20260205-002', productionOrderId: orderMap['UE-20260205-001'], quantity: 1000, status: 'IN_PRODUCTION' as BatchStatus, manufacturingDate: new Date('2026-02-07'), storageLocation: 'Uretim Hatti 2' },
        { batchNumber: 'BAT-20260208-001', productionOrderId: orderMap['UE-20260208-001'], quantity: 3000, status: 'QC_PENDING' as BatchStatus, manufacturingDate: new Date('2026-02-08'), expiryDate: new Date('2027-02-08'), storageLocation: 'Depo A - Raf 3' },
        { batchNumber: 'BAT-20260208-002', productionOrderId: orderMap['UE-20260208-001'], quantity: 3000, status: 'IN_PRODUCTION' as BatchStatus, manufacturingDate: new Date('2026-02-10'), storageLocation: 'Uretim Hatti 1' },
        { batchNumber: 'BAT-20260208-003', productionOrderId: orderMap['UE-20260208-001'], quantity: 4000, status: 'PENDING' as BatchStatus, notes: 'Uretim hatti musaitligi bekleniyor' },
        { batchNumber: 'BAT-20260203-003', productionOrderId: orderMap['UE-20260203-001'], quantity: 500, status: 'QC_FAILED' as BatchStatus, manufacturingDate: new Date('2026-02-05'), qcDate: new Date('2026-02-06'), qcNotes: 'Mikrobiyolojik analiz sinir degerin uzerinde', qcApprovedBy: 'Dr. Ayse KK', storageLocation: 'Karantina Deposu' },
    ];

    for (const batch of batches) {
        await prisma.productionBatch.create({ data: batch });
    }
    console.log('10 production batches seeded.');
}

async function seedProductionMetadata() {
    console.log('Seeding production entity metadata...');

    const slugsToDelete = ['material-card', 'finished-product-card', 'production-order-card', 'production-batch-card', 'supplier-card'];
    for (const slug of slugsToDelete) {
        await prisma.entityMetadata.deleteMany({ where: { slug } });
    }

    // Material Card
    await prisma.entityMetadata.create({
        data: {
            slug: 'material-card', displayName: 'Hammadde Karti', description: 'Hammadde/malzeme duzenleme formu', tableName: 'materials', version: 1,
            fields: {
                create: [
                    { name: 'code', label: 'Malzeme Kodu', fieldType: 'text', required: true, group: 'general-info', order: 1, colSpan: 1, disabled: true, helpText: 'Malzeme kodu sistem tarafindan atanir.' },
                    { name: 'name', label: 'Malzeme Adi', fieldType: 'text', placeholder: 'Malzeme adini girin', required: true, group: 'general-info', order: 2, colSpan: 2 },
                    { name: 'type', label: 'Tip', fieldType: 'select', required: true, group: 'general-info', order: 3, colSpan: 1, options: [{ label: 'Hammadde', value: 'RAW_MATERIAL' }, { label: 'Ambalaj', value: 'PACKAGING' }, { label: 'Yari Mamul', value: 'SEMI_FINISHED' }, { label: 'Bitmis Urun', value: 'FINISHED_PRODUCT' }] as any },
                    { name: 'category', label: 'Kategori', fieldType: 'text', placeholder: 'Orn: Vitamin, Mineral', group: 'general-info', order: 4, colSpan: 1 },
                    { name: 'unitOfMeasure', label: 'Birim', fieldType: 'select', required: true, group: 'general-info', order: 5, colSpan: 1, options: [{ label: 'Kg', value: 'Kg' }, { label: 'Lt', value: 'Lt' }, { label: 'Adet', value: 'Adet' }, { label: 'Metre', value: 'Metre' }] as any },
                    { name: 'isActive', label: 'Aktif', fieldType: 'checkbox', defaultValue: true, group: 'general-info', order: 6, colSpan: 1 },
                    { name: 'unitPrice', label: 'Birim Fiyat', fieldType: 'currency', placeholder: '0.00', min: 0, group: 'pricing', order: 10, colSpan: 1 },
                    { name: 'currency', label: 'Para Birimi', fieldType: 'select', group: 'pricing', order: 11, colSpan: 1, options: [{ label: 'TRY', value: 'TRY' }, { label: 'USD', value: 'USD' }, { label: 'EUR', value: 'EUR' }] as any },
                    { name: 'currentStock', label: 'Mevcut Stok', fieldType: 'number', min: 0, group: 'stock-levels', order: 20, colSpan: 1, disabled: true },
                    { name: 'minStockLevel', label: 'Minimum Stok', fieldType: 'number', min: 0, group: 'stock-levels', order: 21, colSpan: 1, helpText: 'Bu seviyenin altinda uyari verilir.' },
                    { name: 'moq', label: 'Min. Siparis Miktari (MOQ)', fieldType: 'number', min: 0, group: 'stock-levels', order: 22, colSpan: 1 },
                    { name: 'casNumber', label: 'CAS Numarasi', fieldType: 'text', placeholder: 'Orn: 50-81-7', group: 'storage', order: 30, colSpan: 1 },
                    { name: 'shelfLife', label: 'Raf Omru (Gun)', fieldType: 'number', min: 0, group: 'storage', order: 31, colSpan: 1 },
                    { name: 'storageCondition', label: 'Depolama Kosullari', fieldType: 'textarea', placeholder: 'Depolama talimatlari...', group: 'storage', order: 32, colSpan: 2 },
                    { name: 'notes', label: 'Notlar', fieldType: 'textarea', group: 'storage', order: 33, colSpan: 2 },
                ],
            },
        },
    });

    // Finished Product Card
    await prisma.entityMetadata.create({
        data: {
            slug: 'finished-product-card', displayName: 'Urun Karti', description: 'Bitmis urun duzenleme formu', tableName: 'products', version: 1,
            fields: {
                create: [
                    { name: 'code', label: 'Urun Kodu', fieldType: 'text', required: true, group: 'general-info', order: 1, colSpan: 1, disabled: true },
                    { name: 'name', label: 'Urun Adi', fieldType: 'text', placeholder: 'Urun adini girin', required: true, group: 'general-info', order: 2, colSpan: 2 },
                    { name: 'description', label: 'Aciklama', fieldType: 'textarea', placeholder: 'Urun aciklamasi...', group: 'general-info', order: 3, colSpan: 2 },
                    { name: 'category', label: 'Kategori', fieldType: 'select', group: 'general-info', order: 4, colSpan: 1, options: [{ label: 'Takviye Gida', value: 'Takviye Gida' }, { label: 'Vitamin', value: 'Vitamin' }, { label: 'Mineral', value: 'Mineral' }, { label: 'Protein', value: 'Protein' }, { label: 'Probiyotik', value: 'Probiyotik' }, { label: 'Antioksidan', value: 'Antioksidan' }, { label: 'Bitkisel', value: 'Bitkisel' }] as any },
                    { name: 'barcode', label: 'Barkod', fieldType: 'text', placeholder: '8691234000001', group: 'general-info', order: 5, colSpan: 1 },
                    { name: 'isActive', label: 'Aktif', fieldType: 'checkbox', defaultValue: true, group: 'general-info', order: 6, colSpan: 1 },
                    { name: 'salePrice', label: 'Satis Fiyati', fieldType: 'currency', placeholder: '0.00', min: 0, required: true, group: 'pricing', order: 10, colSpan: 1 },
                    { name: 'costPrice', label: 'Maliyet Fiyati', fieldType: 'currency', placeholder: '0.00', min: 0, group: 'pricing', order: 11, colSpan: 1 },
                    { name: 'profitMargin', label: 'Kar Marji (%)', fieldType: 'number', group: 'pricing', order: 12, colSpan: 1, disabled: true, helpText: 'Otomatik hesaplanir.' },
                    { name: 'batchSize', label: 'Parti Buyuklugu', fieldType: 'number', placeholder: '1000', min: 1, group: 'production', order: 20, colSpan: 1, helpText: 'Standart uretim parti miktari' },
                    { name: 'unitOfMeasure', label: 'Birim', fieldType: 'select', required: true, group: 'production', order: 21, colSpan: 1, options: [{ label: 'Adet', value: 'Adet' }, { label: 'Kg', value: 'Kg' }, { label: 'Lt', value: 'Lt' }] as any },
                ],
            },
        },
    });

    // Production Order Card
    await prisma.entityMetadata.create({
        data: {
            slug: 'production-order-card', displayName: 'Uretim Emri', description: 'Uretim emri duzenleme formu', tableName: 'production_orders', version: 1,
            fields: {
                create: [
                    { name: 'orderNumber', label: 'Siparis No', fieldType: 'text', required: true, group: 'general-info', order: 1, colSpan: 1, disabled: true },
                    { name: 'status', label: 'Durum', fieldType: 'select', required: true, group: 'general-info', order: 2, colSpan: 1, options: [{ label: 'Taslak', value: 'DRAFT' }, { label: 'Planlandi', value: 'PLANNED' }, { label: 'Devam Ediyor', value: 'IN_PROGRESS' }, { label: 'Tamamlandi', value: 'COMPLETED' }, { label: 'Iptal', value: 'CANCELLED' }] as any },
                    { name: 'priority', label: 'Oncelik', fieldType: 'number', min: 0, max: 10, group: 'general-info', order: 3, colSpan: 1, helpText: '0=Dusuk, 10=Yuksek' },
                    { name: 'plannedQuantity', label: 'Planlanan Miktar', fieldType: 'number', required: true, min: 0, group: 'quantities', order: 10, colSpan: 1 },
                    { name: 'actualQuantity', label: 'Gerceklesen Miktar', fieldType: 'number', min: 0, group: 'quantities', order: 11, colSpan: 1 },
                    { name: 'unit', label: 'Birim', fieldType: 'text', group: 'quantities', order: 12, colSpan: 1 },
                    { name: 'plannedStart', label: 'Planlanan Baslangic', fieldType: 'text', placeholder: 'YYYY-MM-DD', group: 'schedule', order: 20, colSpan: 1 },
                    { name: 'plannedEnd', label: 'Planlanan Bitis', fieldType: 'text', placeholder: 'YYYY-MM-DD', group: 'schedule', order: 21, colSpan: 1 },
                    { name: 'assignedTo', label: 'Atanan Kisi', fieldType: 'text', placeholder: 'Sorumlu kisi', group: 'assignment', order: 30, colSpan: 1 },
                    { name: 'notes', label: 'Notlar', fieldType: 'textarea', placeholder: 'Uretim notlari...', group: 'assignment', order: 31, colSpan: 2 },
                ],
            },
        },
    });

    // Production Batch Card
    await prisma.entityMetadata.create({
        data: {
            slug: 'production-batch-card', displayName: 'Parti Karti', description: 'Uretim partisi duzenleme formu', tableName: 'production_batches', version: 1,
            fields: {
                create: [
                    { name: 'batchNumber', label: 'Parti No', fieldType: 'text', required: true, group: 'general-info', order: 1, colSpan: 1, disabled: true },
                    { name: 'status', label: 'Durum', fieldType: 'select', required: true, group: 'general-info', order: 2, colSpan: 1, options: [{ label: 'Bekliyor', value: 'PENDING' }, { label: 'Uretimde', value: 'IN_PRODUCTION' }, { label: 'KK Bekliyor', value: 'QC_PENDING' }, { label: 'KK Onayli', value: 'QC_PASSED' }, { label: 'KK Red', value: 'QC_FAILED' }, { label: 'Serbest', value: 'RELEASED' }, { label: 'Reddedildi', value: 'REJECTED' }] as any },
                    { name: 'quantity', label: 'Miktar', fieldType: 'number', required: true, min: 0, group: 'general-info', order: 3, colSpan: 1 },
                    { name: 'unit', label: 'Birim', fieldType: 'text', group: 'general-info', order: 4, colSpan: 1 },
                    { name: 'manufacturingDate', label: 'Uretim Tarihi', fieldType: 'text', placeholder: 'YYYY-MM-DD', group: 'dates', order: 10, colSpan: 1 },
                    { name: 'expiryDate', label: 'Son Kullanma Tarihi', fieldType: 'text', placeholder: 'YYYY-MM-DD', group: 'dates', order: 11, colSpan: 1 },
                    { name: 'qcDate', label: 'KK Tarihi', fieldType: 'text', placeholder: 'YYYY-MM-DD', group: 'quality', order: 20, colSpan: 1, disabled: true },
                    { name: 'qcNotes', label: 'KK Notlari', fieldType: 'textarea', placeholder: 'Kalite kontrol notlari...', group: 'quality', order: 21, colSpan: 2 },
                    { name: 'qcApprovedBy', label: 'KK Onaylayan', fieldType: 'text', group: 'quality', order: 22, colSpan: 1 },
                    { name: 'storageLocation', label: 'Depolama Yeri', fieldType: 'text', placeholder: 'Orn: Depo A - Raf 1', group: 'storage', order: 30, colSpan: 1 },
                    { name: 'notes', label: 'Notlar', fieldType: 'textarea', placeholder: 'Parti notlari...', group: 'storage', order: 31, colSpan: 2 },
                ],
            },
        },
    });

    // Supplier Card
    await prisma.entityMetadata.create({
        data: {
            slug: 'supplier-card', displayName: 'Tedarikci Karti', description: 'Tedarikci duzenleme formu', tableName: 'suppliers', version: 1,
            fields: {
                create: [
                    { name: 'code', label: 'Tedarikci Kodu', fieldType: 'text', required: true, group: 'general-info', order: 1, colSpan: 1, disabled: true },
                    { name: 'name', label: 'Firma Adi', fieldType: 'text', placeholder: 'Firma adini girin', required: true, group: 'general-info', order: 2, colSpan: 2 },
                    { name: 'isActive', label: 'Aktif', fieldType: 'checkbox', defaultValue: true, group: 'general-info', order: 3, colSpan: 1 },
                    { name: 'contactPerson', label: 'Iletisim Kisisi', fieldType: 'text', placeholder: 'Ad Soyad', group: 'contact', order: 10, colSpan: 1 },
                    { name: 'email', label: 'E-posta', fieldType: 'text', placeholder: 'firma@ornek.com', group: 'contact', order: 11, colSpan: 1 },
                    { name: 'phone', label: 'Telefon', fieldType: 'text', placeholder: '0212-555-0000', group: 'contact', order: 12, colSpan: 1 },
                    { name: 'address', label: 'Adres', fieldType: 'textarea', placeholder: 'Firma adresi...', group: 'address', order: 20, colSpan: 2 },
                    { name: 'city', label: 'Sehir', fieldType: 'text', group: 'address', order: 21, colSpan: 1 },
                    { name: 'country', label: 'Ulke', fieldType: 'text', group: 'address', order: 22, colSpan: 1 },
                    { name: 'taxNumber', label: 'Vergi No', fieldType: 'text', placeholder: '1234567890', group: 'commercial', order: 30, colSpan: 1 },
                    { name: 'leadTimeDays', label: 'Tedarik Suresi (Gun)', fieldType: 'number', min: 0, group: 'commercial', order: 31, colSpan: 1 },
                    { name: 'notes', label: 'Notlar', fieldType: 'textarea', group: 'commercial', order: 32, colSpan: 2 },
                ],
            },
        },
    });

    console.log('5 entity metadata schemas seeded.');
}

async function main() {
    try {
        await seedUsers();
        await seedStocks();
        await seedMetadata();
        await seedSuppliers();
        await seedMaterials();
        await seedMaterialBatches();
        await seedProducts();
        await seedRecipes();
        await seedProductionOrders();
        await seedProductionBatches();
        await seedProductionMetadata();
        console.log('\nAll seeds completed successfully!');
    } catch (error) {
        console.error('Seed error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
