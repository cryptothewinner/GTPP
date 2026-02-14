import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateProcessStepDto,
    UpdateProcessStepDto,
    CreateInstructionDto,
    UpdateInstructionDto,
    ReorderStepsDto,
} from './dto/create-process-definition.dto';

@Injectable()
export class ProcessStepService {
    constructor(private readonly prisma: PrismaService) {}

    async createStep(processDefinitionId: string, dto: CreateProcessStepDto) {
        return this.prisma.processStep.create({
            data: { processDefinitionId, ...dto },
            include: { targetWorkCenter: true, instructions: true },
        });
    }

    async findSteps(processDefinitionId: string) {
        return this.prisma.processStep.findMany({
            where: { processDefinitionId },
            include: {
                instructions: { orderBy: { sequence: 'asc' } },
                targetWorkCenter: true,
            },
            orderBy: { sequence: 'asc' },
        });
    }

    async updateStep(stepId: string, dto: UpdateProcessStepDto) {
        const step = await this.prisma.processStep.findUnique({ where: { id: stepId } });
        if (!step) throw new NotFoundException(`ProcessStep not found: ${stepId}`);

        return this.prisma.processStep.update({
            where: { id: stepId },
            data: dto,
            include: { targetWorkCenter: true, instructions: true },
        });
    }

    async removeStep(stepId: string) {
        const step = await this.prisma.processStep.findUnique({ where: { id: stepId } });
        if (!step) throw new NotFoundException(`ProcessStep not found: ${stepId}`);
        return this.prisma.processStep.delete({ where: { id: stepId } });
    }

    async reorderSteps(processDefinitionId: string, dto: ReorderStepsDto) {
        await this.prisma.$transaction(
            dto.stepIds.map((id, index) =>
                this.prisma.processStep.update({
                    where: { id },
                    data: { sequence: (index + 1) * 10 },
                }),
            ),
        );
        return this.findSteps(processDefinitionId);
    }

    // ─── Instructions ─────────────────────────────────────────

    async createInstruction(stepId: string, dto: CreateInstructionDto) {
        const step = await this.prisma.processStep.findUnique({ where: { id: stepId } });
        if (!step) throw new NotFoundException(`ProcessStep not found: ${stepId}`);

        return this.prisma.instruction.create({
            data: { stepId, ...dto },
        });
    }

    async updateInstruction(instructionId: string, dto: UpdateInstructionDto) {
        const instr = await this.prisma.instruction.findUnique({ where: { id: instructionId } });
        if (!instr) throw new NotFoundException(`Instruction not found: ${instructionId}`);

        return this.prisma.instruction.update({
            where: { id: instructionId },
            data: dto,
        });
    }

    async removeInstruction(instructionId: string) {
        const instr = await this.prisma.instruction.findUnique({ where: { id: instructionId } });
        if (!instr) throw new NotFoundException(`Instruction not found: ${instructionId}`);
        return this.prisma.instruction.delete({ where: { id: instructionId } });
    }
}
