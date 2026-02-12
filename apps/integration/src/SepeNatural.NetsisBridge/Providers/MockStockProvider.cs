namespace SepeNatural.Integration.Providers;

using SepeNatural.Integration.Contracts;
using Microsoft.Extensions.Logging;
using System.Linq;

public class MockStockProvider : IStockProvider
{
    private readonly ILogger<MockStockProvider> _logger;

    public MockStockProvider(ILogger<MockStockProvider> logger)
    {
        _logger = logger;
    }

    public Task<StockPagedResponse> GetStocksAsync(StockQueryRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "MockStockProvider.GetStocks called: Page={Page}, Limit={Limit}, Filter={Filter}, Sort={Sort}/{Dir}",
            request.Page, request.Limit, request.FilterText, request.SortField, request.SortDirection);

        var allItems = MockStockDataGenerator.GenerateAll();
        IEnumerable<StockItemDto> query = allItems;

        // Apply filtering
        if (!string.IsNullOrWhiteSpace(request.FilterText))
        {
            var filterLower = request.FilterText.ToLowerInvariant();
            query = query.Where(x =>
                x.Sku.ToLowerInvariant().Contains(filterLower) ||
                x.ProductName.ToLowerInvariant().Contains(filterLower) ||
                x.Barcode.Contains(filterLower) ||
                x.ShelfCode.ToLowerInvariant().Contains(filterLower) ||
                x.GroupCode.ToLowerInvariant().Contains(filterLower));
        }

        if (!string.IsNullOrWhiteSpace(request.WarehouseCode))
        {
            query = query.Where(x => x.WarehouseCode == request.WarehouseCode);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == request.IsActive.Value);
        }

        // Apply sorting
        if (!string.IsNullOrWhiteSpace(request.SortField))
        {
            var isDesc = request.SortDirection?.ToLowerInvariant() == "desc";
            query = request.SortField.ToLowerInvariant() switch
            {
                "sku" => isDesc ? query.OrderByDescending(x => x.Sku) : query.OrderBy(x => x.Sku),
                "productname" => isDesc ? query.OrderByDescending(x => x.ProductName) : query.OrderBy(x => x.ProductName),
                "stockamount" => isDesc ? query.OrderByDescending(x => x.StockAmount) : query.OrderBy(x => x.StockAmount),
                "saleprice" => isDesc ? query.OrderByDescending(x => x.SalePrice) : query.OrderBy(x => x.SalePrice),
                "purchaseprice" => isDesc ? query.OrderByDescending(x => x.PurchasePrice) : query.OrderBy(x => x.PurchasePrice),
                "criticallevel" => isDesc ? query.OrderByDescending(x => x.CriticalLevel) : query.OrderBy(x => x.CriticalLevel),
                "lastupdated" => isDesc ? query.OrderByDescending(x => x.LastUpdated) : query.OrderBy(x => x.LastUpdated),
                "shelfcode" => isDesc ? query.OrderByDescending(x => x.ShelfCode) : query.OrderBy(x => x.ShelfCode),
                "isactive" => isDesc ? query.OrderByDescending(x => x.IsActive) : query.OrderBy(x => x.IsActive),
                _ => query.OrderBy(x => x.Sku)
            };
        }
        else
        {
            query = query.OrderBy(x => x.Sku);
        }

        var filtered = query.ToList();
        var totalCount = filtered.Count;
        var page = Math.Max(1, request.Page);
        var limit = Math.Clamp(request.Limit, 1, 500);
        var items = filtered.Skip((page - 1) * limit).Take(limit).ToList();

        var response = new StockPagedResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            Limit = limit
        };

        _logger.LogInformation("Returning {Count}/{Total} items", items.Count, totalCount);
        return Task.FromResult(response);
    }

    public Task<StockItemDto?> GetStockBySkuAsync(string sku, CancellationToken ct = default)
    {
        var allItems = MockStockDataGenerator.GenerateAll();
        var item = allItems.FirstOrDefault(x => x.Sku.Equals(sku, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(item);
    }
}
