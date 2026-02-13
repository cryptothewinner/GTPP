import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class CreateProductionBatchConsumptionInput {
    @IsString()
    materialBatchId: string;

    @IsOptional()
    @IsString()
    recipeItemId?: string;

    @IsNumber()
    @Min(0)
    consumedQuantity: number;

    @IsOptional()
    @IsString()
    unit?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    materialStorageLocation?: string;

    @IsOptional()
    @IsString()
    timestamp?: string;
}

export class CreateProductionBatchDto {
    @IsString()
    productionOrderId: string;

    @IsNumber()
    @Min(0)
    quantity: number;

    @IsOptional()
    @IsString()
    unit?: string;

    @IsOptional()
    @IsString()
    manufacturingDate?: string;

    @IsOptional()
    @IsString()
    expiryDate?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    productionLocation?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProductionBatchConsumptionInput)
    consumptions?: CreateProductionBatchConsumptionInput[];
}
