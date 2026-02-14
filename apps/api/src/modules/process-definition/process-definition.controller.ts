import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ProcessDefinitionService } from './process-definition.service';
import { ProcessStepService } from './process-step.service';
import {
    CreateProcessDefinitionDto,
    UpdateProcessDefinitionDto,
    CreateProcessStepDto,
    UpdateProcessStepDto,
    CreateInstructionDto,
    UpdateInstructionDto,
    ReorderStepsDto,
} from './dto/create-process-definition.dto';
import { ProcessDefinitionStatus } from '@prisma/client';

@Controller('process-definitions')
export class ProcessDefinitionController {
    constructor(
        private readonly definitionService: ProcessDefinitionService,
        private readonly stepService: ProcessStepService,
    ) {}

    // ─── Process Definitions ──────────────────────────────────

    @Post()
    create(@Body() dto: CreateProcessDefinitionDto) {
        return this.definitionService.create(dto);
    }

    @Get()
    findAll(
        @Query('productId') productId?: string,
        @Query('status') status?: ProcessDefinitionStatus,
    ) {
        return this.definitionService.findAll(productId, status);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.definitionService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateProcessDefinitionDto) {
        return this.definitionService.update(id, dto);
    }

    @Patch(':id/approve')
    approve(@Param('id') id: string, @Body('userId') userId: string) {
        return this.definitionService.approve(id, userId);
    }

    @Post(':id/new-version')
    createNewVersion(@Param('id') id: string) {
        return this.definitionService.createNewVersion(id);
    }

    // ─── Process Steps ────────────────────────────────────────

    @Post(':defId/steps')
    createStep(@Param('defId') defId: string, @Body() dto: CreateProcessStepDto) {
        return this.stepService.createStep(defId, dto);
    }

    @Get(':defId/steps')
    findSteps(@Param('defId') defId: string) {
        return this.stepService.findSteps(defId);
    }

    @Patch('steps/:stepId')
    updateStep(@Param('stepId') stepId: string, @Body() dto: UpdateProcessStepDto) {
        return this.stepService.updateStep(stepId, dto);
    }

    @Delete('steps/:stepId')
    removeStep(@Param('stepId') stepId: string) {
        return this.stepService.removeStep(stepId);
    }

    @Patch(':defId/steps/reorder')
    reorderSteps(@Param('defId') defId: string, @Body() dto: ReorderStepsDto) {
        return this.stepService.reorderSteps(defId, dto);
    }

    // ─── Instructions ─────────────────────────────────────────

    @Post('steps/:stepId/instructions')
    createInstruction(@Param('stepId') stepId: string, @Body() dto: CreateInstructionDto) {
        return this.stepService.createInstruction(stepId, dto);
    }

    @Patch('instructions/:instrId')
    updateInstruction(@Param('instrId') instrId: string, @Body() dto: UpdateInstructionDto) {
        return this.stepService.updateInstruction(instrId, dto);
    }

    @Delete('instructions/:instrId')
    removeInstruction(@Param('instrId') instrId: string) {
        return this.stepService.removeInstruction(instrId);
    }
}
