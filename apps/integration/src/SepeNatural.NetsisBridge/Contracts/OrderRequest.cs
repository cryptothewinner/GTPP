namespace SepeNatural.NetsisBridge.Contracts;

public record OrderRequest(
    string OrderType,
    string? DocumentNumber,
    string CounterpartyCode,
    string WarehouseCode,
    List<OrderLineRequest> Lines,
    string? Description,
    string Currency
);

public record OrderLineRequest(
    string Sku,
    decimal Quantity,
    decimal UnitPrice,
    decimal VatRate,
    decimal? DiscountRate,
    string WarehouseCode
);

public record OrderResponse(
    bool Success,
    string NetsisDocumentNo,
    int NetsisRecordId,
    List<string>? Errors
);
