using SepeNatural.NetsisBridge.Contracts;

namespace SepeNatural.NetsisBridge.Services;

/// <summary>
/// Interface for Netsis DLL/NetOpenX communication.
/// In production, this will use the actual Netsis COM components.
/// </summary>
public interface INetsisGateway
{
    Task<StockResponse?> GetStockAsync(string sku);
    Task<List<StockResponse>> GetStockBatchAsync(List<string> skus);
    Task<OrderResponse> CreateOrderAsync(OrderRequest request);
    Task<bool> TestConnectionAsync();
}
