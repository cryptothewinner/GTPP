export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    message?: string;
    errors?: string[];
    error?: {
        code: string;
        message: string;
        details?: any;
        validationErrors?: Array<{ field: string; message: string; rule: string }>;
    };
    meta?: any;
    timestamp?: string;
}

export interface ApiErrorResponse {
    success: false;
    error: string;
    message: string;
    statusCode: number;
    timestamp: string;
}
