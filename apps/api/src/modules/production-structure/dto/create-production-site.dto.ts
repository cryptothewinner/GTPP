import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProductionSiteDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    organizationId: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    licenseNumber?: string;
}
