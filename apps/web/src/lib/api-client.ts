import { recordClientApiMetric } from './performance-metrics';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== 'undefined') {
    console.warn('[api-client] NEXT_PUBLIC_API_URL is not set. Falling back to http://localhost:3001/api/v1');
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
    body?: unknown;
    params?: Record<string, any>;
}

class ApiClient {
    private baseUrl: string;
    private accessToken: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;

        if (typeof window !== 'undefined') {
            this.accessToken = sessionStorage.getItem('auth_token');
        }
    }

    private getToken(): string | null {
        if (this.accessToken) return this.accessToken;
        if (typeof window === 'undefined') return null;

        this.accessToken = sessionStorage.getItem('auth_token');
        return this.accessToken;
    }

    private setToken(token: string | null) {
        this.accessToken = token;
        if (typeof window === 'undefined') return;

        if (token) {
            sessionStorage.setItem('auth_token', token);
            localStorage.removeItem('auth_token');
            return;
        }

        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('auth_token');
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { body, headers, params, ...rest } = options;
        const token = this.getToken();

        const startTime = performance.now();
        const method = rest.method || 'GET';

        let url = `${this.baseUrl}${endpoint}`;
        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    searchParams.append(key, String(value));
                }
            });
            const queryString = searchParams.toString();
            if (queryString) {
                url += (url.includes('?') ? '&' : '?') + queryString;
            }
        }

        const response = await fetch(url, {
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
        return !!this.getToken();
    }

    logout() {
        this.setToken(null);
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }

    async login(email: string, password: string) {
        const response = await this.post<any>('/auth/login', { email, password });
        if (response.accessToken) {
            this.setToken(response.accessToken);
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
