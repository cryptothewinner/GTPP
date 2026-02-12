export interface NetsisStockItem {
    stokKodu?: string;
    sku?: string; // Alias for stokKodu
    stokAdi?: string;
    name?: string; // Alias for stokAdi
    bakiye?: number;
    currentStock?: number; // Alias for bakiye
    unit?: string; // For mock data compatibility
    warehouse?: string; // For mock data compatibility
    lastSyncAt?: string; // For mock data compatibility
    reservedStock?: number; // Alias for safety
    availableStock?: number; // Alias for safety
    fiyat?: number;
}

export interface NetsisOrderPayload {
    orderId: string;
    customerCode: string;
    orderType: string;
    lines: Array<{ sku: string; quantity: number }>;
    items?: Array<{ sku: string; quantity: number }>;
}

export interface NetsisOrderResult {
    success: boolean;
    netsisOrderNo?: string;
    netsisDocumentNo?: string;
    netsisRecordId?: number;
    error?: string;
    errors?: string[];
}

export interface NetsisSyncResult {
    syncedCount: number;
    failedCount?: number;
    entityType?: string;
    errors: string[];
    timestamp?: string;
}
