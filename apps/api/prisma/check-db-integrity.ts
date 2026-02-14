
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkIntegrity() {
    console.log('--- Database Integrity Check Report ---\n');

    // 1. Enterprise Structure
    console.log('1. Enterprise Structure:');
    const company = await prisma.companyCode.findFirst({ include: { plants: { include: { storageLocs: true, workCenters: true } } } });
    if (!company) {
        console.log('❌ No Company Code found.');
    } else {
        console.log(`✅ Company: ${company.code} - ${company.name}`);
        if (company.plants.length === 0) {
            console.log('  ❌ No Plants linked to Company.');
        } else {
            for (const plant of company.plants) {
                console.log(`  ✅ Plant: ${plant.code} - ${plant.name}`);
                console.log(`    - Storage Locations: ${plant.storageLocs.length} found.`);
                console.log(`    - Work Centers: ${plant.workCenters.length} found.`);

                // Check Work Center -> Equipment/Step links
                const wcs = await prisma.workCenter.findMany({
                    where: { plantId: plant.id },
                    include: { equipment: true, plantStep: true }
                });
                for (const wc of wcs) {
                    const stepStatus = wc.plantStep ? `✅ Linked to Step: ${wc.plantStep.name}` : '❌ Orphaned (No Plant Step)';
                    const eqStatus = wc.equipment.length > 0 ? `✅ Equipment: ${wc.equipment.length}` : '⚠️ No Equipment';
                    console.log(`    -> WC: ${wc.code} | ${stepStatus} | ${eqStatus}`);
                }
            }
        }
    }
    console.log('\n');

    // 2. Materials & Partners
    console.log('2. Materials & Business Partners:');
    const suppliers = await prisma.businessPartner.count({ where: { roles: { has: 'SUPPLIER' } } });
    console.log(`ℹ️  Total Suppliers: ${suppliers}`);

    const materials = await prisma.material.findMany({ include: { supplier: true } });
    console.log(`ℹ️  Total Materials: ${materials.length}`);
    const unlinkedMaterials = materials.filter(m => !m.supplierId);
    if (unlinkedMaterials.length > 0) {
        console.log(`  ⚠️ ${unlinkedMaterials.length} materials have no Supplier linked.`);
        unlinkedMaterials.forEach(m => console.log(`    - ${m.code} (${m.name})`));
    } else {
        console.log('  ✅ All materials linked to a Supplier.');
    }
    console.log('\n');

    // 3. Products & Recipes
    console.log('3. Products & Recipes:');
    const products = await prisma.product.findMany({ include: { recipes: { include: { items: true } } } });
    for (const p of products) {
        console.log(`Product: ${p.code} (${p.name})`);
        if (p.recipes.length === 0) {
            console.log('  ❌ No Recipe defined.');
        } else {
            for (const r of p.recipes) {
                console.log(`  ✅ Recipe: ${r.code} (${r.items.length} items)`);
                // Check if recipe items link to valid materials
                let validItems = true;
                for (const item of r.items) {
                    if (!item.materialId) {
                        console.log(`    ❌ Recipe Item ID ${item.id} has no Material ID!`);
                        validItems = false;
                    }
                }
                if (validItems) console.log('    ✅ All recipe items linked to Materials.');
            }
        }
    }
    console.log('\n');

    // 4. Production Orders
    console.log('4. Production Orders:');
    const orders = await prisma.productionOrder.findMany({ include: { product: true, recipe: true } });
    if (orders.length === 0) {
        console.log('⚠️ No Production Orders found.');
    } else {
        for (const order of orders) {
            const productStatus = order.product ? '✅ Product Linked' : '❌ Product Missing';
            const recipeStatus = order.recipe ? '✅ Recipe Linked' : '❌ Recipe Missing';
            console.log(`Order: ${order.orderNumber} | ${productStatus} | ${recipeStatus} | Status: ${order.status}`);
        }
    }
    console.log('\n');

    // 5. Sales (Phase 1 Check)
    console.log('5. Sales Module (Phase 1):');
    const quotations = await prisma.salesQuotation.findMany(); // Assuming model exists
    const salesOrders = await prisma.salesOrder.findMany(); // Assuming model exists

    console.log(`ℹ️  Sales Quotations: ${quotations.length}`);
    console.log(`ℹ️  Sales Orders: ${salesOrders.length}`);

    if (quotations.length === 0 && salesOrders.length === 0) {
        console.log('⚠️ No Sales data found (Expected if only seed ran).');
    }

}

checkIntegrity()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
