import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { WorkStationType, CleanroomGrade } from '@prisma/client';

export class CreateWorkStationDto {
    @IsNotEmpty()
    @IsString()
    siteId: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsOptional()
    @IsEnum(WorkStationType)
    type?: WorkStationType;

    @IsOptional()
    @IsEnum(CleanroomGrade)
    cleanroomGrade?: CleanroomGrade;

    @IsOptional()
    @IsNumber()
    @Min(0)
    dailyCapacity?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    hourlyRate?: number;
}
