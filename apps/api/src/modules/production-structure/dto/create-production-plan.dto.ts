import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ProductionPlanStatus } from '@prisma/client';

export class CreateProductionPlanDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsDateString()
    startDate: string;

    @IsNotEmpty()
    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsEnum(ProductionPlanStatus)
    status?: ProductionPlanStatus;

    @IsOptional()
    @IsString()
    notes?: string;
}
