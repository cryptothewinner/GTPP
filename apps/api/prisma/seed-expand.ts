// apps/api/prisma/seed-expand.ts
// Çalıştırma: cd apps/api && npx ts-node prisma/seed-expand.ts

import {
  PrismaClient,
  MaterialType,
  StockMovementType,
  ProductionOrderStatus,
  MaterialBatchStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// ─── GÖREV 5: 3 Yeni Tedarikçi ───────────────────────────────────────────────

async function seedExpandSuppliers() {
  console.log('[1/7] Tedarikçiler genişletiliyor...');
  await prisma.supplier.createMany({
    data: [
      {
        code: 'TED-006',
        name: 'Anadolu Bitkisel Ozler A.S.',
        contactPerson: 'Mustafa Sahin',
        email: 'mustafa@anadolubitkisel.com',
        phone: '0332-444-0606',
        address: 'Konya OSB 3. Cad. No:18',
        city: 'Konya',
        country: 'Turkiye',
        taxNumber: '6789012345',
        leadTimeDays: 12,
        notes: 'Bitkisel ekstreler ve dogal hammaddeler',
        isActive: true,
      },
      {
        code: 'TED-007',
        name: 'Global Minerals Trading GmbH',
        contactPerson: 'Klaus Weber',
        email: 'k.weber@globalminerals.de',
        phone: '+49-89-555-0707',
        address: 'Industriestrasse 45, 80339 Munchen',
        city: 'Munchen',
        country: 'Almanya',
        taxNumber: 'DE789012345',
        leadTimeDays: 30,
        notes: 'Ithal mineraller, EUR ile fatura kesiliyor',
        isActive: true,
      },
      {
        code: 'TED-008',
        name: 'Akdeniz Ambalaj San. Tic.',
        contactPerson: 'Ayse Yildiz',
        email: 'ayse@akdenizambalaj.com',
        phone: '0242-333-0808',
        address: 'Antalya OSB 1. Etap No:9',
        city: 'Antalya',
        country: 'Turkiye',
        taxNumber: '7890123456',
        leadTimeDays: 7,
        notes: 'Ozel ambalaj cozumleri: sase, HDPE sise',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log('   → 3 yeni tedarikci eklendi.');
}

// ─── GÖREV 5: Yeni Malzemeler (HM-012..018 + AM-005..006) ────────────────────

async function seedExpandMaterials() {
  console.log('[2/7] Yeni malzemeler ekleniyor...');
  const suppliers = await prisma.supplier.findMany({ select: { id: true, code: true } });
  const s = Object.fromEntries(suppliers.map(sup => [sup.code, sup.id]));

  await prisma.material.createMany({
    data: [
      { code: 'HM-012', name: 'K2 Vitamini (MK-7)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 8500, currency: 'TRY', currentStock: 1, minStockLevel: 0.5, moq: 0.5, supplierId: s['TED-003'], category: 'Vitamin', casNumber: '2124-57-4', shelfLife: 730, storageCondition: 'Isiktan korunmali, oda sicakligi' },
      { code: 'HM-013', name: 'Selenyum (Seleno-Metiyonin)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 9200, currency: 'TRY', currentStock: 0.5, minStockLevel: 0.2, moq: 0.5, supplierId: s['TED-007'], category: 'Mineral', casNumber: '3211-76-5', shelfLife: 1095, storageCondition: 'Kuru ortam, 15-25C' },
      { code: 'HM-014', name: 'Lutein (Kadife Cicegi Ekst.)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 6800, currency: 'TRY', currentStock: 2, minStockLevel: 0.5, moq: 1, supplierId: s['TED-006'], category: 'Karotenoid', casNumber: '127-40-2', shelfLife: 730, storageCondition: 'Soguk, isiktan korunmali, 2-8C' },
      { code: 'HM-015', name: 'Folik Asit (B9 Vitamini)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 1200, currency: 'TRY', currentStock: 10, minStockLevel: 3, moq: 5, supplierId: s['TED-001'], category: 'Vitamin', casNumber: '59-30-3', shelfLife: 1095, storageCondition: 'Isiktan korunmali, kuru ortam' },
      { code: 'HM-016', name: 'B12 Vitamini (Metilkobalamin)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 15000, currency: 'TRY', currentStock: 0.3, minStockLevel: 0.1, moq: 0.2, supplierId: s['TED-003'], category: 'Vitamin', casNumber: '13422-55-4', shelfLife: 1095, storageCondition: 'Isiktan korunmali, soguk ortam' },
      { code: 'HM-017', name: 'Zerdecal Ekstresi (%95 Kurkuminoid)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 2800, currency: 'TRY', currentStock: 12, minStockLevel: 5, moq: 5, supplierId: s['TED-006'], category: 'Bitkisel', casNumber: '458-37-7', shelfLife: 730, storageCondition: 'Kuru ortam, isiktan korunmali' },
      { code: 'HM-018', name: 'Karabiber Ekstresi (Piperin %95)', type: 'RAW_MATERIAL' as MaterialType, unitOfMeasure: 'Kg', unitPrice: 3500, currency: 'TRY', currentStock: 5, minStockLevel: 2, moq: 2, supplierId: s['TED-006'], category: 'Bitkisel', casNumber: '94-62-2', shelfLife: 730, storageCondition: 'Kuru ortam, oda sicakligi' },
      { code: 'AM-005', name: 'Sase Ambalaj (5g)', type: 'PACKAGING' as MaterialType, unitOfMeasure: 'Adet', unitPrice: 0.35, currency: 'TRY', currentStock: 40000, minStockLevel: 10000, moq: 10000, supplierId: s['TED-008'], category: 'Sase' },
      { code: 'AM-006', name: 'HDPE Sise 90 Kapsul', type: 'PACKAGING' as MaterialType, unitOfMeasure: 'Adet', unitPrice: 1.80, currency: 'TRY', currentStock: 10000, minStockLevel: 3000, moq: 2000, supplierId: s['TED-008'], category: 'Sise' },
    ],
    skipDuplicates: true,
  });
  console.log('   → 9 yeni malzeme eklendi.');
}

// ─── GÖREV 2 + 6: Malzeme Partileri ──────────────────────────────────────────

async function seedExpandMaterialBatches() {
  console.log('[3/7] Malzeme partileri genisletiliyor...');
  const materials = await prisma.material.findMany({ select: { id: true, code: true } });
  const mm = Object.fromEntries(materials.map(m => [m.code, m.id]));

  await prisma.materialBatch.createMany({
    data: [
      // ── HM-001 Vitamin C — 2 ek parti ──────────────────────────────────────
      { batchNumber: 'MB-HM001-20260105-01', materialId: mm['HM-001'], supplierLotNo: 'TED001-VTC-2312', manufacturingDate: new Date('2026-01-05'), expiryDate: new Date('2028-01-05'), quantity: 80, remainingQuantity: 80, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo A / Raf 02' },
      { batchNumber: 'MB-HM001-20260130-01', materialId: mm['HM-001'], supplierLotNo: 'TED001-VTC-2402', manufacturingDate: new Date('2026-01-30'), expiryDate: new Date('2028-01-30'), quantity: 50, remainingQuantity: 46.2, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo A / Raf 03' },

      // ── HM-002 Omega-3 — 2 ek parti ────────────────────────────────────────
      { batchNumber: 'MB-HM002-20260105-01', materialId: mm['HM-002'], supplierLotNo: 'TED004-OMEGA-085', manufacturingDate: new Date('2026-01-05'), expiryDate: new Date('2026-12-15'), quantity: 60, remainingQuantity: 60, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Soguk Oda / Tank 01' },
      { batchNumber: 'MB-HM002-20260201-01', materialId: mm['HM-002'], supplierLotNo: 'TED004-OMEGA-092', manufacturingDate: new Date('2026-02-01'), expiryDate: new Date('2027-01-31'), quantity: 40, remainingQuantity: 40, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Soguk Oda / Tank 03' },

      // ── HM-003 D3 Vitamini — 2 ek parti ────────────────────────────────────
      { batchNumber: 'MB-HM003-20260115-01', materialId: mm['HM-003'], supplierLotNo: 'TED003-D3-7775', manufacturingDate: new Date('2026-01-15'), expiryDate: new Date('2029-01-15'), quantity: 5, remainingQuantity: 5, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo A / Raf 04' },
      { batchNumber: 'MB-HM003-20260210-01', materialId: mm['HM-003'], supplierLotNo: 'TED003-D3-7790', manufacturingDate: new Date('2026-02-10'), expiryDate: new Date('2029-02-10'), quantity: 5, remainingQuantity: 5, status: MaterialBatchStatus.QUARANTINE, storageLocation: 'KK Bekleme Alani / Raf 04' },

      // ── HM-004 Çinko Glukonat — 3 parti ────────────────────────────────────
      { batchNumber: 'MB-HM004-20260110-01', materialId: mm['HM-004'], supplierLotNo: 'TED001-ZNC-1101', manufacturingDate: new Date('2026-01-10'), expiryDate: new Date('2029-01-10'), quantity: 60, remainingQuantity: 60, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo A / Raf 05' },
      { batchNumber: 'MB-HM004-20260120-01', materialId: mm['HM-004'], supplierLotNo: 'TED001-ZNC-1102', manufacturingDate: new Date('2026-01-20'), expiryDate: new Date('2029-01-20'), quantity: 50, remainingQuantity: 50, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo A / Raf 06' },
      { batchNumber: 'MB-HM004-20260208-01', materialId: mm['HM-004'], supplierLotNo: 'TED001-ZNC-1103', manufacturingDate: new Date('2026-02-08'), expiryDate: new Date('2029-02-08'), quantity: 10, remainingQuantity: 10, status: MaterialBatchStatus.RESERVED, storageLocation: 'Hammadde Depo A / Raf 07' },

      // ── HM-005 Magnezyum Sitrat — 3 parti ──────────────────────────────────
      { batchNumber: 'MB-HM005-20260108-01', materialId: mm['HM-005'], supplierLotNo: 'TED001-MAG-0801', manufacturingDate: new Date('2026-01-08'), expiryDate: new Date('2029-01-08'), quantity: 100, remainingQuantity: 100, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo B / Raf 01' },
      { batchNumber: 'MB-HM005-20260120-01', materialId: mm['HM-005'], supplierLotNo: 'TED001-MAG-0802', manufacturingDate: new Date('2026-01-20'), expiryDate: new Date('2029-01-20'), quantity: 80, remainingQuantity: 72, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo B / Raf 02' },
      { batchNumber: 'MB-HM005-20260210-01', materialId: mm['HM-005'], supplierLotNo: 'TED001-MAG-0803', manufacturingDate: new Date('2026-02-10'), expiryDate: new Date('2029-02-10'), quantity: 20, remainingQuantity: 20, status: MaterialBatchStatus.RESERVED, storageLocation: 'Hammadde Depo B / Raf 03' },

      // ── HM-006 Probiyotik — 2 parti ────────────────────────────────────────
      { batchNumber: 'MB-HM006-20260120-01', materialId: mm['HM-006'], supplierLotNo: 'TED003-PRB-4401', manufacturingDate: new Date('2026-01-20'), expiryDate: new Date('2026-12-20'), quantity: 5, remainingQuantity: 5, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Soguk Oda / Raf 01' },
      { batchNumber: 'MB-HM006-20260205-01', materialId: mm['HM-006'], supplierLotNo: 'TED003-PRB-4402', manufacturingDate: new Date('2026-02-05'), expiryDate: new Date('2027-02-05'), quantity: 3, remainingQuantity: 3, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Soguk Oda / Raf 02' },

      // ── HM-007 Kolajen Peptit — 3 parti ────────────────────────────────────
      { batchNumber: 'MB-HM007-20260112-01', materialId: mm['HM-007'], supplierLotNo: 'TED004-COL-2201', manufacturingDate: new Date('2026-01-12'), expiryDate: new Date('2028-01-12'), quantity: 20, remainingQuantity: 20, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo C / Raf 01' },
      { batchNumber: 'MB-HM007-20260122-01', materialId: mm['HM-007'], supplierLotNo: 'TED004-COL-2202', manufacturingDate: new Date('2026-01-22'), expiryDate: new Date('2028-01-22'), quantity: 15, remainingQuantity: 12, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo C / Raf 02' },
      { batchNumber: 'MB-HM007-20260210-01', materialId: mm['HM-007'], supplierLotNo: 'TED004-COL-2203', manufacturingDate: new Date('2026-02-10'), expiryDate: new Date('2028-02-10'), quantity: 10, remainingQuantity: 10, status: MaterialBatchStatus.RESERVED, storageLocation: 'Hammadde Depo C / Raf 03' },

      // ── HM-008 Biotin — 2 parti ─────────────────────────────────────────────
      { batchNumber: 'MB-HM008-20260115-01', materialId: mm['HM-008'], supplierLotNo: 'TED003-BIO-8801', manufacturingDate: new Date('2026-01-15'), expiryDate: new Date('2029-01-15'), quantity: 2, remainingQuantity: 2, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo A / Raf 08' },
      { batchNumber: 'MB-HM008-20260205-01', materialId: mm['HM-008'], supplierLotNo: 'TED003-BIO-8802', manufacturingDate: new Date('2026-02-05'), expiryDate: new Date('2029-02-05'), quantity: 1, remainingQuantity: 1, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo A / Raf 09' },

      // ── HM-009 Demir Bisglisinat — 3 parti ─────────────────────────────────
      { batchNumber: 'MB-HM009-20260108-01', materialId: mm['HM-009'], supplierLotNo: 'TED002-FER-3301', manufacturingDate: new Date('2026-01-08'), expiryDate: new Date('2028-01-08'), quantity: 30, remainingQuantity: 30, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo B / Raf 04' },
      { batchNumber: 'MB-HM009-20260118-01', materialId: mm['HM-009'], supplierLotNo: 'TED002-FER-3302', manufacturingDate: new Date('2026-01-18'), expiryDate: new Date('2028-01-18'), quantity: 25, remainingQuantity: 20, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo B / Raf 05' },
      { batchNumber: 'MB-HM009-20260210-01', materialId: mm['HM-009'], supplierLotNo: 'TED002-FER-3303', manufacturingDate: new Date('2026-02-10'), expiryDate: new Date('2028-02-10'), quantity: 15, remainingQuantity: 15, status: MaterialBatchStatus.RESERVED, storageLocation: 'Hammadde Depo B / Raf 06' },

      // ── HM-010 CoQ10 — 2 parti ──────────────────────────────────────────────
      { batchNumber: 'MB-HM010-20260115-01', materialId: mm['HM-010'], supplierLotNo: 'TED003-COQ-1001', manufacturingDate: new Date('2026-01-15'), expiryDate: new Date('2028-01-15'), quantity: 1.5, remainingQuantity: 1.5, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Soguk Oda / Raf 03' },
      { batchNumber: 'MB-HM010-20260201-01', materialId: mm['HM-010'], supplierLotNo: 'TED003-COQ-1002', manufacturingDate: new Date('2026-02-01'), expiryDate: new Date('2028-02-01'), quantity: 1, remainingQuantity: 1, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Soguk Oda / Raf 04' },

      // ── HM-011 Kurkumin — 2 parti ────────────────────────────────────────────
      { batchNumber: 'MB-HM011-20260110-01', materialId: mm['HM-011'], supplierLotNo: 'TED002-KUR-1101', manufacturingDate: new Date('2026-01-10'), expiryDate: new Date('2028-01-10'), quantity: 10, remainingQuantity: 10, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo C / Raf 04' },
      { batchNumber: 'MB-HM011-20260205-01', materialId: mm['HM-011'], supplierLotNo: 'TED002-KUR-1102', manufacturingDate: new Date('2026-02-05'), expiryDate: new Date('2028-02-05'), quantity: 8, remainingQuantity: 8, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo C / Raf 05' },

      // ── AM-002 Cam Şişe — 2 parti ────────────────────────────────────────────
      { batchNumber: 'MB-AM002-20251215-01', materialId: mm['AM-002'], supplierLotNo: 'TED005-CAM-5201', manufacturingDate: new Date('2025-12-15'), expiryDate: new Date('2030-12-15'), quantity: 8000, remainingQuantity: 8000, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Ambalaj Depo D / Raf 01' },
      { batchNumber: 'MB-AM002-20260128-01', materialId: mm['AM-002'], supplierLotNo: 'TED005-CAM-5202', manufacturingDate: new Date('2026-01-28'), expiryDate: new Date('2031-01-28'), quantity: 7000, remainingQuantity: 7000, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Ambalaj Depo D / Raf 02' },

      // ── AM-003 Blister — 2 parti ─────────────────────────────────────────────
      { batchNumber: 'MB-AM003-20260110-01', materialId: mm['AM-003'], supplierLotNo: 'TED005-BLS-3301', manufacturingDate: new Date('2026-01-10'), expiryDate: new Date('2028-01-10'), quantity: 40000, remainingQuantity: 38500, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Ambalaj Depo B / Raf 05' },
      { batchNumber: 'MB-AM003-20260130-01', materialId: mm['AM-003'], supplierLotNo: 'TED005-BLS-3302', manufacturingDate: new Date('2026-01-30'), expiryDate: new Date('2028-01-30'), quantity: 30000, remainingQuantity: 30000, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Ambalaj Depo B / Raf 06' },

      // ── GÖREV 6: Yeni Malzeme Partileri ─────────────────────────────────────
      { batchNumber: 'MB-HM012-20260201-01', materialId: mm['HM-012'], supplierLotNo: 'TED003-K2-1201', manufacturingDate: new Date('2026-02-01'), expiryDate: new Date('2028-02-01'), quantity: 1, remainingQuantity: 1, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo A / Raf 10' },
      { batchNumber: 'MB-HM013-20260201-01', materialId: mm['HM-013'], supplierLotNo: 'GLB-SEL-20260201', manufacturingDate: new Date('2026-02-01'), expiryDate: new Date('2029-02-01'), quantity: 0.5, remainingQuantity: 0.5, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo A / Raf 11' },
      { batchNumber: 'MB-HM014-20260205-01', materialId: mm['HM-014'], supplierLotNo: 'TED006-LUT-1401', manufacturingDate: new Date('2026-02-05'), expiryDate: new Date('2028-02-05'), quantity: 2, remainingQuantity: 2, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Soguk Oda / Raf 05' },
      { batchNumber: 'MB-HM015-20260205-01', materialId: mm['HM-015'], supplierLotNo: 'TED001-FOL-1501', manufacturingDate: new Date('2026-02-05'), expiryDate: new Date('2029-02-05'), quantity: 10, remainingQuantity: 10, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo A / Raf 12' },
      { batchNumber: 'MB-HM016-20260210-01', materialId: mm['HM-016'], supplierLotNo: 'TED003-B12-1601', manufacturingDate: new Date('2026-02-10'), expiryDate: new Date('2029-02-10'), quantity: 0.3, remainingQuantity: 0.3, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo A / Raf 13' },
      { batchNumber: 'MB-HM017-20260210-01', materialId: mm['HM-017'], supplierLotNo: 'TED006-ZDC-1701', manufacturingDate: new Date('2026-02-10'), expiryDate: new Date('2028-02-10'), quantity: 12, remainingQuantity: 12, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo C / Raf 06' },
      { batchNumber: 'MB-HM018-20260210-01', materialId: mm['HM-018'], supplierLotNo: 'TED006-PIP-1801', manufacturingDate: new Date('2026-02-10'), expiryDate: new Date('2028-02-10'), quantity: 5, remainingQuantity: 5, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Hammadde Depo C / Raf 07' },
      { batchNumber: 'MB-AM005-20260205-01', materialId: mm['AM-005'], supplierLotNo: 'TED008-SSE-5001', manufacturingDate: new Date('2026-02-05'), expiryDate: new Date('2028-02-05'), quantity: 40000, remainingQuantity: 40000, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Ambalaj Depo E / Raf 01' },
      { batchNumber: 'MB-AM006-20260205-01', materialId: mm['AM-006'], supplierLotNo: 'TED008-HDP-6001', manufacturingDate: new Date('2026-02-05'), expiryDate: new Date('2029-02-05'), quantity: 10000, remainingQuantity: 10000, status: MaterialBatchStatus.AVAILABLE, storageLocation: 'Ambalaj Depo E / Raf 02' },
    ],
    skipDuplicates: true,
  });
  console.log('   → Malzeme partileri genisletildi (mevcut + yeni malzemeler).');
}

// ─── GÖREV 1: Eksik 5 Ürün Reçetesi (REC-004..008) ───────────────────────────

async function seedExpandRecipes() {
  console.log('[4/7] Eksik urun rеcеtеlеri oluşturuluyor...');
  const products = await prisma.product.findMany({ select: { id: true, code: true } });
  const materials = await prisma.material.findMany({ select: { id: true, code: true, unitPrice: true } });
  const pm = Object.fromEntries(products.map(p => [p.code, p.id]));
  const mm = Object.fromEntries(materials.map(m => [m.code, { id: m.id, price: Number(m.unitPrice) }]));

  type ItemDef = { code: string; qty: number; unit: string; waste: number; order: number };

  async function upsertRecipe(
    code: string,
    name: string,
    productCode: string,
    batchSize: number,
    instructions: string,
    items: ItemDef[],
  ) {
    const recipe = await prisma.recipe.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name,
        productId: pm[productCode],
        version: 1,
        batchSize,
        batchUnit: 'Adet',
        isActive: true,
        approvedBy: 'Dr. Ayse KK',
        approvedAt: new Date('2026-02-10T10:00:00'),
        instructions,
      },
    });

    for (const item of items) {
      const unitCost = mm[item.code].price;
      const totalCost = item.qty * unitCost * (1 + item.waste / 100);
      await prisma.recipeItem.upsert({
        where: { recipeId_materialId: { recipeId: recipe.id, materialId: mm[item.code].id } },
        update: {},
        create: {
          recipeId: recipe.id,
          materialId: mm[item.code].id,
          quantity: item.qty,
          unit: item.unit,
          wastagePercent: item.waste,
          unitCost,
          totalCost,
          order: item.order,
        },
      });
    }

    const allItems = await prisma.recipeItem.findMany({ where: { recipeId: recipe.id } });
    const totalCost = allItems.reduce((acc, i) => acc + Number(i.totalCost), 0);
    await prisma.recipe.update({ where: { id: recipe.id }, data: { totalCost } });
    return recipe;
  }

  // REC-004: Multivitamin Tablet (PRD-004, batchSize: 4000)
  await upsertRecipe(
    'REC-004', 'Multivitamin Tablet Recetesi', 'PRD-004', 4000,
    'Tum hammaddeleri belirtilen miktarlarda tartarak mikser tankina alin. 15 dakika karistirin. ' +
    'Tablet preste 500mg/tablet olacak sekilde presleme yapin. KK kontrol numunesi ayrildiktan sonra ' +
    'blister ambalajlama hattina aktarin.',
    [
      { code: 'HM-001', qty: 4,    unit: 'Kg',   waste: 2, order: 1 },
      { code: 'HM-003', qty: 0.08, unit: 'Kg',   waste: 5, order: 2 },
      { code: 'HM-004', qty: 1.2,  unit: 'Kg',   waste: 2, order: 3 },
      { code: 'HM-005', qty: 2,    unit: 'Kg',   waste: 2, order: 4 },
      { code: 'HM-009', qty: 0.5,  unit: 'Kg',   waste: 3, order: 5 },
      { code: 'AM-003', qty: 400,  unit: 'Adet', waste: 1, order: 6 },
      { code: 'AM-004', qty: 4000, unit: 'Adet', waste: 1, order: 7 },
    ],
  );

  // REC-005: Probiyotik Kapsül (PRD-005, batchSize: 2000)
  await upsertRecipe(
    'REC-005', 'Probiyotik Kapsul Recetesi', 'PRD-005', 2000,
    'Probiyotik karisimini soguk ortamda tartarak kapsulleme makinesine aktarin. ' +
    'Soguk zincirde muhafaza ederek jelatin kapsullere doldurun. ' +
    'Ambalajlama islemleri soguk ortamda (max 15C) gerceklestirilmelidir.',
    [
      { code: 'HM-006', qty: 0.6,  unit: 'Kg',   waste: 3, order: 1 },
      { code: 'AM-001', qty: 2000, unit: 'Adet', waste: 2, order: 2 },
      { code: 'AM-004', qty: 2000, unit: 'Adet', waste: 1, order: 3 },
    ],
  );

  // REC-006: Kolajen 30 Saşe (PRD-006, batchSize: 1500)
  await upsertRecipe(
    'REC-006', 'Kolajen Peptit 30 Sase Recetesi', 'PRD-006', 1500,
    'Kolajen peptit ve C vitamini tozlarini birlikte tartarak homojenik karisim elde edin. ' +
    '5g olacak sekilde sase dolum makinesinde ambalajlayin. ' +
    'Her sase kapatildiktan sonra sizdirmazlik testi uygulanmalidir.',
    [
      { code: 'HM-007', qty: 7.5,  unit: 'Kg',   waste: 2, order: 1 },
      { code: 'HM-001', qty: 0.75, unit: 'Kg',   waste: 2, order: 2 },
      { code: 'AM-005', qty: 1500, unit: 'Adet', waste: 1, order: 3 },
      { code: 'AM-004', qty: 1500, unit: 'Adet', waste: 1, order: 4 },
    ],
  );

  // REC-007: Magnezyum Sitrat Tablet (PRD-007, batchSize: 5000)
  await upsertRecipe(
    'REC-007', 'Magnezyum Sitrat Tablet Recetesi', 'PRD-007', 5000,
    'Magnezyum sitrat tozunu granule edin, baglayici madde ekleyerek karıstirin. ' +
    'Tablet pres makinesine aktararak 300mg/tablet dozajinda presleme yapin. ' +
    'Blister ambalajlamayi 10lu format ile tamamlayin.',
    [
      { code: 'HM-005', qty: 8,    unit: 'Kg',   waste: 2, order: 1 },
      { code: 'AM-003', qty: 500,  unit: 'Adet', waste: 1, order: 2 },
      { code: 'AM-004', qty: 5000, unit: 'Adet', waste: 1, order: 3 },
    ],
  );

  // REC-008: CoQ10 200mg Kapsül (PRD-008, batchSize: 1000)
  await upsertRecipe(
    'REC-008', 'CoQ10 200mg Kapsul Recetesi', 'PRD-008', 1000,
    'CoQ10 ubikion tozunu yag bazli tasiyici ile karıstirarak jelatin kapsullere doldurun. ' +
    'Kapsullerin sizdirmazligini ve agirligini kontrol edin. ' +
    'Amber renkli HDPE siselere doldurun, nem alici paket ekleyin.',
    [
      { code: 'HM-010', qty: 0.2,  unit: 'Kg',   waste: 3, order: 1 },
      { code: 'AM-001', qty: 1000, unit: 'Adet', waste: 2, order: 2 },
      { code: 'AM-006', qty: 1000, unit: 'Adet', waste: 1, order: 3 },
    ],
  );

  console.log('   → 5 yeni recete (REC-004..REC-008) oluşturuldu.');
}

// ─── GÖREV 7: Yeni Üretim Emirleri ───────────────────────────────────────────

async function seedExpandProductionOrders() {
  console.log('[5/7] Yeni uretim emirleri ekleniyor...');
  const products = await prisma.product.findMany({ select: { id: true, code: true } });
  const recipes = await prisma.recipe.findMany({ select: { id: true, code: true } });
  const pm = Object.fromEntries(products.map(p => [p.code, p.id]));
  const rm = Object.fromEntries(recipes.map(r => [r.code, r.id]));

  const orders = [
    {
      orderNumber: 'UE-20260215-001',
      productId: pm['PRD-004'], recipeId: rm['REC-004'],
      plannedQuantity: 4000, status: 'PLANNED' as ProductionOrderStatus, priority: 2,
      plannedStart: new Date('2026-02-22'), plannedEnd: new Date('2026-02-28'),
      assignedTo: 'Ahmet Usta', notes: 'Subat sonu Multivitamin ilk serisi uretimi',
    },
    {
      orderNumber: 'UE-20260216-001',
      productId: pm['PRD-005'], recipeId: rm['REC-005'],
      plannedQuantity: 2000, status: 'DRAFT' as ProductionOrderStatus, priority: 1,
      plannedStart: new Date('2026-03-03'), plannedEnd: new Date('2026-03-07'),
      notes: 'Mart planlamasi — soguk depo hazirlanacak, onay bekleniyor',
    },
    {
      orderNumber: 'UE-20260217-001',
      productId: pm['PRD-006'], recipeId: rm['REC-006'],
      plannedQuantity: 1500, status: 'PLANNED' as ProductionOrderStatus, priority: 2,
      plannedStart: new Date('2026-03-01'), plannedEnd: new Date('2026-03-05'),
      assignedTo: 'Zeynep Teknisyen', notes: 'Kolajen serisi ilk uretim — pilot batch',
    },
    {
      orderNumber: 'UE-20260218-001',
      productId: pm['PRD-007'], recipeId: rm['REC-007'],
      plannedQuantity: 5000, status: 'PLANNED' as ProductionOrderStatus, priority: 3,
      plannedStart: new Date('2026-02-25'), plannedEnd: new Date('2026-03-02'),
      assignedTo: 'Mehmet Usta', notes: 'Magnezyum ilk buyuk parti — yuksek talep bekleniyor',
    },
    {
      orderNumber: 'UE-20260219-001',
      productId: pm['PRD-008'], recipeId: rm['REC-008'],
      plannedQuantity: 1000, status: 'DRAFT' as ProductionOrderStatus, priority: 1,
      plannedStart: new Date('2026-03-10'), plannedEnd: new Date('2026-03-12'),
      notes: 'CoQ10 pilot uretim — kucuk parti, pazar testi icin',
    },
  ];

  for (const order of orders) {
    await prisma.productionOrder.upsert({
      where: { orderNumber: order.orderNumber },
      update: {},
      create: order,
    });
  }
  console.log('   → 5 yeni uretim emri (UE-20260215..219) eklendi.');
}

// ─── GÖREV 3: Ürün Stoklarını Güncelle ───────────────────────────────────────

async function seedUpdateProductStocks() {
  console.log('[6/7] Urun stoklari guncelleniyor...');
  const updates = [
    { code: 'PRD-001', currentStock: 5000, costPrice: 62.50 },  // 5000 - 500 - 1000 + 50 RETURN üstüne üretim var
    { code: 'PRD-002', currentStock: 3000, costPrice: 95.00 },  // 3000 - 200 - 500
    { code: 'PRD-003', currentStock: 1000, costPrice: 48.00 },  // 1000 - 300
    { code: 'PRD-004', currentStock: 800,  costPrice: 115.00 },
    { code: 'PRD-005', currentStock: 500,  costPrice: 125.00 },
    { code: 'PRD-006', currentStock: 600,  costPrice: 165.00 },
    { code: 'PRD-007', currentStock: 1200, costPrice: 42.00  },
    { code: 'PRD-008', currentStock: 350,  costPrice: 195.00 },
  ];

  for (const { code, currentStock } of updates) {
    await prisma.product.update({ where: { code }, data: { currentStock } });
  }
  console.log('   → 8 urunun stogu guncellendi.');
}

// ─── GÖREV 4: Stok Hareketleri (35+ kayıt) ───────────────────────────────────

async function seedStockMovements() {
  console.log('[7/7] Stok hareketleri oluşturuluyor...');
  const materials = await prisma.material.findMany({ select: { id: true, code: true } });
  const products  = await prisma.product.findMany({ select: { id: true, code: true } });
  const mm = Object.fromEntries(materials.map(m => [m.code, m.id]));
  const pm = Object.fromEntries(products.map(p => [p.code, p.id]));

  // In-memory stok takibi (Ocak başı bakiyeleri — hareketler öncesi)
  const matStk: Record<string, number> = {
    'HM-001': 130, 'HM-002': 104.7, 'HM-003': 5.12, 'HM-004': 70,
    'HM-005': 100, 'HM-006': 3,     'HM-007': 20,   'HM-008': 2.5,
    'HM-009': 60,  'HM-010': 2.5,   'HM-011': 16,
    'AM-001': 306000, 'AM-002': 7000, 'AM-003': 30700, 'AM-004': 30500,
  };
  const prdStk: Record<string, number> = {
    'PRD-001': 0, 'PRD-002': 0, 'PRD-003': 0,
  };

  function getSet(
    type: StockMovementType,
    matCode: string | null,
    prdCode: string | null,
    qty: number, // signed for ADJUSTMENT, absolute for others
  ): { prev: number; next: number } {
    const key   = matCode ?? prdCode!;
    const stk   = matCode ? matStk : prdStk;
    const prev  = stk[key] ?? 0;
    let delta   = qty;
    if (type === 'INBOUND' || type === 'PRODUCTION_IN') {
      delta = +Math.abs(qty);
    } else if (prdCode && type === 'RETURN') {
      // Müşteri iadesi: ürün stoğu ARTAR
      delta = +Math.abs(qty);
    } else if (type === 'OUTBOUND' || type === 'PRODUCTION_OUT' || type === 'WASTE' || type === 'RETURN') {
      // Satış çıkışı, üretim çıkışı, fire, tedarikçi iadesi: stok AZALIR
      delta = -Math.abs(qty);
    }
    // ADJUSTMENT: qty zaten işaretli (+/-)
    const next  = Math.max(0, prev + delta);
    stk[key]    = next;
    return { prev, next };
  }

  interface RawMovement {
    movementNumber: string;
    type: StockMovementType;
    matCode?: string;
    prdCode?: string;
    qty: number;
    unit: string;
    unitPrice?: number;
    refType: string;
    refId: string;
    desc: string;
    by: string;
    at: Date;
  }

  const raw: RawMovement[] = [
    // ── A. Hammadde Girişleri (INBOUND) — 10 kayıt ──────────────────────────
    { movementNumber: 'SM-20260110-001', type: 'INBOUND', matCode: 'HM-002', qty: 80,     unit: 'Lt',   unitPrice: 890,   refType: 'PURCHASE', refId: 'SIP-20260110-001', desc: 'Omega-3 balik yagi konsantre tedarikci teslimati', by: 'Mehmet Depo', at: new Date('2026-01-10T09:00:00') },
    { movementNumber: 'SM-20260115-001', type: 'INBOUND', matCode: 'HM-001', qty: 120,    unit: 'Kg',   unitPrice: 450,   refType: 'PURCHASE', refId: 'SIP-20260115-001', desc: 'Vitamin C (Askorbik Asit) tedarikci teslimati', by: 'Mehmet Depo', at: new Date('2026-01-15T10:30:00') },
    { movementNumber: 'SM-20260118-001', type: 'INBOUND', matCode: 'HM-005', qty: 100,    unit: 'Kg',   unitPrice: 280,   refType: 'PURCHASE', refId: 'SIP-20260118-001', desc: 'Magnezyum Sitrat tedarikci teslimati', by: 'Ahmet Depo', at: new Date('2026-01-18T11:00:00') },
    { movementNumber: 'SM-20260120-001', type: 'INBOUND', matCode: 'HM-004', qty: 50,     unit: 'Kg',   unitPrice: 320,   refType: 'PURCHASE', refId: 'SIP-20260120-001', desc: 'Cinko Glukonat tedarikci teslimati', by: 'Mehmet Depo', at: new Date('2026-01-20T09:30:00') },
    { movementNumber: 'SM-20260122-001', type: 'INBOUND', matCode: 'HM-007', qty: 25,     unit: 'Kg',   unitPrice: 1800,  refType: 'PURCHASE', refId: 'SIP-20260122-001', desc: 'Kolajen Peptit tedarikci teslimati', by: 'Ahmet Depo', at: new Date('2026-01-22T14:00:00') },
    { movementNumber: 'SM-20260125-001', type: 'INBOUND', matCode: 'AM-001', qty: 200000, unit: 'Adet', unitPrice: 0.08,  refType: 'PURCHASE', refId: 'SIP-20260125-001', desc: 'Jelatin kapsul (Size 0) ambalaj teslimati', by: 'Ali Depo', at: new Date('2026-01-25T10:00:00') },
    { movementNumber: 'SM-20260128-001', type: 'INBOUND', matCode: 'AM-002', qty: 8000,   unit: 'Adet', unitPrice: 2.50,  refType: 'PURCHASE', refId: 'SIP-20260128-001', desc: 'Cam sise 60ml (damlalikli) teslimati', by: 'Ali Depo', at: new Date('2026-01-28T09:00:00') },
    { movementNumber: 'SM-20260130-001', type: 'INBOUND', matCode: 'AM-003', qty: 50000,  unit: 'Adet', unitPrice: 0.45,  refType: 'PURCHASE', refId: 'SIP-20260130-001', desc: 'Blister ambalaj (10lu) teslimati', by: 'Mehmet Depo', at: new Date('2026-01-30T13:30:00') },
    { movementNumber: 'SM-20260201-001', type: 'INBOUND', matCode: 'HM-003', qty: 10,     unit: 'Kg',   unitPrice: 2200,  refType: 'PURCHASE', refId: 'SIP-20260201-001', desc: 'D3 Vitamini (Kolekalsiferol) tedarikci teslimati', by: 'Zeynep Teknisyen', at: new Date('2026-02-01T08:00:00') },
    { movementNumber: 'SM-20260205-001', type: 'INBOUND', matCode: 'HM-006', qty: 5,      unit: 'Kg',   unitPrice: 4500,  refType: 'PURCHASE', refId: 'SIP-20260205-001', desc: 'Probiyotik karisim (50B CFU) soguk zincir teslimati', by: 'Zeynep Teknisyen', at: new Date('2026-02-05T08:00:00') },

    // ── B. Üretime Çıkışlar (PRODUCTION_OUT) — 8 kayıt ──────────────────────
    { movementNumber: 'SM-20260201-002', type: 'PRODUCTION_OUT', matCode: 'HM-001', qty: 5.5,   unit: 'Kg',   unitPrice: 450,  refType: 'PRODUCTION_ORDER', refId: 'UE-20260201-001', desc: 'Vitamin C Tablet uretimi — HM-001 hammadde cekildi', by: 'Ahmet Usta', at: new Date('2026-02-01T08:30:00') },
    { movementNumber: 'SM-20260201-003', type: 'PRODUCTION_OUT', matCode: 'AM-003', qty: 500,   unit: 'Adet', unitPrice: 0.45, refType: 'PRODUCTION_ORDER', refId: 'UE-20260201-001', desc: 'Vitamin C Tablet uretimi — blister ambalaj cekildi', by: 'Ahmet Usta', at: new Date('2026-02-01T09:00:00') },
    { movementNumber: 'SM-20260201-004', type: 'PRODUCTION_OUT', matCode: 'AM-004', qty: 5000,  unit: 'Adet', unitPrice: 1.20, refType: 'PRODUCTION_ORDER', refId: 'UE-20260201-001', desc: 'Vitamin C Tablet uretimi — kutu seti cekildi', by: 'Ahmet Usta', at: new Date('2026-02-01T09:15:00') },
    { movementNumber: 'SM-20260203-002', type: 'PRODUCTION_OUT', matCode: 'HM-002', qty: 4.2,   unit: 'Lt',   unitPrice: 890,  refType: 'PRODUCTION_ORDER', refId: 'UE-20260203-001', desc: 'Omega-3 Kapsul uretimi — balik yagi cekildi', by: 'Mehmet Usta', at: new Date('2026-02-03T08:00:00') },
    { movementNumber: 'SM-20260203-003', type: 'PRODUCTION_OUT', matCode: 'AM-001', qty: 3000,  unit: 'Adet', unitPrice: 0.08, refType: 'PRODUCTION_ORDER', refId: 'UE-20260203-001', desc: 'Omega-3 Kapsul uretimi — jelatin kapsul cekildi', by: 'Mehmet Usta', at: new Date('2026-02-03T08:30:00') },
    { movementNumber: 'SM-20260205-002', type: 'PRODUCTION_OUT', matCode: 'HM-003', qty: 0.12,  unit: 'Kg',   unitPrice: 2200, refType: 'PRODUCTION_ORDER', refId: 'UE-20260205-001', desc: 'D3+K2 Damla uretimi — D3 Vitamini cekildi', by: 'Zeynep Teknisyen', at: new Date('2026-02-05T10:00:00') },
    { movementNumber: 'SM-20260208-002', type: 'PRODUCTION_OUT', matCode: 'HM-001', qty: 3.3,   unit: 'Kg',   unitPrice: 450,  refType: 'PRODUCTION_ORDER', refId: 'UE-20260208-001', desc: 'Buyuk parti Vitamin C uretimi — HM-001 cekildi', by: 'Ahmet Usta', at: new Date('2026-02-08T07:30:00') },
    { movementNumber: 'SM-20260208-003', type: 'PRODUCTION_OUT', matCode: 'AM-001', qty: 3000,  unit: 'Adet', unitPrice: 0.08, refType: 'PRODUCTION_ORDER', refId: 'UE-20260208-001', desc: 'Buyuk parti uretim — kapsul cekildi', by: 'Ahmet Usta', at: new Date('2026-02-08T08:00:00') },

    // ── C. Üretimden Girişler (PRODUCTION_IN) — 3 kayıt ─────────────────────
    { movementNumber: 'SM-20260204-001', type: 'PRODUCTION_IN', prdCode: 'PRD-001', qty: 5000, unit: 'Adet', unitPrice: 62.50, refType: 'PRODUCTION_ORDER', refId: 'UE-20260201-001', desc: 'Vitamin C 1000mg uretim tamamlandi — KK onayli depoya giris', by: 'Dr. Ayse KK', at: new Date('2026-02-04T15:00:00') },
    { movementNumber: 'SM-20260206-001', type: 'PRODUCTION_IN', prdCode: 'PRD-002', qty: 3000, unit: 'Adet', unitPrice: 95.00, refType: 'PRODUCTION_ORDER', refId: 'UE-20260203-001', desc: 'Omega-3 Balik Yagi uretim tamamlandi — depoya giris', by: 'Dr. Ayse KK', at: new Date('2026-02-06T14:30:00') },
    { movementNumber: 'SM-20260210-001', type: 'PRODUCTION_IN', prdCode: 'PRD-003', qty: 1000, unit: 'Adet', unitPrice: 48.00, refType: 'PRODUCTION_ORDER', refId: 'UE-20260205-001', desc: 'D3+K2 Damla ilk parti KK onayli — depoya giris', by: 'Dr. Ayse KK', at: new Date('2026-02-10T11:00:00') },

    // ── D. Satış Çıkışları (OUTBOUND) — 5 kayıt ─────────────────────────────
    { movementNumber: 'SM-20260207-001', type: 'OUTBOUND', prdCode: 'PRD-001', qty: 500,  unit: 'Adet', unitPrice: 189.90, refType: 'SALE', refId: 'STS-20260207-001', desc: 'Vitamin C 1000mg satis — ilk musteri sevkiyati', by: 'Sistem', at: new Date('2026-02-07T10:00:00') },
    { movementNumber: 'SM-20260209-001', type: 'OUTBOUND', prdCode: 'PRD-002', qty: 200,  unit: 'Adet', unitPrice: 249.90, refType: 'SALE', refId: 'STS-20260209-001', desc: 'Omega-3 satis — online siparis sevkiyati', by: 'Sistem', at: new Date('2026-02-09T09:30:00') },
    { movementNumber: 'SM-20260211-001', type: 'OUTBOUND', prdCode: 'PRD-001', qty: 1000, unit: 'Adet', unitPrice: 189.90, refType: 'SALE', refId: 'STS-20260211-001', desc: 'Vitamin C toplu satis — eczane zinciri siparisi', by: 'Sistem', at: new Date('2026-02-11T14:00:00') },
    { movementNumber: 'SM-20260212-001', type: 'OUTBOUND', prdCode: 'PRD-002', qty: 500,  unit: 'Adet', unitPrice: 249.90, refType: 'SALE', refId: 'STS-20260212-001', desc: 'Omega-3 toplu satis — bayi siparisi', by: 'Sistem', at: new Date('2026-02-12T11:00:00') },
    { movementNumber: 'SM-20260213-001', type: 'OUTBOUND', prdCode: 'PRD-003', qty: 300,  unit: 'Adet', unitPrice: 159.90, refType: 'SALE', refId: 'STS-20260213-001', desc: 'D3+K2 satis — ilk musteri siparisleri', by: 'Sistem', at: new Date('2026-02-13T10:30:00') },

    // ── E. Manuel Düzeltmeler (ADJUSTMENT) — 3 kayıt ────────────────────────
    { movementNumber: 'SM-20260210-002', type: 'ADJUSTMENT', matCode: 'HM-008', qty: +0.5,  unit: 'Kg',   refType: 'MANUAL', refId: 'ADJ-20260210-001', desc: 'Biotin sayim duzeltmesi — fazladan stok tespit edildi', by: 'Zeynep Teknisyen', at: new Date('2026-02-10T16:00:00') },
    { movementNumber: 'SM-20260212-002', type: 'ADJUSTMENT', matCode: 'AM-004', qty: -500,  unit: 'Adet', refType: 'MANUAL', refId: 'ADJ-20260212-001', desc: 'Hasarli ambalaj dusuruluyor — kutu seti deformasyonu', by: 'Ahmet Depo', at: new Date('2026-02-12T15:30:00') },
    { movementNumber: 'SM-20260213-002', type: 'ADJUSTMENT', matCode: 'HM-011', qty: +2,    unit: 'Kg',   refType: 'MANUAL', refId: 'ADJ-20260213-001', desc: 'Kurkumin ekstresi ek teslimat — fatura bekleniyor', by: 'Mehmet Depo', at: new Date('2026-02-13T09:00:00') },

    // ── F. Fire/Hurda (WASTE) — 2 kayıt ─────────────────────────────────────
    { movementNumber: 'SM-20260206-002', type: 'WASTE', matCode: 'HM-002', qty: 0.5, unit: 'Lt',   refType: 'MANUAL', refId: 'FIRE-20260206-001', desc: 'Omega-3 yagi sicaklik sапmasi nedeniyle bozuldu — imha edildi', by: 'Dr. Ayse KK', at: new Date('2026-02-06T16:30:00') },
    { movementNumber: 'SM-20260211-002', type: 'WASTE', matCode: 'AM-003', qty: 200, unit: 'Adet', refType: 'MANUAL', refId: 'FIRE-20260211-001', desc: 'Blister ambalaj baski hatasi — kullanılamaz, imha edildi', by: 'Ali Depo', at: new Date('2026-02-11T10:00:00') },

    // ── G. İadeler (RETURN) — 3 kayıt ───────────────────────────────────────
    { movementNumber: 'SM-20260209-002', type: 'RETURN', prdCode: 'PRD-001', qty: 50, unit: 'Adet', unitPrice: 189.90, refType: 'SALE',     refId: 'STS-20260207-001',  desc: 'Musteri iadesi — ambalaj hasari, kontrol edilecek', by: 'Sistem', at: new Date('2026-02-09T14:00:00') },
    { movementNumber: 'SM-20260213-003', type: 'RETURN', matCode: 'HM-009', qty: 5,  unit: 'Kg',   unitPrice: 680,    refType: 'PURCHASE', refId: 'SIP-20260108-001', desc: 'Demir Bisglisinat kalite uyumsuzlugu — tedarikcie iade', by: 'Zeynep Teknisyen', at: new Date('2026-02-13T13:00:00') },
    { movementNumber: 'SM-20260214-001', type: 'RETURN', prdCode: 'PRD-002', qty: 30, unit: 'Adet', unitPrice: 249.90, refType: 'SALE',     refId: 'STS-20260209-001',  desc: 'Omega-3 musteri iadesi — son kullanma tarihi soru', by: 'Sistem', at: new Date('2026-02-14T09:00:00') },
  ];

  const toCreate = raw.map(r => {
    const matCode = r.matCode ?? null;
    const prdCode = r.prdCode ?? null;
    const { prev, next } = getSet(r.type, matCode, prdCode, r.qty);
    const absQty = Math.abs(r.qty);
    const totalValue = r.unitPrice != null ? absQty * r.unitPrice : undefined;

    return {
      movementNumber: r.movementNumber,
      type: r.type,
      materialId: matCode ? mm[matCode] : null,
      productId:  prdCode ? pm[prdCode] : null,
      quantity:   absQty,
      unit:       r.unit,
      previousStock: prev,
      newStock:       next,
      unitPrice:  r.unitPrice ?? null,
      totalValue: totalValue ?? null,
      referenceType: r.refType,
      referenceId:   r.refId,
      description:   r.desc,
      performedBy:   r.by,
      createdAt:     r.at,
    };
  });

  await prisma.stockMovement.createMany({
    data: toCreate,
    skipDuplicates: true,
  });
  console.log(`   → ${toCreate.length} stok hareketi oluşturuldu.`);
}

// ─── Ana Akış ─────────────────────────────────────────────────────────────────

async function main() {
  try {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║   SepeNatural — Seed Expand (Genişletme)    ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    await seedExpandSuppliers();       // GÖREV 5 — tedarikçiler
    await seedExpandMaterials();       // GÖREV 5 — malzemeler
    await seedExpandMaterialBatches(); // GÖREV 2 + 6 — partiler
    await seedExpandRecipes();         // GÖREV 1 — reçeteler
    await seedExpandProductionOrders(); // GÖREV 7 — üretim emirleri
    await seedUpdateProductStocks();   // GÖREV 3 — ürün stokları
    await seedStockMovements();        // GÖREV 4 — stok hareketleri

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║   Seed expand başarıyla tamamlandı!          ║');
    console.log('╚══════════════════════════════════════════════╝\n');
    console.log('Beklenen sonuç:');
    console.log('  Supplier:       8 kayıt');
    console.log('  Material:      24 kayıt');
    console.log('  MaterialBatch: 44+ kayıt');
    console.log('  Product:        8 kayıt (hepsi stoklu)');
    console.log('  Recipe:         8 kayıt');
    console.log('  RecipeItem:    30+ kayıt');
    console.log('  ProductionOrder:13+ kayıt');
    console.log('  StockMovement: 35+ kayıt\n');
  } catch (err) {
    console.error('\n[HATA] Seed expand başarısız:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

main();
