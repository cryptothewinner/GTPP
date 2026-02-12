using SepeNatural.NetsisBridge.Contracts;

namespace SepeNatural.NetsisBridge.Services;

/// <summary>
/// Placeholder Netsis Gateway implementation.
/// TODO: Replace with actual NetOpenX DLL integration.
///
/// In production, this class will:
/// 1. Load Netsis DLLs via COM Interop
/// 2. Manage connection pooling to Netsis DB
/// 3. Map between our contracts and Netsis data structures
/// </summary>
public class NetsisGateway : INetsisGateway
{
    private readonly ILogger<NetsisGateway> _logger;

    public NetsisGateway(ILogger<NetsisGateway> logger)
    {
        _logger = logger;
    }

    public Task<StockResponse?> GetStockAsync(string sku)
    {
        _logger.LogInformation("[PLACEHOLDER] GetStock: {Sku}", sku);

        // TODO: Replace with actual Netsis query
        // var netsis = new NetOpenX();
        // netsis.BaglantiAc(connectionString);
        // var result = netsis.StokBilgiGetir(sku);

        return Task.FromResult<StockResponse?>(null);
    }

    public Task<List<StockResponse>> GetStockBatchAsync(List<string> skus)
    {
        _logger.LogInformation("[PLACEHOLDER] GetStockBatch: {Count} SKUs", skus.Count);
        return Task.FromResult(new List<StockResponse>());
    }

    public Task<OrderResponse> CreateOrderAsync(OrderRequest request)
    {
        _logger.LogInformation("[PLACEHOLDER] CreateOrder: {Type}", request.OrderType);

        return Task.FromResult(new OrderResponse(
            Success: false,
            NetsisDocumentNo: "",
            NetsisRecordId: 0,
            Errors: new List<string> { "Netsis integration not yet implemented" }
        ));
    }

    public Task<bool> TestConnectionAsync()
    {
        _logger.LogInformation("[PLACEHOLDER] TestConnection");
        return Task.FromResult(false);
    }
}
