import { IsOptional, IsNumber, IsString, IsArray, Min } from 'class-validator';

export class SortModelItem {
    @IsString()
    colId: string;

    @IsString()
    sort: 'asc' | 'desc';
}

export class GridRequestDto {
    @IsNumber()
    @Min(0)
    startRow: number;

    @IsNumber()
    @Min(1)
    endRow: number;

    @IsOptional()
    @IsArray()
    sortModel?: SortModelItem[];

    @IsOptional()
    filterModel?: Record<string, any>;

    @IsOptional()
    @IsString()
    searchText?: string;
}
