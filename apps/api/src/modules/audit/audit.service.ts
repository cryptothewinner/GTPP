import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface AuditEntry {
    action: string;
    entityType: string;
    entityId?: string;
    userId?: string;
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    changes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    durationMs?: number;
    ipAddress?: string;
    endpoint?: string;
}

/**
 * AuditService — Immutable Ledger for System Actions
 *
 * Every significant action in the SepeNatural system is logged here.
 * This service is APPEND-ONLY. No updates, no deletes.
 *
 * For GxP/GMP compliance (relevant to supplement manufacturing),
 * this audit trail provides full traceability of who did what, when.
 */
@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Records an audit log entry.
     * This method is designed to NEVER throw — audit logging failures
     * should not break business operations.
     */
    async log(entry: AuditEntry): Promise<void> {
        try {
            await this.prisma.auditLog.create({
                data: {
                    action: entry.action,
                    entityType: entry.entityType,
                    entityId: entry.entityId!,
                    userId: entry.userId,
                    oldData: entry.oldData ? (entry.oldData as any) : undefined,
                    newData: entry.newData ? (entry.newData as any) : undefined,
                    changes: entry.changes ? (entry.changes as any) : undefined,
                    metadata: entry.metadata ? (entry.metadata as any) : undefined,
                    durationMs: entry.durationMs,
                    ipAddress: entry.ipAddress,
                    endpoint: entry.endpoint,
                },
            });
        } catch (error) {
            // Audit logging failures are logged but never propagated
            this.logger.error(
                `Failed to write audit log: ${(error as Error).message}`,
                (error as Error).stack,
            );
        }
    }

    /**
     * Computes a diff between old and new data objects.
     * Only includes fields that actually changed.
     */
    computeChanges(
        oldData: Record<string, unknown>,
        newData: Record<string, unknown>,
    ): Record<string, { from: unknown; to: unknown }> {
        const changes: Record<string, { from: unknown; to: unknown }> = {};

        const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

        for (const key of allKeys) {
            const oldVal = oldData[key];
            const newVal = newData[key];

            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                changes[key] = { from: oldVal, to: newVal };
            }
        }

        return changes;
    }
}
