
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const batchNumber = 'BAT-20260203-003';
    console.log(`Querying for batch: ${batchNumber}`);

    const batch = await prisma.productionBatch.findFirst({
        where: { batchNumber },
        include: {
            consumptions: {
                include: {
                    materialBatch: {
                        include: {
                            material: true
                        }
                    }
                }
            }
        }
    });

    if (!batch) {
        console.log('Batch not found!');
        return;
    }

    console.log('Batch found:', batch.id);
    console.log('Consumptions count:', batch.consumptions.length);
    console.log('Consumptions:', JSON.stringify(batch.consumptions, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
