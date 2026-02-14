import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProcessDefinitionDto, UpdateProcessDefinitionDto } from './dto/create-process-definition.dto';
import { ProcessDefinitionStatus } from '@prisma/client';

@Injectable()
export class ProcessDefinitionService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateProcessDefinitionDto) {
        return this.prisma.processDefinition.create({
            data: dto,
            include: { product: true, steps: true },
        });
    }

    async findAll(productId?: string, status?: ProcessDefinitionStatus) {
        const where: any = {};
        if (productId) where.productId = productId;
        if (status) where.status = status;

        return this.prisma.processDefinition.findMany({
            where,
            include: {
                product: true,
                _count: { select: { steps: true } },
            },
            orderBy: [{ code: 'asc' }, { version: 'desc' }],
        });
    }

    async findOne(id: string) {
        const def = await this.prisma.processDefinition.findUnique({
            where: { id },
            include: {
                product: true,
                steps: {
                    orderBy: { sequence: 'asc' },
                    include: {
                        instructions: { orderBy: { sequence: 'asc' } },
                        targetWorkCenter: true,
                    },
                },
            },
        });
        if (!def) throw new NotFoundException(`ProcessDefinition not found: ${id}`);
        return def;
    }

    async update(id: string, dto: UpdateProcessDefinitionDto) {
        await this.findOne(id);
        return this.prisma.processDefinition.update({
            where: { id },
            data: dto,
            include: { product: true },
        });
    }

    async approve(id: string, userId: string) {
        const def = await this.findOne(id);
        if (def.status !== 'DRAFT') {
            throw new BadRequestException('Only DRAFT definitions can be approved');
        }
        return this.prisma.processDefinition.update({
            where: { id },
            data: {
                status: ProcessDefinitionStatus.APPROVED,
                approvedBy: userId,
                approvedAt: new Date(),
            },
        });
    }

    async createNewVersion(id: string) {
        const source = await this.findOne(id);

        const maxVersion = await this.prisma.processDefinition.aggregate({
            where: { productId: source.productId, code: { startsWith: source.code.split('-v')[0] } },
            _max: { version: true },
        });
        const newVersion = (maxVersion._max.version ?? source.version) + 1;
        const baseCode = source.code.split('-v')[0];

        return this.prisma.$transaction(async (tx) => {
            const newDef = await tx.processDefinition.create({
                data: {
                    code: `${baseCode}-v${newVersion}`,
                    name: source.name,
                    productId: source.productId,
                    version: newVersion,
                    status: ProcessDefinitionStatus.DRAFT,
                    notes: source.notes,
                },
            });

            for (const step of source.steps) {
                const newStep = await tx.processStep.create({
                    data: {
                        processDefinitionId: newDef.id,
                        sequence: step.sequence,
                        name: step.name,
                        description: step.description,
                        requiredCapability: step.requiredCapability,
                        targetWorkCenterId: step.targetWorkCenterId,
                        setupTimeMinutes: step.setupTimeMinutes,
                        runTimeSecondsPerUnit: step.runTimeSecondsPerUnit,
                        qualityCheckRequired: step.qualityCheckRequired,
                    },
                });

                if (step.instructions.length > 0) {
                    await tx.instruction.createMany({
                        data: step.instructions.map((instr) => ({
                            stepId: newStep.id,
                            sequence: instr.sequence,
                            text: instr.text,
                            type: instr.type,
                            mandatory: instr.mandatory,
                        })),
                    });
                }
            }

            return this.findOne(newDef.id);
        });
    }
}
