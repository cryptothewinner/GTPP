const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
            ...rest,
        });

        if (!response.ok) {
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
        if (response.success && response.data?.token) {
            localStorage.setItem('auth_token', response.data.token);
        }
        return response.data;
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
