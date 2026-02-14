import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlantHierarchyController } from './plant-hierarchy.controller';
import { PlantStepService } from './plant-step.service';
import { WorkCenterService } from './work-center.service';
import { EquipmentService } from './equipment.service';
import { PlantService } from './plant.service';

@Module({
    imports: [PrismaModule],
    controllers: [PlantHierarchyController],
    providers: [PlantStepService, WorkCenterService, EquipmentService, PlantService],
    exports: [PlantStepService, WorkCenterService, EquipmentService, PlantService],
})
export class PlantHierarchyModule { }
