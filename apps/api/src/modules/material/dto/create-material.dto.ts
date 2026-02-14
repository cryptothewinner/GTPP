import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, IsBoolean } from 'class-validator';
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

    @IsNumber()
    @Min(0)
    @IsOptional()
    maxStockLevel?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    safetyStock?: number;

    @IsBoolean()
    @IsOptional()
    qualityControl?: boolean;

    @IsBoolean()
    @IsOptional()
    autoBatch?: boolean;

    @IsBoolean()
    @IsOptional()
    orderApproval?: boolean;

    @IsBoolean()
    @IsOptional()
    allowNegativeStock?: boolean;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    supplierId?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    casNumber?: string;

    @IsNumber()
    @IsOptional()
    shelfLife?: number;

    @IsString()
    @IsOptional()
    storageCondition?: string;
}
