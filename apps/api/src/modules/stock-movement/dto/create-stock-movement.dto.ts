import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class CreateStockMovementDto {
    @IsEnum(StockMovementType)
    type: StockMovementType;

    @IsString()
    @IsOptional()
    materialId?: string;

    @IsString()
    @IsOptional()
    productId?: string;

    @IsString()
    @IsOptional()
    materialBatchId?: string;

    @IsNumber()
    @Min(0)
    quantity: number;

    @IsString()
    @IsOptional()
    unit?: string;

    @IsNumber()
    @IsOptional()
    unitPrice?: number;

    @IsString()
    @IsOptional()
    referenceType?: string;

    @IsString()
    @IsOptional()
    referenceId?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    performedBy?: string;
}
