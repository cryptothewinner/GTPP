import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type PurchaseRequisitionStatus = 'DRAFT' | 'APPROVED' | 'CLOSED' | 'CANCELLED';

export interface PurchaseRequisitionItem {
    id: string;
    materialId?: string;
    materialName: string;
    quantity: number;
    unit: string;
    deliveryDate?: string;
    status: string;
    material?: { id: string; code: string; name: string; unitOfMeasure: string };
}

export interface PurchaseRequisition {
    id: string;
    prNumber: string;
    requestDate: string;
    requestedBy?: string;
    notes?: string;
    status: string;
    items?: PurchaseRequisitionItem[];
    createdAt: string;
    updatedAt: string;
}

export interface CreatePurchaseRequisitionPayload {
    requestedBy?: string;
    notes?: string;
    items: {
        materialId?: string;
        materialName: string;
        quantity: number;
        unit: string;
        deliveryDate?: string;
    }[];
}

export interface ConvertPrToPoPayload {
    supplierId: string;
    companyCodeId: string;
    purchOrgId: string;
    purchGroupId?: string;
    plantId: string;
    storageLocId?: string;
    documentDate?: string;
    currency?: string;
    notes?: string;
}

export function usePurchaseRequisitionList() {
    return useQuery({
        queryKey: ['purchase-requisitions', 'list'],
        queryFn: () => apiClient.get<PurchaseRequisition[]>('/purchasing/requisitions'),
        staleTime: 30 * 1000,
    });
}

export function usePurchaseRequisitionDetail(id: string | null) {
    return useQuery({
        queryKey: ['purchase-requisitions', 'detail', id],
        queryFn: () => apiClient.get<PurchaseRequisition>(`/purchasing/requisitions/${id}`),
        enabled: !!id,
    });
}

export function useCreatePurchaseRequisition() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreatePurchaseRequisitionPayload) =>
            apiClient.post<PurchaseRequisition>('/purchasing/requisitions', payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['purchase-requisitions', 'list'] });
        },
    });
}

export function useUpdatePurchaseRequisitionStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: PurchaseRequisitionStatus }) =>
            apiClient.patch<PurchaseRequisition>(`/purchasing/requisitions/${id}/status`, { status }),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['purchase-requisitions', 'detail', vars.id] });
            qc.invalidateQueries({ queryKey: ['purchase-requisitions', 'list'] });
        },
    });
}

export function useConvertPurchaseRequisitionToPo() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: ConvertPrToPoPayload }) =>
            apiClient.post<{ id: string }>(`/purchasing/orders/from-requisition/${id}`, payload),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['purchase-requisitions', 'detail', vars.id] });
            qc.invalidateQueries({ queryKey: ['purchase-requisitions', 'list'] });
            qc.invalidateQueries({ queryKey: ['purchase-orders', 'list'] });
        },
    });
}
