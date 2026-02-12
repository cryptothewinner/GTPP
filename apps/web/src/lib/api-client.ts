import type { ApiResponse } from '@sepe/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/**
 * Type-safe API client for the SepeNatural backend.
 * All methods return unwrapped data from the ApiResponse envelope.
 */
class SepeApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async request<T>(
        method: string,
        path: string,
        body?: unknown,
    ): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        });

        const json = (await response.json()) as ApiResponse<T>;

        if (!json.success) {
            throw new ApiError(json.error!);
        }

        return json.data as T;
    }

    get<T>(path: string) {
        return this.request<T>('GET', path);
    }

    post<T>(path: string, body: unknown) {
        return this.request<T>('POST', path, body);
    }

    patch<T>(path: string, body: unknown) {
        return this.request<T>('PATCH', path, body);
    }
}

class ApiError extends Error {
    code: string;
    details?: Record<string, unknown>;

    constructor(error: NonNullable<ApiResponse['error']>) {
        super(error.message);
        this.name = 'ApiError';
        this.code = error.code;
        this.details = error.details;
    }
}

export const api = new SepeApiClient(API_BASE);
