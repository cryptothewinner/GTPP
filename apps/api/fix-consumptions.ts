
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const batchNumber = 'BAT-20260203-003';
    console.log(`Fixing consumptions for batch: ${batchNumber}`);

    const batch = await prisma.productionBatch.findFirst({
        where: { batchNumber },
    });

    if (!batch) {
        console.log('Batch not found!');
        return;
    }

    // Find materials
    const materialBatches = await prisma.materialBatch.findMany({
        include: { material: true }
    });

    const mbMap = new Map();
    materialBatches.forEach(mb => {
        // Mapping by material code for simplicity in finding a suitable batch
        if (!mbMap.has(mb.material.code)) {
            mbMap.set(mb.material.code, mb.id);
        }
    });

    // Omega-3 Recipe items (Hardcoded for fix)
    // HM-002, AM-001, AM-004

    const consumptions = [
        {
            productionBatchId: batch.id,
            materialBatchId: mbMap.get('HM-002'), // Omega-3 Oil
            consumedQuantity: 0.7, // 500 units * (4.2 / 3000)
            unit: 'Lt',
            materialStorageLocation: 'Soguk Oda / Tank 02',
            timestamp: new Date(),
        },
        {
            productionBatchId: batch.id,
            materialBatchId: mbMap.get('AM-001'), // Capsules
            consumedQuantity: 500,
            unit: 'Adet',
            materialStorageLocation: 'Ambalaj Depo B / Raf 08',
            timestamp: new Date(),
        },
        {
            productionBatchId: batch.id,
            materialBatchId: mbMap.get('AM-004'), // Bottles/Boxes
            consumedQuantity: 500,
            unit: 'Adet',
            materialStorageLocation: 'Ambalaj Depo C / Raf 02',
            timestamp: new Date(),
        }
    ];

    // Filter out any missing material batches
    const validConsumptions = consumptions.filter(c => c.materialBatchId);

    if (validConsumptions.length === 0) {
        console.error("Could not find material batches to link!");
        return;
    }

    console.log(`Creating ${validConsumptions.length} consumption records...`);

    await prisma.productionBatchConsumption.createMany({
        data: validConsumptions,
        skipDuplicates: true
    });

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
