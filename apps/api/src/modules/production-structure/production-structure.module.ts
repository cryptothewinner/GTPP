import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProductionStructureController } from './production-structure.controller';
import { OrganizationService } from './organization.service';
import { WorkStationService } from './work-station.service';
import { ProductionPlanService } from './production-plan.service';

@Module({
    imports: [PrismaModule],
    controllers: [ProductionStructureController],
    providers: [OrganizationService, WorkStationService, ProductionPlanService],
    exports: [OrganizationService, WorkStationService, ProductionPlanService],
})
export class ProductionStructureModule { }
