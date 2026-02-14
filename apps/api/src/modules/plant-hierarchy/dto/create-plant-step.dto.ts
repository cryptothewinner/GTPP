import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { PlantStepType } from '@prisma/client';

export class CreatePlantStepDto {
    @IsNotEmpty()
    @IsString()
    plantId: string;

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsEnum(PlantStepType)
    type: PlantStepType;

    @IsOptional()
    @IsString()
    parentId?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    environmentSpecs?: any;
}

export class UpdatePlantStepDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    environmentSpecs?: any;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
