import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { MovementType } from '@prisma/client';

export class CreateMaterialDocumentItemDto {
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
    @IsUUID()
    plantId: string;

    @IsOptional()
    @IsUUID()
    storageLocId?: string;

    @IsOptional()
    @IsString()
    batchNumber?: string;

    // For reference (PO Item, etc.)
    @IsOptional()
    @IsUUID()
    refItemId?: string;
}

export class CreateMaterialDocumentDto {
    @IsNotEmpty()
    @IsEnum(MovementType)
    movementType: MovementType;

    @IsOptional()
    @IsDateString()
    documentDate?: string;

    @IsOptional()
    @IsDateString()
    postingDate?: string;

    @IsOptional()
    @IsString()
    reference?: string;

    @IsOptional()
    @IsString()
    headerText?: string;

    @IsOptional()
    @IsUUID()
    purchaseOrderId?: string; // For 101

    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateMaterialDocumentItemDto)
    items: CreateMaterialDocumentItemDto[];
}
