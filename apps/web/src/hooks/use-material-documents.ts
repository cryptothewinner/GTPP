import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface CreateMaterialDocumentItemDto {
    materialId: string;
    quantity: number;
    unit: string;
    plantId: string;
    storageLocId?: string;
    batchNumber?: string;
    refItemId?: string; // PO Item ID
}

export interface CreateMaterialDocumentDto {
    movementType: 'GR_PURCHASE_ORDER' | 'GI_FOR_ORDER' | 'GR_FOR_ORDER' | 'INITIAL_STOCK_ENTRY';
    documentDate?: string;
    postingDate?: string;
    reference?: string;
    headerText?: string;
    purchaseOrderId?: string;
    items: CreateMaterialDocumentItemDto[];
}

export function useCreateMaterialDocument() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateMaterialDocumentDto) =>
            apiClient.post('/inventory/material-documents', data),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: ['material-documents'] });
            if (variables.purchaseOrderId) {
                qc.invalidateQueries({ queryKey: ['purchase-orders', 'detail', variables.purchaseOrderId] });
            }
        },
    });
}

export function useMaterialMovements(materialId: string) {
    return useQuery({
        queryKey: ['material-documents', 'material', materialId],
        queryFn: () => apiClient.get<any[]>(`/inventory/material-documents/material/${materialId}`),
        enabled: !!materialId,
    });
}
