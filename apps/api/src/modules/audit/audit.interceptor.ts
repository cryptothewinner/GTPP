import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { AuditService } from './audit.service';

/**
 * AuditInterceptor — Automatically logs API requests to the audit trail.
 * Applied selectively to routes that modify data (POST, PATCH, DELETE).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private readonly auditService: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();
        const startTime = Date.now();

        // Only audit mutating operations
        if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
            return next.handle();
        }

        return next.handle().pipe(
            tap({
                next: (responseData) => {
                    const duration = Date.now() - startTime;

                    this.auditService.log({
                        action: this.mapHttpMethodToAction(request.method),
                        entityType: this.extractEntityType(request.path),
                        entityId: request.params?.id as string,
                        userId: (request as any).user?.id,
                        newData: request.body,
                        durationMs: duration,
                        ipAddress: request.ip || request.socket.remoteAddress,
                        endpoint: `${request.method} ${request.path}`,
                    });
                },
            }),
        );
    }

    private mapHttpMethodToAction(method: string): string {
        const map: Record<string, string> = {
            POST: 'CREATE',
            PATCH: 'UPDATE',
            PUT: 'UPDATE',
            DELETE: 'DELETE',
        };
        return map[method] || 'UNKNOWN';
    }

    private extractEntityType(path: string): string {
        // Extract entity slug from paths like /api/v1/metadata/entities/production-order/records
        const match = path.match(/entities\/([^/]+)/);
        return match?.[1] || 'unknown';
    }
}
