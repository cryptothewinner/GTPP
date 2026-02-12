namespace SepeNatural.NetsisBridge.Contracts;

public record StockResponse(
    string Sku,
    string Name,
    decimal CurrentStock,
    decimal ReservedStock,
    decimal AvailableStock,
    string Unit,
    string Warehouse,
    DateTime LastSyncAt
);
