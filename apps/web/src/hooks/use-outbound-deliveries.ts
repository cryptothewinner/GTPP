import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Invoice } from '@/hooks/use-invoices';

export interface OutboundDeliveryItem {
    id: string;
    deliveryId: string;
    salesOrderItemId: string;
    materialId: string;
    plantId: string;
    quantity: number;
    pickedQuantity: number;
    unit: string;
    batchNumber?: string;
    material?: { id: string; code: string; name: string };
    plant?: { id: string; code: string; name: string };
}

export interface OutboundDelivery {
    id: string;
    deliveryNumber: string;
    salesOrderId: string;
    customerId: string;
    deliveryDate: string;
    plannedGIDate?: string;
    actualGI?: string;
    status: string;
    customer?: { id: string; name1: string; bpNumber: string };
    items?: OutboundDeliveryItem[];
    createdAt: string;
    updatedAt: string;
    salesOrder?: { orderNumber: string };
}

export function useOutboundDeliveryList() {
    return useQuery({
        queryKey: ['outbound-deliveries', 'list'],
        queryFn: () => apiClient.get<OutboundDelivery[]>('/outbound-deliveries'),
        staleTime: 30 * 1000,
    });
}

export function useOutboundDeliveryDetail(id: string | null) {
    return useQuery({
        queryKey: ['outbound-deliveries', 'detail', id],
        queryFn: () => apiClient.get<OutboundDelivery>(`/outbound-deliveries/${id}`),
        enabled: !!id,
    });
}

export function useCreateOutboundDelivery() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { salesOrderId: string; items: any[] }) =>
            apiClient.post<OutboundDelivery>('/outbound-deliveries', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['outbound-deliveries', 'list'] });
            qc.invalidateQueries({ queryKey: ['sales-orders'] }); // Status updates likely
        },
    });
}

export function usePostGoodsIssue() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClient.post<OutboundDelivery>(`/outbound-deliveries/${id}/post-goods-issue`, {}),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ['outbound-deliveries', 'detail', id] });
            qc.invalidateQueries({ queryKey: ['outbound-deliveries', 'list'] });
            qc.invalidateQueries({ queryKey: ['material-documents'] }); // Stock impact
        },
    });
}

export function useCreateInvoiceFromDelivery() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (deliveryId: string) =>
            apiClient.post<Invoice>('/invoices', { deliveryId }),
        onSuccess: (_, deliveryId) => {
            qc.invalidateQueries({ queryKey: ['invoices', 'list'] });
            qc.invalidateQueries({ queryKey: ['outbound-deliveries', 'detail', deliveryId] });
            qc.invalidateQueries({ queryKey: ['outbound-deliveries', 'list'] });
        },
    });
}
