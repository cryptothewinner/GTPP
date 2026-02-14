import { IsString, IsOptional, IsDateString, IsArray, ValidateNested, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSalesQuotationItemDto } from './create-sales-quotation.dto';

export enum SalesQuotationStatusDto {
    DRAFT = 'DRAFT',
    SENT = 'SENT',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED',
    CONVERTED = 'CONVERTED',
}

export class UpdateSalesQuotationDto {
    @IsOptional()
    @IsString()
    customerId?: string;

    @IsOptional()
    @IsString()
    salesOrgId?: string;

    @IsOptional()
    @IsDateString()
    validFrom?: string;

    @IsOptional()
    @IsDateString()
    validTo?: string;

    @IsOptional()
    @IsEnum(SalesQuotationStatusDto)
    status?: SalesQuotationStatusDto;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSalesQuotationItemDto)
    items?: CreateSalesQuotationItemDto[];
}
