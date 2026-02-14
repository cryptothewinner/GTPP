import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateEquipmentCapabilityDto {
    @IsNotEmpty()
    @IsString()
    processType: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minCapacity?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    maxCapacity?: number;

    @IsOptional()
    @IsString()
    unit?: string;

    @IsOptional()
    parameters?: any;
}
