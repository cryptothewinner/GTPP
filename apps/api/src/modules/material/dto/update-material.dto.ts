import { IsString, IsOptional, IsBoolean, IsNumber, Min, MaxLength, IsInt } from 'class-validator';

export class UpdateMaterialDto {
    @IsOptional()
    @IsString()
    @MaxLength(200)
    name?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    unitOfMeasure?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    unitPrice?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    currentStock?: number;

    @IsNumber()
    @Min(0)
    minStockLevel?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    maxStockLevel?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    safetyStock?: number;

    @IsOptional()
    @IsBoolean()
    qualityControl?: boolean;

    @IsOptional()
    @IsBoolean()
    autoBatch?: boolean;

    @IsOptional()
    @IsBoolean()
    orderApproval?: boolean;

    @IsOptional()
    @IsBoolean()
    allowNegativeStock?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    moq?: number;

    @IsOptional()
    @IsString()
    supplierId?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    casNumber?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    shelfLife?: number;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    storageCondition?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}
