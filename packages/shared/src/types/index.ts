export * from './grid';
export * from './metadata';
export * from './inventory';
export * from './production';
export * from './dashboard';

import type { LegacyDbUserRole } from '../enums/user-role.enum';

export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    error?: any;
    timestamp: string;
}

export interface PaginatedResponse<T = any> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface ApiError {
    success: false;
    message: string;
    statusCode: number;
    errors?: Record<string, string[]>;
    timestamp: string;
}

export interface AuthenticatedUser {
    id: string;
    email: string;
    fullName: string;
    role: LegacyDbUserRole;
}

// Netsis / ERP Integration Types
export interface NetsisStockItem {
    STOK_KODU?: string; // Optional for compatibility
    STOK_ADI?: string;  // Optional for compatibility
    BARKOD?: string;
    GRUP_KODU?: string;
    OLCU_BR1?: string;  // Optional for compatibility
    SATIS_FIAT1?: number; // Optional for compatibility
    DOVIZ_TIPI?: string;
    KDV_ORANI?: number; // Optional for compatibility
    sku?: string;
    name?: string;
    currentStock?: number;
    reservedStock?: number;
    availableStock?: number;
    unit?: string;
    warehouse?: string;
    lastSyncAt?: string;
}

export interface NetsisOrderPayload {
    orderId: string;
    items: Array<{ sku: string; quantity: number; price: number }>;
    orderType?: string;
    lines?: any[];
}

export interface NetsisOrderResult {
    success: boolean;
    netsisOrderNumber?: string;
    message?: string;
    netsisDocumentNo?: string;
    netsisRecordId?: number;
    errors?: string[];
}

export interface NetsisSyncResult {
    syncedCount: number;
    failedCount: number;
    errors?: string[];
    entityType?: string;
    timestamp?: string;
}
