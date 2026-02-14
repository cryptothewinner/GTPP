import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { CapacityType } from '@prisma/client';

export class CreateWorkCenterDto {
    @IsNotEmpty()
    @IsString()
    plantId: string;

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    plantStepId?: string;

    @IsOptional()
    @IsString()
    costCenterId?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    efficiency?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    hourlyCost?: number;

    @IsOptional()
    @IsEnum(CapacityType)
    capacityType?: CapacityType;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateWorkCenterDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    plantStepId?: string;

    @IsOptional()
    @IsString()
    costCenterId?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    efficiency?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    hourlyCost?: number;

    @IsOptional()
    @IsEnum(CapacityType)
    capacityType?: CapacityType;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
