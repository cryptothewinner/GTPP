import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { EquipmentStatus } from '@prisma/client';

export class CreateEquipmentDto {
    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    workCenterId: string;

    @IsOptional()
    @IsString()
    serialNumber?: string;

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsString()
    manufacturer?: string;

    @IsOptional()
    @IsEnum(EquipmentStatus)
    status?: EquipmentStatus;

    @IsOptional()
    @IsDateString()
    lastCalibration?: string;

    @IsOptional()
    @IsDateString()
    nextCalibration?: string;

    @IsOptional()
    @IsDateString()
    installDate?: string;

    @IsOptional()
    metadata?: any;
}

export class UpdateEquipmentDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    serialNumber?: string;

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsString()
    manufacturer?: string;

    @IsOptional()
    @IsDateString()
    lastCalibration?: string;

    @IsOptional()
    @IsDateString()
    nextCalibration?: string;

    @IsOptional()
    @IsDateString()
    installDate?: string;

    @IsOptional()
    metadata?: any;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
