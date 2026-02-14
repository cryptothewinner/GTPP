import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, IsEnum, Min } from 'class-validator';
import { ProcessDefinitionStatus, InstructionType } from '@prisma/client';

export class CreateProcessDefinitionDto {
    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    productId: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateProcessDefinitionDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsEnum(ProcessDefinitionStatus)
    status?: ProcessDefinitionStatus;
}

export class CreateProcessStepDto {
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    sequence: number;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    requiredCapability?: string;

    @IsOptional()
    @IsString()
    targetWorkCenterId?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    setupTimeMinutes?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    runTimeSecondsPerUnit?: number;

    @IsOptional()
    @IsBoolean()
    qualityCheckRequired?: boolean;
}

export class UpdateProcessStepDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    sequence?: number;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    requiredCapability?: string;

    @IsOptional()
    @IsString()
    targetWorkCenterId?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    setupTimeMinutes?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    runTimeSecondsPerUnit?: number;

    @IsOptional()
    @IsBoolean()
    qualityCheckRequired?: boolean;
}

export class CreateInstructionDto {
    @IsNotEmpty()
    @IsString()
    text: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    sequence?: number;

    @IsOptional()
    @IsEnum(InstructionType)
    type?: InstructionType;

    @IsOptional()
    @IsBoolean()
    mandatory?: boolean;
}

export class UpdateInstructionDto {
    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    sequence?: number;

    @IsOptional()
    @IsEnum(InstructionType)
    type?: InstructionType;

    @IsOptional()
    @IsBoolean()
    mandatory?: boolean;
}

export class ReorderStepsDto {
    @IsNotEmpty()
    stepIds: string[];
}
