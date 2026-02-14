import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString, ValidateNested, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { POStatus } from '@prisma/client';

export class CreatePurchaseOrderItemDto {
    @IsNotEmpty()
    @IsUUID()
    materialId: string;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsNotEmpty()
    @IsString()
    unit: string;

    @IsNotEmpty()
    @IsNumber()
    netPrice: number;

    @IsOptional()
    @IsNumber()
    taxRate?: number;

    @IsNotEmpty()
    @IsUUID()
    plantId: string;

    @IsOptional()
    @IsUUID()
    storageLocId?: string;

    @IsOptional()
    @IsDateString()
    deliveryDate?: string;
}

export class CreatePurchaseOrderDto {
    @IsNotEmpty()
    @IsUUID()
    supplierId: string;

    @IsNotEmpty()
    @IsUUID()
    companyCodeId: string;

    @IsNotEmpty()
    @IsUUID()
    purchOrgId: string;

    @IsOptional()
    @IsUUID()
    purchGroupId?: string;

    @IsOptional()
    @IsDateString()
    documentDate?: string;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    paymentTerm?: string;

    @IsOptional()
    @IsString()
    incoterms?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreatePurchaseOrderItemDto)
    items: CreatePurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto {
    @IsOptional()
    @IsEnum(POStatus)
    status?: POStatus;

    @IsOptional()
    @IsString()
    notes?: string;

    // Add other updatable fields as needed
}

export class CreatePurchaseOrderFromRequisitionDto {
    @IsNotEmpty()
    @IsUUID()
    supplierId: string;

    @IsNotEmpty()
    @IsUUID()
    companyCodeId: string;

    @IsNotEmpty()
    @IsUUID()
    purchOrgId: string;

    @IsOptional()
    @IsUUID()
    purchGroupId?: string;

    @IsNotEmpty()
    @IsUUID()
    plantId: string;

    @IsOptional()
    @IsUUID()
    storageLocId?: string;

    @IsOptional()
    @IsDateString()
    documentDate?: string;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
