import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

const DASHBOARD_STALE_TIME = 60 * 1000;

export function useDashboardKpis() {
    return useQuery({
        queryKey: ['dashboard', 'kpis'],
        queryFn: async () => {
            const response = await apiClient.get<any>('/dashboard');
            return { data: response?.data?.kpis ?? response?.kpis ?? {} };
        },
        staleTime: DASHBOARD_STALE_TIME,
        retry: false,
    });
}

export function useProductionStatus() {
    return useQuery({
        queryKey: ['dashboard', 'production-status'],
        queryFn: async () => {
            const response = await apiClient.get<any>('/dashboard');
            return { data: response?.data?.productionStatus ?? response?.productionStatus ?? [] };
        },
        staleTime: DASHBOARD_STALE_TIME,
        retry: false,
    });
}

export function useRecentActivity() {
    return useQuery({
        queryKey: ['dashboard', 'recent-activity'],
        queryFn: async () => {
            const response = await apiClient.get<any>('/dashboard');
            return { data: response?.data?.recentActivity ?? response?.recentActivity ?? [] };
        },
        staleTime: 30 * 1000,
        retry: false,
    });
}
