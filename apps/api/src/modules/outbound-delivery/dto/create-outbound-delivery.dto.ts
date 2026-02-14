import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOutboundDeliveryItemDto {
    @IsNotEmpty()
    @IsString()
    salesOrderItemId: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    quantity: number;

    @IsOptional()
    @IsString()
    batchNumber?: string;
}

export class CreateOutboundDeliveryDto {
    @IsNotEmpty()
    @IsString()
    salesOrderId: string;

    @IsOptional()
    @IsString()
    deliveryDate?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOutboundDeliveryItemDto)
    items: CreateOutboundDeliveryItemDto[];
}
