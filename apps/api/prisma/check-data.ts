
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    console.log('Checking Business Partners...');
    const count = await prisma.businessPartner.count();
    console.log(`Total BPs: ${count}`);

    const customers = await prisma.businessPartner.findMany({
        where: {
            roles: {
                has: 'CUSTOMER'
            }
        },
        select: { bpNumber: true, name1: true, roles: true }
    });
    console.log('Customers with Role CUSTOMER:', JSON.stringify(customers, null, 2));

    const allBps = await prisma.businessPartner.findMany({
        select: { bpNumber: true, name1: true, roles: true }
    });
    console.log('All BPs:', JSON.stringify(allBps, null, 2));
}

checkData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
