import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { MaterialType } from '@prisma/client';

export class CreateMaterialDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    code?: string;

    @IsEnum(MaterialType)
    type: MaterialType;

    @IsString()
    @IsOptional()
    unitOfMeasure?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    unitPrice?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    minStockLevel?: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
