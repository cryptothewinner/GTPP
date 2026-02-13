
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

export interface MaterialBatchConsumption {
    id: string;
    productionBatch: {
        id: string;
        batchNumber: string;
        productionOrder?: {
            orderNumber: string;
            product?: {
                name: string;
                code: string;
            };
        };
    };
    consumedQuantity: number;
    unit: string;
    timestamp: string;
    recipeItem?: {
        materialId: string;
    };
}

export interface MaterialBatch {
    id: string;
    batchNumber: string;
    materialId: string;
    supplierLotNo?: string;
    manufacturingDate?: string;
    expiryDate?: string;
    quantity: number;
    remainingQuantity: number;
    unit: string;
    status: string;
    storageLocation?: string;
    createdAt: string;
    updatedAt: string;
    material: {
        code: string;
        name: string;
        type: string;
        unitOfMeasure: string;
    };
    consumptions?: MaterialBatchConsumption[];
}

interface ListResponse {
    success: boolean;
    data: MaterialBatch[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

interface DetailResponse {
    success: boolean;
    data: MaterialBatch;
}

export function useMaterialBatchList(params: ListParams) {
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
        queryKey: ['material-batches', 'list', params],
        queryFn: () =>
            apiClient.get<ListResponse>(`/material-batches?${searchParams.toString()}`),
        staleTime: 30 * 1000,
    });
}

export function useMaterialBatchDetail(id: string | null) {
    return useQuery({
        queryKey: ['material-batches', 'detail', id],
        queryFn: () => apiClient.get<DetailResponse>(`/material-batches/${id}`),
        enabled: !!id,
    });
}

export function useCreateMaterialBatch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const response = await apiClient.post('/material-batches', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['material-batches'] });
        },
    });
}
