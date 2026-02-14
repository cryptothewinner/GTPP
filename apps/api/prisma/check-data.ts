
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const orgCount = await prisma.organization.count();
    const siteCount = await prisma.productionSite.count();
    const stationCount = await prisma.workStation.count();

    console.log(`Organizations: ${orgCount}`);
    console.log(`Production Sites: ${siteCount}`);
    console.log(`Work Stations: ${stationCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
