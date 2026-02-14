// apps/api/prisma/seed.ts

import { PrismaClient, MaterialType, ProductionOrderStatus, BatchStatus, MaterialBatchStatus, PlantStepType, CapacityType, BPCategory, BPRole, AddressType, EquipmentStatus } from '@prisma/client';
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

async function seedEnterpriseStructure() {
    console.log('Seeding enterprise structure...');

    // Company Code
    const company = await prisma.companyCode.upsert({
        where: { code: '1000' },
        update: {},
        create: {
            code: '1000',
            name: 'Sepe Natural A.S.',
            currency: 'TRY',
        }
    });

    // Plant
    const plant = await prisma.plant.upsert({
        where: { code: '1001' },
        update: {},
        create: {
            code: '1001',
            name: 'Gebze Uretim Tesisi',
            companyCodeId: company.id,
            address: 'Gebze OSB 1. Cadde',
        }
    });

    // Storage Locations
    await prisma.storageLocation.upsert({
        where: { plantId_code: { plantId: plant.id, code: '0001' } },
        update: {},
        create: { plantId: plant.id, code: '0001', name: 'Hammadde Depo' }
    });
    await prisma.storageLocation.upsert({
        where: { plantId_code: { plantId: plant.id, code: '0002' } },
        update: {},
        create: { plantId: plant.id, code: '0002', name: 'Ambalaj Depo' }
    });
    await prisma.storageLocation.upsert({
        where: { plantId_code: { plantId: plant.id, code: '0003' } },
        update: {},
        create: { plantId: plant.id, code: '0003', name: 'Mamul Depo' }
    });

    // Plant Hierarchy (Steps)
    const areas = ['Tablet Uretim', 'Likid Uretim', 'Paketleme'];
    const areaMap: Record<string, string> = {};

    for (const areaName of areas) {
        const step = await prisma.plantStep.upsert({
            where: { code: `AREA-${areaName.substring(0, 3).toUpperCase()}` },
            update: {},
            create: {
                plantId: plant.id,
                code: `AREA-${areaName.substring(0, 3).toUpperCase()}`,
                name: areaName,
                type: PlantStepType.AREA
            }
        });
        areaMap[areaName] = step.id;
    }

    // Work Centers
    const workCenters = [
        { code: 'WC-WEIGH-01', name: 'Tartim Odasi 1', plantStepId: areaMap['Tablet Uretim'], hourlyCost: 150 },
        { code: 'WC-MIX-01', name: 'Granulasyon Mikseri', plantStepId: areaMap['Tablet Uretim'], hourlyCost: 200 },
        { code: 'WC-PRESS-01', name: 'Tablet Presi - Fette', plantStepId: areaMap['Tablet Uretim'], hourlyCost: 500 },
        { code: 'WC-COAT-01', name: 'Kaplama Makinesi', plantStepId: areaMap['Tablet Uretim'], hourlyCost: 300 },
        { code: 'WC-FILL-01', name: 'Sivi Dolum Hatti', plantStepId: areaMap['Likid Uretim'], hourlyCost: 400 },
        { code: 'WC-PACK-01', name: 'Blister Hatti', plantStepId: areaMap['Paketleme'], hourlyCost: 250 },
        { code: 'WC-PACK-02', name: 'Kutu Paketleme', plantStepId: areaMap['Paketleme'], hourlyCost: 100 },
    ];

    for (const wc of workCenters) {
        const workCenter = await prisma.workCenter.upsert({
            where: { code: wc.code },
            update: {},
            create: {
                code: wc.code,
                name: wc.name,
                plantId: plant.id,
                plantStepId: wc.plantStepId,
                hourlyCost: wc.hourlyCost,
                capacityType: CapacityType.TIME_BASED
            }
        });

        // Add minimal equipment for each workcenter
        await prisma.equipment.upsert({
            where: { code: `EQ-${wc.code.split('-')[1]}-01` },
            update: {},
            create: {
                code: `EQ-${wc.code.split('-')[1]}-01`,
                name: `${wc.name} Ana Ekipman`,
                workCenterId: workCenter.id,
                status: EquipmentStatus.IDLE
            }
        });
    }

    console.log('Enterprise structure seeded.');
}

async function seedBusinessPartners() {
    console.log('Seeding business partners...');

    const suppliers = [
        { code: '10001', name: 'Vitamin Dunyasi Kimya A.S.', leadTime: 7 },
        { code: '10002', name: 'Dogal Hammadde Ltd. Sti.', leadTime: 14 },
        { code: '10003', name: 'BioTech Ithalat Ihracat A.S.', leadTime: 21 },
        { code: '10004', name: 'Deniz Balik Yaglari San.', leadTime: 10 },
        { code: '10005', name: 'Ambalaj Plus Paketleme', leadTime: 5 },
    ];

    for (const sup of suppliers) {
        const bp = await prisma.businessPartner.upsert({
            where: { bpNumber: sup.code },
            update: {},
            create: {
                bpNumber: sup.code,
                category: BPCategory.ORGANIZATION,
                name1: sup.name,
                roles: [BPRole.SUPPLIER],
                isActive: true
            }
        });

        // Supplier Details
        await prisma.supplierDetails.upsert({
            where: { bpId: bp.id },
            update: {},
            create: {
                bpId: bp.id,
                leadTimeDays: sup.leadTime,
                currency: 'TRY'
            }
        });
    }
    console.log('Business partners seeded.');
}

