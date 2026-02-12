import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface StockListParams {
    page: number;
    pageSize: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, any>;
}

interface StockListResponse {
    success: boolean;
    data: any[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

interface StockDetailResponse {
    success: boolean;
    data: Record<string, any>;
}

export function useStockList(params: StockListParams) {
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(params.page));
    searchParams.set('pageSize', String(params.pageSize));
    if (params.sortField) searchParams.set('sortField', params.sortField);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.search) searchParams.set('search', params.search);
    if (params.filters && Object.keys(params.filters).length > 0) {
        searchParams.set('filters', JSON.stringify(params.filters));
    }

    return useQuery({
        queryKey: ['stocks', 'list', params],
        queryFn: () =>
            apiClient.get<StockListResponse>(`/stocks?${searchParams.toString()}`),
        staleTime: 30 * 1000,
    });
}

export function useStockDetail(id: string | null) {
    return useQuery({
        queryKey: ['stocks', 'detail', id],
        queryFn: () => apiClient.get<StockDetailResponse>(`/stocks/${id}`),
        enabled: !!id,
    });
}

export function useUpdateStock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
            apiClient.patch<StockDetailResponse>(`/stocks/${id}`, data),
        onSuccess: (_, variables) => {
            // Invalidate both the detail and list queries
            queryClient.invalidateQueries({ queryKey: ['stocks', 'detail', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['stocks', 'list'] });
        },
    });
}
