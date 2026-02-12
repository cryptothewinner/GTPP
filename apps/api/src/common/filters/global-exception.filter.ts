import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import type { ApiResponse } from '@sepenatural/shared';

/**
 * Global exception filter that ensures ALL errors
 * are returned in the standardized ApiResponse envelope.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_ERROR';
        let message = 'An unexpected error occurred';
        let details: Record<string, unknown> | undefined;
        let validationErrors: Array<{ field: string; message: string; rule: string }> | undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse as Record<string, unknown>;
                message = (resp.message as string) || message;
                code = (resp.error as string) || code;

                // Handle class-validator errors
                if (Array.isArray(resp.message)) {
                    code = 'VALIDATION_ERROR';
                    message = 'Validation failed';
                    validationErrors = (resp.message as string[]).map((msg) => ({
                        field: msg.split(' ')[0] || 'unknown',
                        message: msg,
                        rule: 'validation',
                    }));
                }
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(
                `Unhandled exception: ${exception.message}`,
                exception.stack,
            );
        }

        const errorResponse: ApiResponse<any> = {
            success: false,
            data: null,
            error: {
                code,
                message,
                details,
                validationErrors,
            },
            timestamp: new Date().toISOString(),
        };

        this.logger.warn(
            `[${request.method}] ${request.url} → ${status} | ${code}: ${message}`,
        );

        response.status(status).json(errorResponse);
    }
}
