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

interface ProductListResponse {
    success: boolean;
    data: any[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

interface ProductDetailResponse {
    success: boolean;
    data: Record<string, any>;
}

export function useProductList(params: ListParams) {
    const sp = new URLSearchParams();
    sp.set('page', String(params.page));
    sp.set('pageSize', String(params.pageSize));
    if (params.sortField) sp.set('sortField', params.sortField);
    if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
    if (params.search) sp.set('search', params.search);
    if (params.filters && Object.keys(params.filters).length > 0) {
        sp.set('filters', JSON.stringify(params.filters));
    }
    return useQuery({
        queryKey: ['products', 'list', params],
        queryFn: () => apiClient.get<ProductListResponse>(`/products?${sp.toString()}`),
        staleTime: 30 * 1000,
    });
}

export function useProductDetail(id: string | null) {
    return useQuery({
        queryKey: ['products', 'detail', id],
        queryFn: () => apiClient.get<ProductDetailResponse>(`/products/${id}`),
        enabled: !!id,
    });
}

export function useUpdateProduct() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
            apiClient.patch<ProductDetailResponse>(`/products/${id}`, data),
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: ['products', 'detail', v.id] });
            qc.invalidateQueries({ queryKey: ['products', 'list'] });
        },
    });
}

export function useCreateProduct() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, any>) =>
            apiClient.post<ProductDetailResponse>('/products', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['products', 'list'] });
            qc.invalidateQueries({ queryKey: ['products', 'summary'] });
        },
    });
}

export function useProductSummary() {
    return useQuery({
        queryKey: ['products', 'summary'],
        queryFn: () => apiClient.get<{ success: boolean; data: any }>('/products/summary'),
        staleTime: 60 * 1000,
    });
}
