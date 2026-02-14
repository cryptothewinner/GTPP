import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { PlantStepService } from './plant-step.service';
import { WorkCenterService } from './work-center.service';
import { EquipmentService } from './equipment.service';
import { PlantService } from './plant.service';
import { CreatePlantStepDto, UpdatePlantStepDto } from './dto/create-plant-step.dto';
import { CreateWorkCenterDto, UpdateWorkCenterDto } from './dto/create-work-center.dto';
import { CreateEquipmentDto, UpdateEquipmentDto } from './dto/create-equipment.dto';
import { CreateEquipmentCapabilityDto } from './dto/create-equipment-capability.dto';
import { PlantStepType, EquipmentStatus } from '@prisma/client';

@Controller('plant-hierarchy')
export class PlantHierarchyController {
    constructor(
        private readonly plantStepService: PlantStepService,
        private readonly workCenterService: WorkCenterService,
        private readonly equipmentService: EquipmentService,
        private readonly plantService: PlantService,
    ) { }

    // ─── Plants ───────────────────────────────────────────────

    @Get('plants')
    findAllPlants() {
        return this.plantService.findAll();
    }

    @Get('plants/:id')
    findOnePlant(@Param('id') id: string) {
        return this.plantService.findOne(id);
    }

    // ─── Plant Steps ──────────────────────────────────────────

    @Post('plant-steps')
    createPlantStep(@Body() dto: CreatePlantStepDto) {
        return this.plantStepService.create(dto);
    }

    @Get('plant-steps')
    findAllPlantSteps(
        @Query('plantId') plantId?: string,
        @Query('parentId') parentId?: string,
        @Query('type') type?: PlantStepType,
    ) {
        return this.plantStepService.findAll(plantId, parentId, type);
    }

    @Get('plant-steps/tree')
    findPlantStepTree(@Query('plantId') plantId?: string) {
        return this.plantStepService.findTree(plantId);
    }

    @Get('plant-steps/:id')
    findOnePlantStep(@Param('id') id: string) {
        return this.plantStepService.findOne(id);
    }

    @Patch('plant-steps/:id')
    updatePlantStep(@Param('id') id: string, @Body() dto: UpdatePlantStepDto) {
        return this.plantStepService.update(id, dto);
    }

    @Delete('plant-steps/:id')
    removePlantStep(@Param('id') id: string) {
        return this.plantStepService.remove(id);
    }

    // ─── Work Centers ─────────────────────────────────────────

    @Post('work-centers')
    createWorkCenter(@Body() dto: CreateWorkCenterDto) {
        return this.workCenterService.create(dto);
    }

    @Get('work-centers')
    findAllWorkCenters(
        @Query('plantId') plantId?: string,
        @Query('plantStepId') plantStepId?: string,
    ) {
        return this.workCenterService.findAll(plantId, plantStepId);
    }

    @Get('work-centers/:id')
    findOneWorkCenter(@Param('id') id: string) {
        return this.workCenterService.findOne(id);
    }

    @Patch('work-centers/:id')
    updateWorkCenter(@Param('id') id: string, @Body() dto: UpdateWorkCenterDto) {
        return this.workCenterService.update(id, dto);
    }

    @Delete('work-centers/:id')
    removeWorkCenter(@Param('id') id: string) {
        return this.workCenterService.remove(id);
    }

    // ─── Equipment ────────────────────────────────────────────

    @Post('equipment')
    createEquipment(@Body() dto: CreateEquipmentDto) {
        return this.equipmentService.create(dto);
    }

    @Get('equipment')
    findAllEquipment(
        @Query('workCenterId') workCenterId?: string,
        @Query('status') status?: EquipmentStatus,
    ) {
        return this.equipmentService.findAll(workCenterId, status);
    }

    @Get('equipment/by-capability')
    findEquipmentByCapability(@Query('processType') processType: string) {
        return this.equipmentService.findByCapability(processType);
    }

    @Get('equipment/:id')
    findOneEquipment(@Param('id') id: string) {
        return this.equipmentService.findOne(id);
    }

    @Patch('equipment/:id')
    updateEquipment(@Param('id') id: string, @Body() dto: UpdateEquipmentDto) {
        return this.equipmentService.update(id, dto);
    }

    @Patch('equipment/:id/status')
    updateEquipmentStatus(@Param('id') id: string, @Body() body: { status: EquipmentStatus }) {
        return this.equipmentService.updateStatus(id, body.status);
    }

    // ─── Equipment Capabilities ───────────────────────────────

    @Post('equipment/:id/capabilities')
    addCapability(@Param('id') id: string, @Body() dto: CreateEquipmentCapabilityDto) {
        return this.equipmentService.addCapability(id, dto);
    }

    @Delete('equipment/capabilities/:capId')
    removeCapability(@Param('capId') capId: string) {
        return this.equipmentService.removeCapability(capId);
    }
}
