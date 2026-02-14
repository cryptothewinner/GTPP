import { IsString, IsOptional, IsNumber, IsInt, Min, MaxLength } from 'class-validator';

export class CreateProductionOrderDto {
    @IsString()
    productId: string;

    @IsString()
    recipeId: string;

    @IsNumber()
    @Min(0)
    plannedQuantity: number;

    @IsOptional()
    @IsString()
    unit?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    priority?: number;

    @IsOptional()
    @IsString()
    plannedStart?: string;

    @IsOptional()
    @IsString()
    plannedEnd?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    assignedTo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;

    @IsOptional()
    @IsString()
    productionPlanId?: string;

    @IsOptional()
    @IsString()
    routingId?: string;
}
