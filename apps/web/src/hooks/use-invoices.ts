import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface InvoiceCustomer {
    id: string;
    bpNumber: string;
    name1: string;
}

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    salesOrderItemId?: string;
    outboundDeliveryItemId?: string;
    materialId: string;
    quantity: number;
    unit: string;
    netPrice: number;
    netAmount: number;
    taxAmount: number;
    grossAmount: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    companyCodeId: string;
    salesOrderId?: string;
    customerId: string;
    sourceDeliveryId?: string;
    deliveryId?: string;
    invoiceDate: string;
    dueDate?: string;
    currency: string;
    totalNetAmount: number;
    totalTaxAmount: number;
    totalGrossAmount: number;
    status: string;
    customer?: InvoiceCustomer;
    items?: InvoiceItem[];
    createdAt: string;
    updatedAt: string;
}

export interface InvoiceListParams {
    customerId?: string;
    status?: string;
    invoiceDateFrom?: string;
    invoiceDateTo?: string;
}

export function useInvoiceList(params?: InvoiceListParams) {
    return useQuery({
        queryKey: ['invoices', 'list', params],
        queryFn: () => apiClient.get<Invoice[]>('/invoices', { params }),
        staleTime: 30 * 1000,
    });
}

export function useCreateInvoice() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => apiClient.post<Invoice>('/invoices', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['invoices', 'list'] });
            qc.invalidateQueries({ queryKey: ['outbound-deliveries'] });
        },
    });
}
