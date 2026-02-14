
import { IsEnum, IsString, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';
import { ActivityType, ActivityStatus } from '@prisma/client';

export class CreateActivityDto {
    @IsEnum(ActivityType)
    @IsNotEmpty()
    type: ActivityType;

    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(ActivityStatus)
    @IsOptional()
    status?: ActivityStatus;

    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @IsDateString()
    @IsOptional()
    performedAt?: string;

    // Optional: if we want to assign to a specific user other than the caller
    // @IsString()
    // @IsOptional()
    // assignedTo?: string;
}
