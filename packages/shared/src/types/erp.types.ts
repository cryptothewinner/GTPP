/**
 * Contracts for Netsis ERP integration.
 * These interfaces define the "port" between our system and Netsis,
 * regardless of whether the adapter is a mock or the real .NET bridge.
 */

export interface NetsisStockItem {
    sku: string;
    name: string;
    currentStock: number;
    reservedStock: number;
    availableStock: number;
    unit: string;
    warehouse: string;
    lastSyncAt: string;
}

export interface NetsisOrderLine {
    sku: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    discountRate?: number;
    warehouseCode: string;
}

export interface NetsisOrderPayload {
    orderType: 'purchase' | 'sales' | 'production';
    documentNumber?: string;
    counterpartyCode: string;  // Cari Kodu
    warehouseCode: string;
    lines: NetsisOrderLine[];
    description?: string;
    currency: 'TRY' | 'USD' | 'EUR';
}

export interface NetsisOrderResult {
    success: boolean;
    netsisDocumentNo: string;
    netsisRecordId: number;
    errors?: string[];
}

export interface NetsisSyncResult {
    entityType: string;
    syncedCount: number;
    failedCount: number;
    errors: Array<{ record: string; error: string }>;
    timestamp: string;
}
