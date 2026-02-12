import { Injectable, Inject, Logger } from '@nestjs/common';
import { IErpAdapter, ERP_ADAPTER_PORT } from './ports/erp-adapter.port';
import { EventBusService } from '../../events/event-bus.service';
import type {
    NetsisStockItem,
    NetsisOrderPayload,
    NetsisOrderResult,
} from '@sepenatural/shared';

/**
 * ErpService — Business Logic Layer for ERP Operations
 *
 * This service sits between the application modules and the ERP adapter.
 * It adds business logic, event emission, caching, and error handling
 * on top of the raw adapter calls.
 *
 * Consumers of ERP data should use this service, NOT the adapter directly.
 */
@Injectable()
export class ErpService {
    private readonly logger = new Logger(ErpService.name);

    constructor(
        @Inject(ERP_ADAPTER_PORT)
        private readonly erpAdapter: IErpAdapter,
        private readonly eventBus: EventBusService,
    ) { }

    /**
     * Gets stock for a single SKU with event emission.
     */
    async getStock(sku: string): Promise<NetsisStockItem | null> {
        this.logger.debug(`Fetching stock for SKU: ${sku}`);

        const stock = await this.erpAdapter.getStock(sku);

        if (stock) {
            // Emit stock data refresh event (for dashboard/cache updates)
            await this.eventBus.emit(
                'stock.fetched',
                { sku, stock },
                false, // Don't persist to outbox — this is a read operation
            );
        }

        return stock;
    }

    /**
     * Gets stock for multiple SKUs (batch operation).
     * Essential for production order material availability checks.
     */
    async getStockBatch(skus: string[]): Promise<NetsisStockItem[]> {
        this.logger.debug(`Fetching batch stock for ${skus.length} SKUs`);
        return this.erpAdapter.getStockBatch(skus);
    }

    /**
     * Creates an order in Netsis.
     *
     * BUSINESS RULES:
     * 1. Validates order has at least one line
     * 2. Creates the order in Netsis via the adapter
     * 3. Emits an event on success/failure
     * 4. Returns the Netsis document reference
     */
    async createOrder(orderData: NetsisOrderPayload): Promise<NetsisOrderResult> {
        this.logger.log(
            `Creating ${orderData.orderType} order with ${orderData.lines.length} lines`,
        );

        // ── Business validation ──
        if (!orderData.lines || orderData.lines.length === 0) {
            throw new Error('Order must contain at least one line');
        }

        const result = await this.erpAdapter.createOrder(orderData);

        if (result.success) {
            await this.eventBus.emit('erp.order.created', {
                netsisDocumentNo: result.netsisDocumentNo,
                orderType: orderData.orderType,
                lineCount: orderData.lines.length,
            });

            this.logger.log(
                `Order created in Netsis: ${result.netsisDocumentNo}`,
            );
        } else {
            await this.eventBus.emit('erp.order.failed', {
                orderType: orderData.orderType,
                errors: result.errors,
            });

            this.logger.warn(
                `Order creation failed: ${result.errors?.join(', ')}`,
            );
        }

        return result;
    }

    /**
     * Health check for the ERP integration.
     */
    async checkHealth() {
        return this.erpAdapter.checkHealth();
    }
}
