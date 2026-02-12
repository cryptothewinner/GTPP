import { Logger } from '@nestjs/common';
import type { IErpAdapter } from '../ports/erp-adapter.port';
import type {
    NetsisStockItem,
    NetsisOrderPayload,
    NetsisOrderResult,
    NetsisSyncResult,
} from '@sepenatural/shared';

/**
 * NetsisBridgeAdapter — Production ERP Adapter
 *
 * Communicates with the .NET 8 Bridge service (apps/integration)
 * via HTTP. The Bridge service handles the actual Netsis DLL
 * communication via NetOpenX.
 *
 * IMPORTANT: This adapter does NOT call Netsis directly.
 * It calls our .NET middleware, which handles:
 * - COM/DLL interop with Netsis components
 * - Connection pooling to the Netsis database
 * - Response translation to our API contracts
 */
export class NetsisBridgeAdapter implements IErpAdapter {
    private readonly logger = new Logger(NetsisBridgeAdapter.name);
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor(bridgeUrl: string, apiKey: string) {
        this.baseUrl = bridgeUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.logger.log(`Netsis Bridge configured: ${this.baseUrl}`);
    }

    async getStock(sku: string): Promise<NetsisStockItem | null> {
        return this.request<NetsisStockItem | null>(
            'GET',
            `/api/netsis/stock/${encodeURIComponent(sku)}`,
        );
    }

    async getStockBatch(skus: string[]): Promise<NetsisStockItem[]> {
        return this.request<NetsisStockItem[]>('POST', '/api/netsis/stock/batch', {
            skus,
        });
    }

    async createOrder(orderData: NetsisOrderPayload): Promise<NetsisOrderResult> {
        return this.request<NetsisOrderResult>(
            'POST',
            '/api/netsis/orders',
            orderData,
        );
    }

    async syncToNetsis(
        entityType: string,
        records: Array<Record<string, unknown>>,
    ): Promise<NetsisSyncResult> {
        return this.request<NetsisSyncResult>('POST', '/api/netsis/sync/push', {
            entityType,
            records,
        });
    }

    async syncFromNetsis(
        entityType: string,
        filters?: Record<string, unknown>,
    ): Promise<NetsisSyncResult> {
        return this.request<NetsisSyncResult>('POST', '/api/netsis/sync/pull', {
            entityType,
            filters,
        });
    }

    async checkHealth(): Promise<{
        connected: boolean;
        latencyMs: number;
        version?: string;
    }> {
        const start = Date.now();
        try {
            const result = await this.request<{ version: string }>(
                'GET',
                '/api/netsis/health',
            );
            return {
                connected: true,
                latencyMs: Date.now() - start,
                version: result.version,
            };
        } catch {
            return {
                connected: false,
                latencyMs: Date.now() - start,
            };
        }
    }

    /**
     * Generic HTTP request method for the .NET Bridge.
     * Includes authentication, timeout, and error handling.
     */
    private async request<T>(
        method: string,
        path: string,
        body?: unknown,
    ): Promise<T> {
        const url = `${this.baseUrl}${path}`;

        this.logger.debug(`[BRIDGE] ${method} ${url}`);

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.apiKey,
                    'X-Source': 'sepe-api',
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(30_000), // 30 second timeout
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Bridge returned ${response.status}: ${errorText}`,
                );
            }

            return (await response.json()) as T;
        } catch (error) {
            this.logger.error(
                `[BRIDGE] Request failed: ${method} ${path} — ${(error as Error).message}`,
            );
            throw error;
        }
    }
}
