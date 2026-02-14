import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ─── Interfaces ────────────────────────────────────────────────

export interface PlantStep {
    id: string;
    code: string;
    name: string;
    type: 'SITE' | 'AREA' | 'CELL' | 'LINE';
    parentId: string | null;
    description?: string;
    environmentSpecs?: any;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    parent?: PlantStep;
    children?: PlantStep[];
    workCenters?: WorkCenter[];
    _count?: { children: number; workCenters: number };
}

export interface WorkCenter {
    id: string;
    code: string;
    name: string;
    plantStepId: string;
    efficiency: number;
    hourlyCost: number;
    capacityType: 'TIME_BASED' | 'UNIT_BASED';
    isActive: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    plantStep?: PlantStep;
    equipment?: Equipment[];
    _count?: { equipment: number };
}

export interface Equipment {
    id: string;
    code: string;
    name: string;
    workCenterId: string;
    serialNumber?: string;
    model?: string;
    manufacturer?: string;
    status: string;
    lastCalibration?: string;
    nextCalibration?: string;
    installDate?: string;
    metadata?: any;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    workCenter?: WorkCenter & { plantStep?: PlantStep };
    capabilities?: EquipmentCapability[];
}

export interface EquipmentCapability {
    id: string;
    equipmentId: string;
    processType: string;
    minCapacity: number;
    maxCapacity: number;
    unit: string;
    parameters?: any;
}

// ─── Plant Step Hooks ──────────────────────────────────────────

export function usePlantStepTree() {
    return useQuery({
        queryKey: ['plant-steps', 'tree'],
        queryFn: () => apiClient.get<PlantStep[]>('/plant-hierarchy/plant-steps/tree'),
        staleTime: 30_000,
    });
}

export function usePlantSteps(parentId?: string, type?: string) {
    return useQuery({
        queryKey: ['plant-steps', 'list', parentId, type],
        queryFn: () => {
            const sp = new URLSearchParams();
            if (parentId) sp.set('parentId', parentId);
            if (type) sp.set('type', type);
            return apiClient.get<PlantStep[]>(`/plant-hierarchy/plant-steps?${sp.toString()}`);
        },
        staleTime: 30_000,
    });
}

export function usePlantStepDetail(id: string | null) {
    return useQuery({
        queryKey: ['plant-steps', 'detail', id],
        queryFn: () => apiClient.get<PlantStep>(`/plant-hierarchy/plant-steps/${id}`),
        enabled: !!id,
    });
}

export function useCreatePlantStep() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<PlantStep>) =>
            apiClient.post<PlantStep>('/plant-hierarchy/plant-steps', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['plant-steps'] });
        },
    });
}

export function useUpdatePlantStep() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PlantStep> }) =>
            apiClient.patch<PlantStep>(`/plant-hierarchy/plant-steps/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['plant-steps'] });
        },
    });
}

export function useDeletePlantStep() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClient.delete(`/plant-hierarchy/plant-steps/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['plant-steps'] });
        },
    });
}

// ─── Work Center Hooks ─────────────────────────────────────────

export function useWorkCenters(plantStepId?: string) {
    return useQuery({
        queryKey: ['work-centers', plantStepId],
        queryFn: () => {
            const sp = new URLSearchParams();
            if (plantStepId) sp.set('plantStepId', plantStepId);
            return apiClient.get<WorkCenter[]>(`/plant-hierarchy/work-centers?${sp.toString()}`);
        },
        staleTime: 30_000,
    });
}

export function useWorkCenterDetail(id: string | null) {
    return useQuery({
        queryKey: ['work-centers', 'detail', id],
        queryFn: () => apiClient.get<WorkCenter>(`/plant-hierarchy/work-centers/${id}`),
        enabled: !!id,
    });
}

export function useCreateWorkCenter() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<WorkCenter>) =>
            apiClient.post<WorkCenter>('/plant-hierarchy/work-centers', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['work-centers'] });
        },
    });
}

export function useUpdateWorkCenter() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<WorkCenter> }) =>
            apiClient.patch<WorkCenter>(`/plant-hierarchy/work-centers/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['work-centers'] });
        },
    });
}

export function useDeleteWorkCenter() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClient.delete(`/plant-hierarchy/work-centers/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['work-centers'] });
        },
    });
}

// ─── Equipment Hooks ───────────────────────────────────────────

export function useEquipment(workCenterId?: string, status?: string) {
    return useQuery({
        queryKey: ['equipment', workCenterId, status],
        queryFn: () => {
            const sp = new URLSearchParams();
            if (workCenterId) sp.set('workCenterId', workCenterId);
            if (status) sp.set('status', status);
            return apiClient.get<Equipment[]>(`/plant-hierarchy/equipment?${sp.toString()}`);
        },
        staleTime: 30_000,
    });
}

export function useEquipmentDetail(id: string | null) {
    return useQuery({
        queryKey: ['equipment', 'detail', id],
        queryFn: () => apiClient.get<Equipment>(`/plant-hierarchy/equipment/${id}`),
        enabled: !!id,
    });
}

export function useCreateEquipment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Equipment>) =>
            apiClient.post<Equipment>('/plant-hierarchy/equipment', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['equipment'] });
        },
    });
}

export function useUpdateEquipment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Equipment> }) =>
            apiClient.patch<Equipment>(`/plant-hierarchy/equipment/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['equipment'] });
        },
    });
}

export function useUpdateEquipmentStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            apiClient.patch<Equipment>(`/plant-hierarchy/equipment/${id}/status`, { status }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['equipment'] });
        },
    });
}

// ─── Capability Hooks ──────────────────────────────────────────

export function useAddCapability() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ equipmentId, data }: { equipmentId: string; data: Partial<EquipmentCapability> }) =>
            apiClient.post<EquipmentCapability>(`/plant-hierarchy/equipment/${equipmentId}/capabilities`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['equipment'] });
        },
    });
}

export function useRemoveCapability() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (capabilityId: string) =>
            apiClient.delete(`/plant-hierarchy/equipment/capabilities/${capabilityId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['equipment'] });
        },
    });
}
