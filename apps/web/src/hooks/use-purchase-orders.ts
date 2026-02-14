import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface PurchaseOrderItem {
    id: string;
    materialId: string;
    quantity: number;
    unit: string;
    netPrice: number;
    taxRate: number;
    plantId?: string;
    storageLocId?: string;
    deliveryDate?: string;
    receivedQuantity: number;
    isOpen: boolean;
    material?: { id: string; code: string; name: string; unitOfMeasure: string };
    plant?: { id: string; code: string; name: string };
}

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    supplierId: string;
    companyCodeId: string;
    purchOrgId: string;
    purchGroupId: string;
    documentDate: string;
    currency: string;
    status: string; // DRAFT, CONFIRMED, COMPLETED, CANCELLED
    supplier?: { id: string; name1: string; bpNumber: string };
    items?: PurchaseOrderItem[];
    createdAt: string;
    updatedAt: string;
}

export function usePurchaseOrderList(params?: { supplierId?: string; status?: string }) {
    return useQuery({
        queryKey: ['purchase-orders', 'list', params],
        queryFn: () => apiClient.get<PurchaseOrder[]>('/purchasing/orders', { params }),
        staleTime: 30 * 1000,
    });
}

export function usePurchaseOrderDetail(id: string | null) {
    return useQuery({
        queryKey: ['purchase-orders', 'detail', id],
        queryFn: () => apiClient.get<PurchaseOrder>(`/purchasing/orders/${id}`),
        enabled: !!id,
    });
}

export function useCreatePurchaseOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiClient.post<PurchaseOrder>('/purchasing/orders', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['purchase-orders', 'list'] });
        },
    });
}

export function useUpdatePurchaseOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            apiClient.patch<PurchaseOrder>(`/purchasing/orders/${id}`, data),
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: ['purchase-orders', 'detail', v.id] });
            qc.invalidateQueries({ queryKey: ['purchase-orders', 'list'] });
        },
    });
}

export function useDeletePurchaseOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/purchasing/orders/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['purchase-orders', 'list'] });
        },
    });
}

// Metadata Hooks
export function usePurchasingOrgList() {
    return useQuery({
        queryKey: ['meta', 'purchasing-orgs'],
        queryFn: () => apiClient.get<any[]>('/purchasing/orders/meta/purchasing-orgs'),
        staleTime: 60 * 60 * 1000,
    });
}

export function usePurchasingGroupList() {
    return useQuery({
        queryKey: ['meta', 'purchasing-groups'],
        queryFn: () => apiClient.get<any[]>('/purchasing/orders/meta/purchasing-groups'),
        staleTime: 60 * 60 * 1000,
    });
}

export function useCompanyCodeList() {
    return useQuery({
        queryKey: ['meta', 'company-codes'],
        queryFn: () => apiClient.get<any[]>('/purchasing/orders/meta/company-codes'),
        staleTime: 60 * 60 * 1000,
    });
}

export function usePlantList() {
    return useQuery({
        queryKey: ['meta', 'plants'],
        queryFn: () => apiClient.get<any[]>('/plant-hierarchy/plants'),
        staleTime: 60 * 60 * 1000,
    });
}
