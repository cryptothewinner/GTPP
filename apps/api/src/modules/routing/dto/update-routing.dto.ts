import { IsOptional, IsBoolean, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRoutingStepDto } from './create-routing.dto';

export class UpdateRoutingDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    version?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateRoutingStepDto)
    steps?: CreateRoutingStepDto[];
}
