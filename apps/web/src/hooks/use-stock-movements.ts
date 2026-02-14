import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ListParams {
    page: number;
    pageSize: number;
    search?: string;
    type?: string;
}

export function useStockMovementList(params: ListParams) {
    const sp = new URLSearchParams();
    sp.set('page', String(params.page));
    sp.set('pageSize', String(params.pageSize));
    if (params.search) sp.set('search', params.search);
    if (params.type) sp.set('type', params.type);
    return useQuery({
        queryKey: ['stock-movements', 'list', params],
        queryFn: () => apiClient.get<any>(`/stock-movements?${sp.toString()}`),
        staleTime: 30 * 1000,
    });
}

export function useStockMovementSummary() {
    return useQuery({
        queryKey: ['stock-movements', 'summary'],
        queryFn: () => apiClient.get<any>('/stock-movements/summary'),
        staleTime: 60 * 1000,
    });
}

export function useRecentMovements(limit: number = 10) {
    return useQuery({
        queryKey: ['stock-movements', 'recent', limit],
        queryFn: () => apiClient.get<any>(`/stock-movements/recent?limit=${limit}`),
        staleTime: 30 * 1000,
    });
}

export function useCreateStockMovement() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, any>) =>
            apiClient.post<any>('/stock-movements', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['stock-movements'] });
            qc.invalidateQueries({ queryKey: ['materials'] });
            qc.invalidateQueries({ queryKey: ['products'] });
            qc.invalidateQueries({ queryKey: ['material-batches'] });
        },
    });
}
