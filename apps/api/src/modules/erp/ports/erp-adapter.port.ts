import type {
    NetsisStockItem,
    NetsisOrderPayload,
    NetsisOrderResult,
    NetsisSyncResult,
} from '@sepenatural/shared';

/**
 * IErpAdapter — The Port (Interface) for ERP Communication
 *
 * This is the contract that all ERP adapters must implement.
 * It follows the Ports & Adapters (Hexagonal) architecture pattern.
 *
 * The business logic (ErpService) depends only on this interface,
 * never on a concrete implementation. This allows us to:
 *
 * 1. Mock the ERP during development/testing
 * 2. Swap to the .NET Bridge for production
 * 3. Potentially support other ERPs in the future
 */
export interface IErpAdapter {
    /**
     * Retrieves current stock information for a given SKU.
     * Maps to Netsis: TBLSTSABIT + TBLSTOKHAR aggregation
     */
    getStock(sku: string): Promise<NetsisStockItem | null>;

    /**
     * Retrieves stock for multiple SKUs in a single call.
     * Optimized for batch operations (e.g., production order material check).
     */
    getStockBatch(skus: string[]): Promise<NetsisStockItem[]>;

    /**
     * Creates an order (purchase/sales/production) in Netsis.
     * Maps to Netsis NetOpenX: SetFatura / SetIrsaliye / SetSiparisVer
     */
    createOrder(orderData: NetsisOrderPayload): Promise<NetsisOrderResult>;

    /**
     * Syncs entity data from our system to Netsis.
     * Used for bulk synchronization operations.
     */
    syncToNetsis(
        entityType: string,
        records: Array<Record<string, unknown>>,
    ): Promise<NetsisSyncResult>;

    /**
     * Syncs entity data from Netsis to our system.
     * Used for importing master data (products, materials, etc.).
     */
    syncFromNetsis(
        entityType: string,
        filters?: Record<string, unknown>,
    ): Promise<NetsisSyncResult>;

    /**
     * Health check for the ERP connection.
     */
    checkHealth(): Promise<{
        connected: boolean;
        latencyMs: number;
        version?: string;
    }>;
}

/**
 * Injection token for the ERP Adapter.
 * Usage: @Inject(ERP_ADAPTER_PORT) private readonly erp: IErpAdapter
 */
export const ERP_ADAPTER_PORT = Symbol('ERP_ADAPTER_PORT');
