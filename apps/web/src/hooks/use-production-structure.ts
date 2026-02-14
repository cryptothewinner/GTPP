import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ProductionSite {
    id: string;
    code: string;
    name: string;
    address?: string | null;
    _count?: {
        workCenters?: number;
        plantSteps?: number;
    };
}

export interface WorkStation {
    id: string;
    plantId: string;
    code: string;
    name: string;
    efficiency: number;
    hourlyCost: number;
    isActive: boolean;
    plantStep?: {
        id: string;
        name: string;
        type: string;
    } | null;
    _count?: {
        equipment?: number;
    };
}

export interface ProductionPlan {
    id: string;
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    _count?: {
        productionOrders?: number;
    };
}

export function useProductionSites() {
    return useQuery({
        queryKey: ['production-sites'],
        queryFn: () => apiClient.get<ProductionSite[]>('/plant-hierarchy/plants'),
    });
}

export function useWorkStations(plantId?: string) {
    return useQuery({
        queryKey: ['work-stations', plantId],
        queryFn: () => apiClient.get<WorkStation[]>('/plant-hierarchy/work-centers', { params: { plantId } }),
    });
}

export function useCreateWorkStation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<WorkStation>) => apiClient.post<WorkStation>('/plant-hierarchy/work-centers', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-stations'] });
        },
    });
}

export function useUpdateStationStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            apiClient.patch<WorkStation>(`/plant-hierarchy/work-centers/${id}`, { isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-stations'] });
        },
    });
}

export function useProductionPlans() {
    return useQuery({
        queryKey: ['production-plans'],
        queryFn: () => apiClient.get<ProductionPlan[]>('/production-plans'),
    });
}

export function useCreateProductionPlan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<ProductionPlan>) => apiClient.post<ProductionPlan>('/production-plans', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['production-plans'] });
        },
    });
}
