import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ConfirmOperationDto {
    @IsNumber()
    @Min(0)
    producedQuantity: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    wasteQuantity?: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    activityDurationMinutes?: number;
}
