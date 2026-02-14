import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ServiceLog {
    id: string;
    direction: 'INBOUND' | 'OUTBOUND';
    endpoint: string;
    method: string;
    statusCode: number;
    durationMs: number;
    requestHeaders?: Record<string, unknown>;
    requestBody?: unknown;
    responseHeaders?: Record<string, unknown>;
    responseBody?: unknown;
    errorMessage?: string;
    retryCount: number;
    isRetriable: boolean;
    status: 'SUCCESS' | 'FAILED' | 'PENDING_RETRY' | 'RETRIED' | 'ARCHIVED';
    clientIp?: string;
    userId?: string;
    traceId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceLogStats {
    totalToday: number;
    failedToday: number;
    errorRateToday: number;
    totalLastHour: number;
    failedLastHour: number;
    avgDurationMs: number;
    pendingRetry: number;
}

interface ListParams {
    page?: number;
    pageSize?: number;
    direction?: string;
    status?: string;
    method?: string;
    search?: string;
    statusCodeMin?: number;
    statusCodeMax?: number;
    startDate?: string;
    endDate?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
}

interface ListResponse {
    data: ServiceLog[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

export function useServiceLogs(params: ListParams) {
    return useQuery({
        queryKey: ['service-logs', params],
        queryFn: () => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    searchParams.set(key, String(value));
                }
            });
            return apiClient.get<ListResponse>(
                `/monitoring/logs?${searchParams.toString()}`,
            );
        },
        refetchInterval: 10_000, // 10 saniyede bir otomatik yenile
    });
}

export function useServiceLogDetail(logId: string | null) {
    return useQuery({
        queryKey: ['service-log', logId],
        queryFn: () => apiClient.get<ServiceLog>(`/monitoring/logs/${logId}`),
        enabled: !!logId,
    });
}

export function useServiceLogStats() {
    return useQuery({
        queryKey: ['service-log-stats'],
        queryFn: () => apiClient.get<ServiceLogStats>('/monitoring/stats'),
        refetchInterval: 15_000,
    });
}

export function useRetryServiceLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (logId: string) =>
            apiClient.post<{ success: boolean; newLog: ServiceLog }>(
                `/monitoring/retry/${logId}`,
                {},
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-logs'] });
            queryClient.invalidateQueries({ queryKey: ['service-log-stats'] });
        },
    });
}

export function useArchiveServiceLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (logId: string) =>
            apiClient.patch<ServiceLog>(`/monitoring/archive/${logId}`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-logs'] });
            queryClient.invalidateQueries({ queryKey: ['service-log-stats'] });
        },
    });
}
