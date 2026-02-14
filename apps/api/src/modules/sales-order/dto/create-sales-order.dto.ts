import { IsString, IsNotEmpty, IsOptional, IsDateString, IsArray, ValidateNested, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalesOrderItemDto {
    @IsNotEmpty()
    @IsString()
    materialId: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    quantity: number;

    @IsNotEmpty()
    @IsString()
    unit: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    unitPrice: number; // Birim Fiyat

    @IsOptional()
    @IsString()
    plantId?: string;
}

export class CreateSalesOrderDto {
    @IsNotEmpty()
    @IsString()
    customerId: string; // BusinessPartner ID

    @IsNotEmpty()
    @IsString()
    salesOrgId: string;

    @IsOptional()
    @IsString()
    distChannelId?: string;

    @IsOptional()
    @IsString()
    divisionId?: string;

    @IsOptional()
    @IsString()
    customerRef?: string; // Müşteri Sipariş No

    @IsOptional()
    @IsDateString()
    requestedDeliveryDate?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSalesOrderItemDto)
    items: CreateSalesOrderItemDto[];

    @IsOptional()
    @IsString()
    currency?: string;
}
