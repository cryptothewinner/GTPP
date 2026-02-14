import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { ServiceLogService } from './service-log.service';
import { ServiceDirection } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * HttpLoggingInterceptor — Tüm gelen (INBOUND) istekleri otomatik loglar.
 *
 * - İstek başladığında zamanlayıcıyı başlatır
 * - Yanıt/hata durumunda ServiceLog tablosuna kaydeder
 * - `setImmediate` ile asenkron çalışır, ana akışı bloklamaz
 * - /api/v1/monitoring ve /health endpoint'leri hariç tutulur
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    // Loglanması gereksiz endpoint'ler
    private readonly EXCLUDED_PATHS = [
        '/api/v1/monitoring',
        '/api/v1/health',
        '/health',
    ];

    constructor(private readonly serviceLogService: ServiceLogService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();

        // Monitoring ve health check'leri loglamayı atla
        if (this.isExcluded(request.path)) {
            return next.handle();
        }

        const startTime = Date.now();
        const traceId =
            (request.headers['x-trace-id'] as string) ||
            (request.headers['x-correlation-id'] as string) ||
            randomUUID();

        // Trace ID'yi response header'a ekle
        response.setHeader('x-trace-id', traceId);

        return next.handle().pipe(
            tap((responseData) => {
                const durationMs = Date.now() - startTime;

                this.serviceLogService.logAsync({
                    direction: ServiceDirection.INBOUND,
                    endpoint: request.path,
                    method: request.method,
                    statusCode: response.statusCode,
                    durationMs,
                    requestHeaders: this.sanitizeHeaders(request.headers),
                    requestBody: this.truncateBody(request.body),
                    responseBody: this.truncateBody(responseData),
                    clientIp: request.ip || request.socket?.remoteAddress,
                    userId: (request as any).user?.id,
                    traceId,
                });
            }),
            catchError((error) => {
                const durationMs = Date.now() - startTime;
                const statusCode = error.status || error.statusCode || 500;

                this.serviceLogService.logAsync({
                    direction: ServiceDirection.INBOUND,
                    endpoint: request.path,
                    method: request.method,
                    statusCode,
                    durationMs,
                    requestHeaders: this.sanitizeHeaders(request.headers),
                    requestBody: this.truncateBody(request.body),
                    errorMessage: error.message || 'Unknown error',
                    isRetriable: statusCode >= 500,
                    clientIp: request.ip || request.socket?.remoteAddress,
                    userId: (request as any).user?.id,
                    traceId,
                });

                return throwError(() => error);
            }),
        );
    }

    private isExcluded(path: string): boolean {
        return this.EXCLUDED_PATHS.some((excluded) =>
            path.startsWith(excluded),
        );
    }

    /**
     * Hassas header'ları temizle (Authorization vb.)
     */
    private sanitizeHeaders(
        headers: Record<string, unknown>,
    ): Record<string, unknown> {
        const sanitized = { ...headers };
        const sensitiveKeys = ['authorization', 'cookie', 'x-api-key'];
        for (const key of sensitiveKeys) {
            if (sanitized[key]) {
                sanitized[key] = '[REDACTED]';
            }
        }
        return sanitized;
    }

    /**
     * Büyük body'leri kırp (max 50KB)
     */
    private truncateBody(body: unknown): unknown {
        if (!body) return null;
        try {
            const str = JSON.stringify(body);
            if (str.length > 50_000) {
                return { _truncated: true, _size: str.length, _preview: str.slice(0, 500) };
            }
            return body;
        } catch {
            return { _error: 'Could not serialize body' };
        }
    }
}
