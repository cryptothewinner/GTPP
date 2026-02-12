/**
 * Standardized API response envelope.
 * Every response from `apps/api` follows this contract.
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data: T | null;
    error: ApiError | null;
    meta?: ApiMeta;
    timestamp: string;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    validationErrors?: ValidationError[];
}

export interface ValidationError {
    field: string;
    message: string;
    rule: string;
}

export interface ApiMeta {
    page?: number;
    pageSize?: number;
    totalCount?: number;
    totalPages?: number;
}

/**
 * Paginated query params — shared between frontend hooks and backend.
 */
export interface PaginationQuery {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, unknown>;
}
