import { IsString, IsNotEmpty, IsOptional, IsDateString, IsArray, ValidateNested, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum PostingType {
    DEBIT = 'DEBIT',
    CREDIT = 'CREDIT'
}

export class CreateJournalEntryItemDto {
    @IsNotEmpty()
    @IsString()
    glAccountId: string;

    @IsNotEmpty()
    @IsEnum(PostingType)
    postingType: PostingType; // DEBIT or CREDIT

    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsOptional()
    @IsString()
    costCenterId?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateJournalEntryDto {
    @IsNotEmpty()
    @IsString()
    headerText: string;

    @IsNotEmpty()
    @IsString()
    reference: string;

    @IsOptional()
    @IsDateString()
    postingDate?: string;

    @IsNotEmpty()
    @IsString()
    currency: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateJournalEntryItemDto)
    items: CreateJournalEntryItemDto[];
}
