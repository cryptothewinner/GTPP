import { PrismaClient, CapacityType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPP() {
    console.log('Seeding PP data...');

    const plant = await prisma.plant.findUnique({ where: { code: '1001' } });
    if (!plant) {
        console.log('Plant 1001 not found. Run main seed first.');
        return;
    }

    // 1. Work Centers
    console.log('Creating Work Centers...');
    const wcMixing = await prisma.workCenter.upsert({
        where: { code: 'WC-MIX-01' },
        update: {},
        create: {
            code: 'WC-MIX-01',
            name: 'Karisim Unitesi 1',
            plantId: plant.id,
            capacityType: CapacityType.TIME_BASED,
            efficiency: 95,
            hourlyCost: 150.00
        }
    });

    const wcTableting = await prisma.workCenter.upsert({
        where: { code: 'WC-TAB-01' },
        update: {},
        create: {
            code: 'WC-TAB-01',
            name: 'Tablet Baski Makinesi',
            plantId: plant.id,
            capacityType: CapacityType.UNIT_BASED,
            efficiency: 90,
            hourlyCost: 200.00
        }
    });

    const wcPacking = await prisma.workCenter.upsert({
        where: { code: 'WC-PAC-01' },
        update: {},
        create: {
            code: 'WC-PAC-01',
            name: 'Blister Paketleme Hatti',
            plantId: plant.id,
            capacityType: CapacityType.UNIT_BASED,
            efficiency: 85,
            hourlyCost: 120.00
        }
    });

    // 2. Routings (for Product PRD-001)
    console.log('Creating Routing for PRD-001...');
    const product = await prisma.product.findUnique({ where: { code: 'PRD-001' } });
    if (product) {
        // Check if routing exists
        const existingRouting = await prisma.routing.findFirst({
            where: { productId: product.id, isActive: true }
        });

        if (!existingRouting) {
            await prisma.routing.create({
                data: {
                    productId: product.id,
                    version: 1,
                    isActive: true,
                    steps: {
                        create: [
                            { stepNumber: 10, description: 'Hammadde Tartim ve Karisim', standardTime: 30, setupTime: 15 }, // WC-MIX-01 usually
                            { stepNumber: 20, description: 'Tablet Baski', standardTime: 60, setupTime: 30 }, // WC-TAB-01
                            { stepNumber: 30, description: 'Blister Paketleme', standardTime: 45, setupTime: 20 }, // WC-PAC-01
                        ]
                    }
                }
            });
            console.log('Routing created for PRD-001');
        } else {
            console.log('Routing already exists for PRD-001');
        }
    }

    console.log('PP Seeding completed.');
}

seedPP()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
