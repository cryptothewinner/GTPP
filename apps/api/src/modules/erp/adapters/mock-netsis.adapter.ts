import { Logger } from '@nestjs/common';
import type { IErpAdapter } from '../ports/erp-adapter.port';
import type {
    NetsisStockItem,
    NetsisOrderPayload,
    NetsisOrderResult,
    NetsisSyncResult,
} from '@sepenatural/shared';

/**
 * MockNetsisAdapter — Development & Testing Mock
 *
 * Returns realistic fake data that mimics Netsis responses.
 * All data is based on SepeNatural's actual product catalog
 * (vitamins, minerals, supplements).
 *
 * This adapter adds artificial delays to simulate network latency
 * and occasional failures to test error handling.
 */
export class MockNetsisAdapter implements IErpAdapter {
    private readonly logger = new Logger(MockNetsisAdapter.name);

    /** Simulated stock data for SepeNatural products */
    private readonly mockStockData: Record<string, NetsisStockItem> = {
        'SPN-VIT-C-1000': {
            sku: 'SPN-VIT-C-1000',
            name: 'C Vitamini 1000mg 60 Tablet',
            currentStock: 15000,
            reservedStock: 2300,
            availableStock: 12700,
            unit: 'ADET',
            warehouse: 'MAMUL-01',
            lastSyncAt: new Date().toISOString(),
        },
        'SPN-VIT-D3-2000': {
            sku: 'SPN-VIT-D3-2000',
            name: 'D3 Vitamini 2000IU 90 Softjel',
            currentStock: 8500,
            reservedStock: 1200,
            availableStock: 7300,
            unit: 'ADET',
            warehouse: 'MAMUL-01',
            lastSyncAt: new Date().toISOString(),
        },
        'SPN-OMEGA3-1200': {
            sku: 'SPN-OMEGA3-1200',
            name: 'Omega 3 1200mg 60 Softjel',
            currentStock: 5200,
            reservedStock: 800,
            availableStock: 4400,
            unit: 'ADET',
            warehouse: 'MAMUL-01',
            lastSyncAt: new Date().toISOString(),
        },
        'HM-VIT-C-001': {
            sku: 'HM-VIT-C-001',
            name: 'Askorbik Asit (Vitamin C) Hammadde',
            currentStock: 450.5,
            reservedStock: 120.0,
            availableStock: 330.5,
            unit: 'KG',
            warehouse: 'HAMMADDE-01',
            lastSyncAt: new Date().toISOString(),
        },
        'HM-JELATIN-001': {
            sku: 'HM-JELATIN-001',
            name: 'Balık Jelatini (Softjel Kapsül)',
            currentStock: 200.0,
            reservedStock: 50.0,
            availableStock: 150.0,
            unit: 'KG',
            warehouse: 'HAMMADDE-01',
            lastSyncAt: new Date().toISOString(),
        },
    };

    private orderCounter = 1000;

    async getStock(sku: string): Promise<NetsisStockItem | null> {
        await this.simulateLatency(50, 200);

        this.logger.debug(`[MOCK] getStock: ${sku}`);

        return this.mockStockData[sku] || null;
    }

    async getStockBatch(skus: string[]): Promise<NetsisStockItem[]> {
        await this.simulateLatency(100, 500);

        this.logger.debug(`[MOCK] getStockBatch: ${skus.length} SKUs`);

        return skus
            .map((sku) => this.mockStockData[sku])
            .filter((item): item is NetsisStockItem => item !== undefined);
    }

    async createOrder(orderData: NetsisOrderPayload): Promise<NetsisOrderResult> {
        await this.simulateLatency(200, 800);

        const orderType = (orderData.orderType ?? 'unknown').toString();
        const lines = Array.isArray(orderData.lines) ? orderData.lines : [];

        this.orderCounter++;
        const docNo = `NET-${orderType.toUpperCase().slice(0, 3)}-${this.orderCounter}`;

        this.logger.debug(
            `[MOCK] createOrder: ${orderType} | ${lines.length} lines → ${docNo}`,
        );

        // Simulate 5% failure rate for realistic testing
        if (Math.random() < 0.05) {
            return {
                success: false,
                netsisDocumentNo: '',
                netsisRecordId: 0,
                errors: ['[MOCK] Netsis bağlantı hatası: Stok yetersiz / Insufficient stock'],
            };
        }

        return {
            success: true,
            netsisDocumentNo: docNo,
            netsisRecordId: this.orderCounter,
        };
    }

    async syncToNetsis(
        entityType: string,
        records: Array<Record<string, unknown>>,
    ): Promise<NetsisSyncResult> {
        await this.simulateLatency(500, 2000);

        this.logger.debug(
            `[MOCK] syncToNetsis: ${entityType} | ${records.length} records`,
        );

        return {
            entityType,
            syncedCount: records.length,
            failedCount: 0,
            errors: [],
            timestamp: new Date().toISOString(),
        };
    }

    async syncFromNetsis(
        entityType: string,
        _filters?: Record<string, unknown>,
    ): Promise<NetsisSyncResult> {
        await this.simulateLatency(500, 2000);

        this.logger.debug(`[MOCK] syncFromNetsis: ${entityType}`);

        return {
            entityType,
            syncedCount: Object.keys(this.mockStockData).length,
            failedCount: 0,
            errors: [],
            timestamp: new Date().toISOString(),
        };
    }

    async checkHealth(): Promise<{
        connected: boolean;
        latencyMs: number;
        version?: string;
    }> {
        const start = Date.now();
        await this.simulateLatency(10, 50);

        return {
            connected: true,
            latencyMs: Date.now() - start,
            version: 'MOCK-v1.0 (Development)',
        };
    }

    /** Simulates network latency with random jitter */
    private simulateLatency(minMs: number, maxMs: number): Promise<void> {
        const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        return new Promise((resolve) => setTimeout(resolve, delay));
    }
}
