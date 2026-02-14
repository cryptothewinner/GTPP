import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { JournalEntry } from '@/hooks/use-journal-entries';

export interface CreateJournalEntryPayload {
    headerText: string;
    reference: string;
    postingDate?: string;
    currency: string;
    items: {
        glAccountId: string;
        postingType: 'DEBIT' | 'CREDIT';
        amount: number;
        costCenterId?: string;
        description?: string;
    }[];
}

export function useCreateJournalEntry() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateJournalEntryPayload) => apiClient.post<JournalEntry>('/accounting/journal-entries', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['journal-entries'] });
        },
    });
}
