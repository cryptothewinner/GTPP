import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface JournalEntryItem {
    id: string;
    journalEntryId: string;
    glAccountId: string;
    debit: number;
    credit: number;
    description?: string;
    costCenterId?: string;
    glAccount?: {
        id: string;
        accountNumber: string;
        name: string;
    };
}

export interface JournalEntry {
    id: string;
    entryNumber: string;
    postingDate: string;
    reference: string;
    status: string;
    currency: string;
    headerText?: string;
    items: JournalEntryItem[];
    createdAt?: string;
    updatedAt?: string;
}

export function useJournalEntries() {
    return useQuery({
        queryKey: ['journal-entries'],
        queryFn: () => apiClient.get<JournalEntry[]>('/accounting/journal-entries'),
        staleTime: 30 * 1000,
    });
}
