namespace SepeNatural.Integration.Contracts;

public record StockQueryRequest
{
    public int Page { get; init; } = 1;
    public int Limit { get; init; } = 100;
    public string? FilterText { get; init; }
    public string? SortField { get; init; }
    public string? SortDirection { get; init; } = "asc";
    public string? WarehouseCode { get; init; }
    public bool? IsActive { get; init; }
}

public record StockItemDto
{
    public string Sku { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string Barcode { get; init; } = string.Empty;
    public string GroupCode { get; init; } = string.Empty;
    public string UnitOfMeasure { get; init; } = string.Empty;
    public decimal StockAmount { get; init; }
    public decimal CriticalLevel { get; init; }
    public decimal PurchasePrice { get; init; }
    public decimal SalePrice { get; init; }
    public string WarehouseCode { get; init; } = string.Empty;
    public string ShelfCode { get; init; } = string.Empty;
    public bool IsActive { get; init; } = true;
    public DateTime LastUpdated { get; init; }
    public string Currency { get; init; } = "TRY";
}

public record StockPagedResponse
{
    public IReadOnlyList<StockItemDto> Items { get; init; } = Array.Empty<StockItemDto>();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int Limit { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / Limit);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
