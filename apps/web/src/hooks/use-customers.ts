
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api-client';

export interface Customer {
    id: string;
    bpNumber: string;
    name1: string;
    name2?: string;
    // ... add more fields as needed
    // We can infer types from API response usually,
    // but for now let's keep it simple
    customerDetails?: {
        salesDistrict: string;
        priceList: string;
    };
    supplierDetails?: any;
    // Computed fields from service
    totalRevenue?: number;
    lastActivity?: string;
}

export interface CustomerActivity {
    id: string;
    type: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE';
    subject: string;
    description?: string;
    status: 'PLANNED' | 'COMPLETED' | 'CANCELLED';
    performedAt?: string;
    createdAt: string;
    createdBy: string;
}

export function useCustomers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
}) {
    return useQuery({
        queryKey: ['customers', params],
        queryFn: async () => {
            const response = await api.get<any>('/business-partners', { params });
            return response;
        },
    });
}

export function useCustomer(id: string) {
    return useQuery({
        queryKey: ['customer', id],
        queryFn: async () => {
            const response = await api.get<any>(`/business-partners/${id}`);
            return response;
        },
        enabled: !!id,
    });
}

export function useCustomerActivities(customerId: string) {
    return useQuery({
        queryKey: ['customer-activities', customerId],
        queryFn: async () => {
            const response = await api.get<any[]>(`/business-partners/${customerId}/activities`);
            return response;
        },
        enabled: !!customerId,
    });
}

export function useAddCustomerActivity() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ customerId, ...data }: { customerId: string } & Partial<CustomerActivity>) => {
            return api.post(`/business-partners/${customerId}/activities`, data);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customer-activities', variables.customerId] });
            queryClient.invalidateQueries({ queryKey: ['customer-metrics', variables.customerId] }); // Maybe metrics update too?
        },
    });
}

export function useCustomerMetrics(customerId: string) {
    return useQuery({
        queryKey: ['customer-metrics', customerId],
        queryFn: async () => {
            const response = await api.get<any>(`/business-partners/${customerId}/metrics`);
            return response;
        },
        enabled: !!customerId,
    });
}

export function useCreateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            return api.post('/business-partners', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}

export function useAddCustomerNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ customerId, note }: { customerId: string; note: { content: string; isPinned?: boolean } }) => {
            const response = await api.post<any>(`/business-partners/${customerId}/notes`, note);
            return response.data;
        },
        onSuccess: (_, { customerId }) => {
            queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
            // toast success handled by UI or global handler ideally
        },
    });
}
