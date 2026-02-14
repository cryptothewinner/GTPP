import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ListParams {
    page: number;
    pageSize: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, any>;
}

interface ListResponse {
    success: boolean;
    data: any[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

interface DetailResponse {
    success: boolean;
    data: Record<string, any>;
}

export function useProductionOrderList(params: ListParams) {
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
        queryKey: ['production-orders', 'list', params],
        queryFn: () =>
            apiClient.get<ListResponse>(`/production-orders?${searchParams.toString()}`),
        staleTime: 30 * 1000,
    });
}

export function useProductionOrderDetail(id: string | null) {
    return useQuery({
        queryKey: ['production-orders', 'detail', id],
        queryFn: () => apiClient.get<DetailResponse>(`/production-orders/${id}`),
        enabled: !!id,
    });
}

export function useCreateProductionOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, any>) =>
            apiClient.post<any>('/production-orders', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['production-orders'] });
        },
    });
}

export function useUpdateProductionOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
            apiClient.patch<DetailResponse>(`/production-orders/${id}`, data),
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: ['production-orders', 'detail', v.id] });
            qc.invalidateQueries({ queryKey: ['production-orders', 'list'] });
        },
    });
}

export function useStartProductionOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClient.post<any>(`/production-orders/${id}/start`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['production-orders'] });
        },
    });
}

export function useCompleteProductionOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClient.post<any>(`/production-orders/${id}/complete`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['production-orders'] });
        },
    });
}
export interface MaterialCheckResponse {
    isAvailable: boolean;
    missingItems: Array<{
        materialId: string;
        materialName: string;
        materialCode: string;
        required: number;
        available: number;
        missing: number;
        unit: string;
    }>;
    orderId: string;
    orderNumber: string;
}

export function useMaterialCheck(id: string | null) {
    return useQuery({
        queryKey: ['production-orders', 'material-check', id],
        queryFn: () => apiClient.get<MaterialCheckResponse>(`/production-orders/${id}/availability`),
        enabled: !!id,
        staleTime: 1000 * 60, // 1 minute
    });
}

export function useRescheduleProductionOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, plannedStart, plannedEnd }: { id: string; plannedStart: Date; plannedEnd: Date }) =>
            apiClient.patch<any>(`/production-orders/${id}/reschedule`, {
                plannedStart: plannedStart.toISOString(),
                plannedEnd: plannedEnd.toISOString(),
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['production-orders'] });
        },
    });
}

export function useAllProductionOrders() {
    return useQuery({
        queryKey: ['production-orders', 'all'],
        queryFn: async () => {
            const response = await apiClient.get<any>(`/production-orders?page=1&pageSize=1000`);
            return response.data?.rows ?? response.data ?? [];
        },
    });
}
