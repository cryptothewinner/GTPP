import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsEnum, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { MaterialBatchStatus } from '@prisma/client';

export class CreateMaterialBatchDto {
    @IsString()
    @IsNotEmpty()
    materialId: string;

    @IsString()
    @IsNotEmpty()
    batchNumber: string;

    @IsString()
    @IsOptional()
    supplierLotNo?: string;

    @IsNumber()
    @Min(0)
    quantity: number;

    @IsDateString()
    @IsOptional()
    manufacturingDate?: string;

    @IsDateString()
    @IsOptional()
    expiryDate?: string;

    @IsString()
    @IsOptional()
    storageLocation?: string;

    @IsEnum(MaterialBatchStatus)
    @IsOptional()
    status?: MaterialBatchStatus;
}
