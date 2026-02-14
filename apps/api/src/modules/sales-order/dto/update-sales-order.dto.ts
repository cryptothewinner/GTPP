import { IsString, IsOptional, IsDateString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSalesOrderItemDto } from './create-sales-order.dto';

export enum SalesOrderStatusDto {
    DRAFT = 'DRAFT',
    CONFIRMED = 'CONFIRMED',
    DELIVERED = 'DELIVERED',
    BILLED = 'BILLED',
}

export class UpdateSalesOrderDto {
    @IsOptional()
    @IsString()
    customerId?: string;

    @IsOptional()
    @IsString()
    salesOrgId?: string;

    @IsOptional()
    @IsString()
    customerRef?: string;

    @IsOptional()
    @IsDateString()
    requestedDeliveryDate?: string;

    @IsOptional()
    @IsEnum(SalesOrderStatusDto)
    status?: SalesOrderStatusDto;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSalesOrderItemDto)
    items?: CreateSalesOrderItemDto[];
}
