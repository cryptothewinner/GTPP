import { IsString, IsNotEmpty, IsOptional, IsDateString, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalesQuotationItemDto {
    @IsNotEmpty()
    @IsString()
    materialId: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    quantity: number;

    @IsOptional()
    @IsString()
    unit?: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    unitPrice: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateSalesQuotationDto {
    @IsNotEmpty()
    @IsString()
    customerId: string;

    @IsOptional()
    @IsString()
    salesOrgId?: string;

    @IsNotEmpty()
    @IsDateString()
    validFrom: string;

    @IsNotEmpty()
    @IsDateString()
    validTo: string;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSalesQuotationItemDto)
    items: CreateSalesQuotationItemDto[];
}
