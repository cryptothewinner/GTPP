import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface GLAccount {
    id: string;
    accountNumber: string;
    name: string;
    type: string;
    currency?: string;
    isTaxAccount?: boolean;
    isReconciliation?: boolean;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export function useGLAccounts() {
    return useQuery({
        queryKey: ['gl-accounts'],
        queryFn: () => apiClient.get<GLAccount[]>('/accounting/gl-accounts'),
        staleTime: 30 * 1000,
    });
}
