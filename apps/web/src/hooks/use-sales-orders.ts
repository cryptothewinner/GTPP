import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SalesOrderItem {
    id: string;
    materialId: string;
    plantId?: string;
    quantity: number;
    unit: string;
    netPrice: number;
    netAmount: number;
    taxAmount: number;
    deliveryStatus: string;
    material?: { id: string; code: string; name: string; unitOfMeasure: string };
}

export interface SalesOrder {
    id: string;
    orderNumber: string;
    customerId: string;
    salesOrgId: string;
    customerRef?: string;
    orderDate: string;
    requestedDate?: string;
    currency: string;
    totalNetAmount: number;
    totalTaxAmount: number;
    totalGrossAmount: number;
    status: string;
    deliveryStatus?: string;
    billingStatus?: string;
    customer?: { id: string; name1: string; bpNumber: string };
    salesOrg?: { id: string; code: string; name: string };
    items?: SalesOrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface SalesOrg {
    id: string;
    code: string;
    name: string;
    currency: string;
}

export function useSalesOrderList(params?: { customerId?: string; status?: string }) {
    return useQuery({
        queryKey: ['sales-orders', 'list', params],
        queryFn: () => apiClient.get<SalesOrder[]>('/sales-orders', { params }),
        staleTime: 30 * 1000,
    });
}

export function useSalesOrderDetail(id: string | null) {
    return useQuery({
        queryKey: ['sales-orders', 'detail', id],
        queryFn: () => apiClient.get<SalesOrder>(`/sales-orders/${id}`),
        enabled: !!id,
    });
}

export function useCreateSalesOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiClient.post<SalesOrder>('/sales-orders', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sales-orders', 'list'] });
        },
    });
}

export function useUpdateSalesOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            apiClient.patch<SalesOrder>(`/sales-orders/${id}`, data),
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: ['sales-orders', 'detail', v.id] });
            qc.invalidateQueries({ queryKey: ['sales-orders', 'list'] });
        },
    });
}

export function useDeleteSalesOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/sales-orders/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sales-orders', 'list'] });
        },
    });
}

export function useSalesOrgList() {
    return useQuery({
        queryKey: ['sales-orgs', 'list'],
        queryFn: () => apiClient.get<SalesOrg[]>('/sales-orders/meta/sales-orgs'),
        staleTime: 5 * 60 * 1000,
    });
}
