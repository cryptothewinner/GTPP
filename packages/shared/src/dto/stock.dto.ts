export interface StockItemDto {
    sku: string;
    productName: string;
    barcode: string;
    groupCode: string;
    unitOfMeasure: string;
    stockAmount: number;
    criticalLevel: number;
    purchasePrice: number;
    salePrice: number;
    warehouseCode: string;
    shelfCode: string;
    isActive: boolean;
    lastUpdated: string;
    currency: string;
}

export interface StockPagedResponse {
    items: StockItemDto[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface StockQueryRequest {
    page?: number;
    limit?: number;
    filter?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    warehouseCode?: string;
    isActive?: boolean;
}
