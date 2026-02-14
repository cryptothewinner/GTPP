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

export function useRecipeList(params: ListParams) {
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
        queryKey: ['recipes', 'list', params],
        queryFn: () =>
            apiClient.get<ListResponse>(`/recipes?${searchParams.toString()}`),
        staleTime: 30 * 1000,
    });
}

export function useRecipeDetail(id: string | null) {
    return useQuery({
        queryKey: ['recipes', 'detail', id],
        queryFn: () => apiClient.get<DetailResponse>(`/recipes/${id}`),
        enabled: !!id,
    });
}

export function useCreateRecipe() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, any>) =>
            apiClient.post<any>('/recipes', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['recipes'] });
        },
    });
}

export function useUpdateRecipe() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
            apiClient.patch<DetailResponse>(`/recipes/${id}`, data),
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: ['recipes', 'detail', v.id] });
            qc.invalidateQueries({ queryKey: ['recipes', 'list'] });
        },
    });
}

export function useRecipeSummary() {
    return useQuery({
        queryKey: ['recipes', 'summary'],
        queryFn: () => apiClient.get<any>('/recipes/summary'),
        staleTime: 30 * 1000,
    });
}

export function useAddRecipeItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ recipeId, data }: { recipeId: string; data: Record<string, any> }) =>
            apiClient.post<any>(`/recipes/${recipeId}/items`, data),
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: ['recipes', 'detail', v.recipeId] });
            qc.invalidateQueries({ queryKey: ['recipes', 'list'] });
        },
    });
}

export function useUpdateRecipeItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ recipeId, itemId, data }: { recipeId: string; itemId: string; data: Record<string, any> }) =>
            apiClient.patch<any>(`/recipes/${recipeId}/items/${itemId}`, data),
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: ['recipes', 'detail', v.recipeId] });
        },
    });
}

export function useRemoveRecipeItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ recipeId, itemId }: { recipeId: string; itemId: string }) =>
            apiClient.delete<any>(`/recipes/${recipeId}/items/${itemId}`),
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: ['recipes', 'detail', v.recipeId] });
            qc.invalidateQueries({ queryKey: ['recipes', 'list'] });
        },
    });
}

export function useRecalculateCost() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (recipeId: string) =>
            apiClient.get<any>(`/recipes/${recipeId}/cost`),
        onSuccess: (_, recipeId) => {
            qc.invalidateQueries({ queryKey: ['recipes', 'detail', recipeId] });
            qc.invalidateQueries({ queryKey: ['recipes', 'list'] });
        },
    });
}
