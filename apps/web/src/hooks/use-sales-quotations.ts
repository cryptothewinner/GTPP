import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SalesQuotationItem {
    id: string;
    materialId: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    netAmount: number;
    taxAmount: number;
    notes?: string;
    material?: { id: string; code: string; name: string; unitOfMeasure: string };
}

export interface SalesQuotation {
    id: string;
    quoteNumber: string;
    customerId: string;
    salesOrgId?: string;
    validFrom: string;
    validTo: string;
    status: string;
    currency: string;
    totalNetAmount: number;
    totalTaxAmount: number;
    totalGrossAmount: number;
    notes?: string;
    customer?: { id: string; name1: string; bpNumber: string };
    items?: SalesQuotationItem[];
    createdAt: string;
    updatedAt: string;
}

export function useSalesQuotationList(params?: { customerId?: string; status?: string }) {
    return useQuery({
        queryKey: ['sales-quotations', 'list', params],
        queryFn: () => apiClient.get<SalesQuotation[]>('/sales-quotations', { params }),
        staleTime: 30 * 1000,
    });
}

export function useSalesQuotationDetail(id: string | null) {
    return useQuery({
        queryKey: ['sales-quotations', 'detail', id],
        queryFn: () => apiClient.get<SalesQuotation>(`/sales-quotations/${id}`),
        enabled: !!id,
    });
}

export function useCreateSalesQuotation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiClient.post<SalesQuotation>('/sales-quotations', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sales-quotations', 'list'] });
        },
    });
}

export function useUpdateSalesQuotation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            apiClient.patch<SalesQuotation>(`/sales-quotations/${id}`, data),
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: ['sales-quotations', 'detail', v.id] });
            qc.invalidateQueries({ queryKey: ['sales-quotations', 'list'] });
        },
    });
}

export function useDeleteSalesQuotation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/sales-quotations/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sales-quotations', 'list'] });
        },
    });
}

export function useConvertQuotationToOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: string; body?: { salesOrgId?: string; plantId?: string } }) =>
            apiClient.post<any>(`/sales-quotations/${id}/convert`, body || {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sales-quotations'] });
            qc.invalidateQueries({ queryKey: ['sales-orders', 'list'] });
        },
    });
}
