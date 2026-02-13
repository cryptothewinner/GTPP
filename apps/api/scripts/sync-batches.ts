
import { PrismaClient, MaterialType } from '@prisma/client';

const prisma = new PrismaClient();

async function syncInitialBatches() {
    console.log('Starting batch sync...');
    const materials = await prisma.material.findMany({
        include: { batches: true },
    });

    let createdCount = 0;

    for (const material of materials) {
        const currentStock = Number(material.currentStock);
        if (currentStock <= 0) continue;

        const batchTotal = material.batches.reduce((sum, b) => sum + Number(b.remainingQuantity), 0);

        // If there's a discrepancy or no batches at all for positive stock
        if (batchTotal < currentStock) {
            const diff = currentStock - batchTotal;
            console.log(`Creating batch for ${material.code} (${material.name}): Stock=${currentStock}, Batches=${batchTotal}, Diff=${diff}`);

            await prisma.materialBatch.create({
                data: {
                    materialId: material.id,
                    batchNumber: `${material.code}-INIT-${new Date().getFullYear()}`,
                    supplierLotNo: 'DEVIR',
                    quantity: diff,
                    remainingQuantity: diff,
                    status: 'AVAILABLE',
                    manufacturingDate: new Date(),
                    // Default 1 year expiry if not specified
                    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    storageLocation: 'DEPO-1',
                },
            });
            createdCount++;
        }
    }

    console.log(`Sync complete. Created ${createdCount} batches.`);
}

syncInitialBatches()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
