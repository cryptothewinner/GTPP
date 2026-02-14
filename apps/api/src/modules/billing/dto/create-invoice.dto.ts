import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceItemDto {
    @IsNotEmpty()
    @IsString()
    deliveryItemId: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    quantity: number;
}

export class CreateInvoiceDto {
    @IsNotEmpty()
    @IsString()
    deliveryId: string;

    @IsOptional()
    @IsString()
    invoiceDate?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateInvoiceItemDto)
    items: CreateInvoiceItemDto[];
}
