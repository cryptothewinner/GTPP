import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ListParams {
    page: number;
    pageSize: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, any>;
}

export interface BatchConsumption {
    id: string;
    consumedQuantity: number;
    unit: string;
    materialStorageLocation?: string;
    materialBatch: {
        id: string;
        batchNumber: string;
        supplierLotNo?: string;
        storageLocation?: string;
        material: {
            code: string;
            name: string;
        };
    };
}

export interface ProductionBatch {
    id: string;
    batchNumber: string;
    status: string;
    quantity: number;
    unit: string;
    productionLocation?: string;
    manufacturingDate?: string;
    expiryDate?: string;
    productionOrder?: {
        id: string;
        orderNumber: string;
        product?: { name: string };
        recipe?: { code: string; name: string };
    };
    consumptions?: BatchConsumption[];
}

interface ListResponse {
    success: boolean;
    data: ProductionBatch[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

interface DetailResponse {
    success: boolean;
    data: ProductionBatch;
}

export function useBatchList(params: ListParams) {
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
        queryKey: ['production-batches', 'list', params],
        queryFn: () =>
            apiClient.get<ListResponse>(`/production-batches?${searchParams.toString()}`),
        staleTime: 30 * 1000,
    });
}

export function useBatchDetail(id: string | null) {
    return useQuery({
        queryKey: ['production-batches', 'detail', id],
        queryFn: () => apiClient.get<DetailResponse>(`/production-batches/${id}`),
        enabled: !!id,
    });
}

export function useCreateBatch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, any>) =>
            apiClient.post<any>('/production-batches', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['production-batches'] });
        },
    });
}

export function useUpdateBatch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
            apiClient.patch<DetailResponse>(`/production-batches/${id}`, data),
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: ['production-batches', 'detail', v.id] });
            qc.invalidateQueries({ queryKey: ['production-batches', 'list'] });
        },
    });
}

export function useQcPass() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClient.post<any>(`/production-batches/${id}/qc-pass`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['production-batches'] });
        },
    });
}

export function useQcFail() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, qcNotes }: { id: string; qcNotes: string }) =>
            apiClient.post<any>(`/production-batches/${id}/qc-fail`, { qcNotes }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['production-batches'] });
        },
    });
}

export function useReleaseBatch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClient.post<any>(`/production-batches/${id}/release`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['production-batches'] });
        },
    });
}
