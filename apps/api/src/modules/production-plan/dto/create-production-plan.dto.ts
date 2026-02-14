import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ProductionPlanStatus } from '@prisma/client';

export class CreateProductionPlanDto {
    @IsString()
    @MinLength(2)
    code: string;

    @IsString()
    @MinLength(2)
    name: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsEnum(ProductionPlanStatus)
    status?: ProductionPlanStatus;
}
