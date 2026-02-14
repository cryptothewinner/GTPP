import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PRStatus } from '@prisma/client';

export class CreatePurchaseRequisitionItemDto {
    @IsOptional()
    @IsUUID()
    materialId?: string;

    @IsNotEmpty()
    @IsString()
    materialName: string;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsNotEmpty()
    @IsString()
    unit: string;

    @IsOptional()
    @IsDateString()
    deliveryDate?: string;
}

export class CreatePurchaseRequisitionDto {
    @IsOptional()
    @IsString()
    requestedBy?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreatePurchaseRequisitionItemDto)
    items: CreatePurchaseRequisitionItemDto[];
}

export class UpdatePurchaseRequisitionDto {
    @IsOptional()
    @IsEnum(PRStatus)
    status?: PRStatus;

    @IsOptional()
    @IsString()
    notes?: string;
}
