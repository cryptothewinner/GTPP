namespace SepeNatural.Integration.Contracts;

/// <summary>
/// Abstraction layer for stock data retrieval.
/// Current: Mock implementation
/// Future: Real NetOpenX DLL injection
/// </summary>
public interface IStockProvider
{
    Task<StockPagedResponse> GetStocksAsync(StockQueryRequest request, CancellationToken ct = default);
    Task<StockItemDto?> GetStockBySkuAsync(string sku, CancellationToken ct = default);
}
