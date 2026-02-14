import { recordClientApiMetric } from './performance-metrics';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== 'undefined') {
    console.warn('[api-client] NEXT_PUBLIC_API_URL is not set. Falling back to http://localhost:3001/api/v1');
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
    body?: unknown;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { body, headers, ...rest } = options;
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

        const startTime = performance.now();
        const method = rest.method || 'GET';

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
            ...rest,
        });

        const durationMs = performance.now() - startTime;
        recordClientApiMetric({
            endpoint,
            method,
            durationMs,
            statusCode: response.status,
            ok: response.ok,
            timestamp: Date.now(),
        });

        if (!response.ok) {
            if (response.status === 401 && endpoint !== '/auth/login') {
                this.logout();
            }

            const errorBody = await response.json().catch(() => ({}));
            throw new ApiError(
                response.status,
                errorBody.message || `HTTP ${response.status}`,
                errorBody,
            );
        }

        return response.json();
    }

    isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem('auth_token');
    }

    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
    }

    async login(email: string, password: string) {
        const response = await this.post<any>('/auth/login', { email, password });
        // The backend returns { accessToken: string, user: { ... } }
        if (response.accessToken) {
            localStorage.setItem('auth_token', response.accessToken);
        }
        return response;
    }

    get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    post<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'POST', body });
    }

    patch<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
    }

    delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public body?: unknown,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
