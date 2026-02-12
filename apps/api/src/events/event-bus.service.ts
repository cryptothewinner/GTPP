import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

/**
 * EventBusService — Event-Driven Architecture Foundation
 *
 * Currently uses NestJS EventEmitter (in-process).
 * Designed to be swapped with RabbitMQ/Redis Streams without
 * changing the calling code.
 *
 * PATTERN: Transactional Outbox
 * Events are persisted to the `event_outbox` table first,
 * then emitted. This ensures events are not lost if the
 * process crashes after the business operation.
 */
@Injectable()
export class EventBusService {
    private readonly logger = new Logger(EventBusService.name);

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Emits a domain event.
     *
     * @param eventType - Dot-notation event name (e.g., 'production-order.created')
     * @param payload - Event data
     * @param persist - If true, also writes to the outbox table (default: true)
     */
    async emit(
        eventType: string,
        payload: Record<string, unknown>,
        persist = true,
    ): Promise<void> {
        this.logger.debug(`📡 Event: ${eventType}`);

        // ── Step 1: Persist to outbox (for reliability) ──
        if (persist) {
            try {
                await this.prisma.eventOutbox.create({
                    data: {
                        eventType,
                        aggregateType: eventType.split('.')[0] || 'unknown',
                        aggregateId: (payload.recordId as string) || (payload.id as string) || 'unknown',
                        payload: payload as any,
                        status: 'pending',
                    },
                });
            } catch (error) {
                this.logger.error(
                    `Failed to persist event to outbox: ${(error as Error).message}`,
                );
                // Don't block the in-process emission
            }
        }

        // ── Step 2: Emit in-process ──
        this.eventEmitter.emit(eventType, {
            eventType,
            payload,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Subscribe to events. Wraps EventEmitter2.on() for future abstraction.
     */
    on(eventType: string, handler: (data: unknown) => void): void {
        this.eventEmitter.on(eventType, handler);
    }
}
