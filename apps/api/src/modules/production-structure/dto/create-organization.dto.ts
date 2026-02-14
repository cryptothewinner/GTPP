import { IsString, IsOptional } from 'class-validator';

export class CreateOrganizationDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    taxNumber?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    logo?: string;
}
