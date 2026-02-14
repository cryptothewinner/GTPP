import { IsOptional, IsString, IsInt, IsBoolean, IsArray, ValidateNested, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoutingStepDto {
    @IsInt()
    @Min(1)
    stepNumber: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    standardTime?: number; // Minutes

    @IsOptional()
    @IsInt()
    @Min(0)
    setupTime?: number; // Minutes
}

export class CreateRoutingDto {
    @IsString()
    productId: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    version?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateRoutingStepDto)
    steps: CreateRoutingStepDto[];
}
