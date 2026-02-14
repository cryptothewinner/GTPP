import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BPCategory, BPRole, AddressType } from '@prisma/client';

export class CreateBPAddressDto {
    @IsEnum(AddressType)
    @IsOptional()
    type?: AddressType;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @IsString()
    @IsOptional()
    country?: string;

    @IsString()
    city: string;

    @IsString()
    @IsOptional()
    district?: string;

    @IsString()
    addressLine1: string;

    @IsString()
    @IsOptional()
    addressLine2?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    email?: string;
}

export class CreateSupplierDetailsDto {
    @IsNumber()
    @IsOptional()
    @Min(0)
    leadTimeDays?: number;

    @IsString()
    @IsOptional()
    paymentTerm?: string;

    @IsString()
    @IsOptional()
    currency?: string;
}

export class CreateBusinessPartnerDto {
    @IsString()
    bpNumber: string;

    @IsEnum(BPCategory)
    @IsOptional()
    category?: BPCategory;

    @IsString()
    name1: string;

    @IsString()
    @IsOptional()
    name2?: string;

    @IsString()
    @IsOptional()
    searchTerm1?: string;

    @IsString()
    @IsOptional()
    taxOffice?: string;

    @IsString()
    @IsOptional()
    taxNumber?: string;

    @IsArray()
    @IsEnum(BPRole, { each: true })
    roles: BPRole[];

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateBPAddressDto)
    @IsOptional()
    addresses?: CreateBPAddressDto[];

    @ValidateNested()
    @Type(() => CreateSupplierDetailsDto)
    @IsOptional()
    supplierDetails?: CreateSupplierDetailsDto;
}
