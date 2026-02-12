namespace SepeNatural.Integration.Providers;

using SepeNatural.Integration.Contracts;

/// <summary>
/// PLACEHOLDER: Real Netsis implementation.
/// When the NetOpenX DLL is available, this class will:
/// 1. Load the DLL via reflection or direct reference
/// 2. Authenticate with Netsis credentials
/// 3. Call STOK_LISTESI and map to our DTOs
///
/// Registration: Replace MockStockProvider with this in DI.
/// </summary>
public class NetsisStockProvider : IStockProvider
{
    public Task<StockPagedResponse> GetStocksAsync(StockQueryRequest request, CancellationToken ct = default)
    {
        throw new NotImplementedException(
            "NetsisStockProvider requires the NetOpenX DLL. " +
            "Set 'StockProvider:UseReal=true' and provide DLL path in configuration.");
    }

    public Task<StockItemDto?> GetStockBySkuAsync(string sku, CancellationToken ct = default)
    {
        throw new NotImplementedException("Real Netsis provider not yet configured.");
    }
}
