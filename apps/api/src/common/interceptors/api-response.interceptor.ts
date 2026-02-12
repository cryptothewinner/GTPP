import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type { ApiResponse } from '@sepenatural/shared';

/**
 * Wraps all successful responses in the standardized ApiResponse envelope.
 * Raw data returned from controllers is automatically wrapped.
 */
@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map((data) => {
                // If the controller already returned an ApiResponse, pass through
                if (data && typeof data === 'object' && 'success' in data && 'timestamp' in data) {
                    return data;
                }

                return {
                    success: true,
                    data: data ?? null,
                    error: null,
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }
}
