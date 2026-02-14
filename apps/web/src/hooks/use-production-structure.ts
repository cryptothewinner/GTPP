import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Organization {
    id: string;
    name: string;
    taxNumber?: string;
    address?: string;
    sites?: ProductionSite[];
}

export interface ProductionSite {
    id: string;
    organizationId: string;
    name: string;
    address?: string;
    licenseNumber?: string;
    workStations?: WorkStation[];
}

export interface WorkStation {
    id: string;
    siteId: string;
    name: string;
    code: string;
    type: string;
    cleanroomGrade: string;
    status: string;
    dailyCapacity: number;
    hourlyRate: number;
    metadata?: any;
    site?: ProductionSite;
}

export function useOrganizations() {
    return useQuery({
        queryKey: ['organizations'],
        queryFn: () => apiClient.get<Organization[]>('/production-structure/organizations'),
    });
}

export function useProductionSites(organizationId?: string) {
    return useQuery({
        queryKey: ['production-sites', organizationId],
        queryFn: () => {
            const searchParams = new URLSearchParams();
            if (organizationId) searchParams.append('organizationId', organizationId);
            return apiClient.get<ProductionSite[]>(`/production-structure/sites?${searchParams.toString()}`);
        },
    });
}

export function useWorkStations(siteId?: string) {
    return useQuery({
        queryKey: ['work-stations', siteId],
        queryFn: () => {
            const searchParams = new URLSearchParams();
            if (siteId) searchParams.append('siteId', siteId);
            return apiClient.get<WorkStation[]>(`/production-structure/work-stations?${searchParams.toString()}`);
        },
    });
}

export function useCreateSite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<ProductionSite>) => apiClient.post<ProductionSite>('/production-structure/sites', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['production-sites'] });
        },
    });
}

export function useCreateWorkStation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<WorkStation>) => apiClient.post<WorkStation>('/production-structure/work-stations', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-stations'] });
        },
    });
}

export function useUpdateStationStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            apiClient.patch<WorkStation>(`/production-structure/work-stations/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-stations'] });
        },
    });
}

// Production Plans Hooks
export interface ProductionPlan {
    id: string;
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    productionOrders?: any[];
}

export function useProductionPlans() {
    return useQuery({
        queryKey: ['production-plans'],
        queryFn: () => apiClient.get<ProductionPlan[]>('/production-structure/plans'),
    });
}

export function useCreateProductionPlan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<ProductionPlan>) => apiClient.post<ProductionPlan>('/production-structure/plans', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['production-plans'] });
        },
    });
}
