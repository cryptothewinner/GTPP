import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Invoice } from '@/hooks/use-invoices';

export function useInvoiceDetail(id: string | null) {
    return useQuery({
        queryKey: ['invoices', 'detail', id],
        queryFn: () => apiClient.get<Invoice>(`/invoices/${id}`),
        enabled: !!id,
    });
}

export function usePostInvoiceToAccounting() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiClient.post<Invoice>(`/invoices/${id}/post`, {}),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ['invoices', 'detail', id] });
            qc.invalidateQueries({ queryKey: ['invoices', 'list'] });
            qc.invalidateQueries({ queryKey: ['journal-entries'] });
        },
    });
}