async function seedMaterials() {
    console.log('Seeding materials...');
    // We need to fetch suppliers to link them
    const supplier1 = await prisma.businessPartner.findUnique({ where: { bpNumber: '10001' } });
    const supplier4 = await prisma.businessPartner.findUnique({ where: { bpNumber: '10004' } });
    const supplier5 = await prisma.businessPartner.findUnique({ where: { bpNumber: '10005' } });

    const materials = [
        { code: 'HM-001', name: 'Vitamin C (Askorbik Asit)', type: MaterialType.RAW_MATERIAL, unit: 'Kg', supplierId: supplier1?.id },
        { code: 'HM-002', name: 'Omega-3 Balik Yagi', type: MaterialType.RAW_MATERIAL, unit: 'Lt', supplierId: supplier4?.id },
        { code: 'AM-001', name: 'Jelatin Kapsul (Size 0)', type: MaterialType.PACKAGING, unit: 'Adet', supplierId: supplier5?.id },
        { code: 'AM-004', name: 'Etiket ve Kutu Seti', type: MaterialType.PACKAGING, unit: 'Adet', supplierId: supplier5?.id },
    ];

    for (const mat of materials) {
        await prisma.material.upsert({
            where: { code: mat.code },
            update: {},
            create: {
                code: mat.code,
                name: mat.name,
                type: mat.type,
                unitOfMeasure: mat.unit,
                supplierId: mat.supplierId,
                isActive: true
            }
        });
    }
    console.log('Materials seeded.');
}

async function seedProducts() {
    console.log('Seeding products...');
    const products = [
        { code: 'PRD-001', name: 'SepeNatural Vitamin C 1000mg', unit: 'Adet' },
        { code: 'PRD-002', name: 'SepeNatural Omega-3', unit: 'Adet' },
    ];

    for (const prd of products) {
        await prisma.product.upsert({
            where: { code: prd.code },
            update: {},
            create: {
                code: prd.code,
                name: prd.name,
                unitOfMeasure: prd.unit,
                isActive: true,
                salePrice: 100 // Dummy
            }
        });
    }
    console.log('Products seeded.');
}

async function seedRecipes() {
    console.log('Seeding recipes...');
    const p1 = await prisma.product.findUnique({ where: { code: 'PRD-001' } });
    const m1 = await prisma.material.findUnique({ where: { code: 'HM-001' } });
    const m2 = await prisma.material.findUnique({ where: { code: 'AM-004' } });

    if (p1 && m1 && m2) {
        await prisma.recipe.upsert({
            where: { code: 'REC-001' },
            update: {},
            create: {
                code: 'REC-001',
                name: 'Vitamin C Tablet Recetesi',
                productId: p1.id,
                batchSize: 5000,
                items: {
                    create: [
                        { materialId: m1.id, quantity: 5.5, unit: 'Kg', order: 1 },
                        { materialId: m2.id, quantity: 5000, unit: 'Adet', order: 2 }
                    ]
                }
            }
        });
    }
    console.log('Recipes seeded.');
}

// Minimal Production Order Seed
async function seedProductionOrders() {
    console.log('Seeding production orders...');
    const p1 = await prisma.product.findUnique({ where: { code: 'PRD-001' } });
    const r1 = await prisma.recipe.findUnique({ where: { code: 'REC-001' } });

    if (p1 && r1) {
        await prisma.productionOrder.upsert({
            where: { orderNumber: 'UE-20260201-001' },
            update: {},
            create: {
                orderNumber: 'UE-20260201-001',
                productId: p1.id,
                recipeId: r1.id,
                plannedQuantity: 5000,
                status: ProductionOrderStatus.PLANNED,
                plannedStart: new Date(),
                plannedEnd: new Date(Date.now() + 86400000)
            }
        });
    }
    console.log('Production orders seeded.');
}

// We can skip metadata seeding for now or add a simplified version, 
// as the previous metadata was very specific to the old schema.
// A full metadata seed would be too long for this single block, 
// but we can add essential metadata if needed. For now, let's keep it minimal for system start.

async function main() {
    try {
        await seedUsers();
        await seedEnterpriseStructure();
        await seedBusinessPartners();
        await seedMaterials();
        await seedProducts();
        await seedRecipes();
        await seedProductionOrders();
        console.log('\nAll seeds completed successfully (SAP Structure)!');

    } catch (error) {
        console.error('Seed error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
