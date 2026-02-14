import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ─── Interfaces ────────────────────────────────────────────────

export interface ProcessDefinition {
    id: string;
    code: string;
    name: string;
    productId: string;
    version: number;
    status: 'DRAFT' | 'APPROVED' | 'OBSOLETE';
    notes?: string;
    approvedBy?: string;
    approvedAt?: string;
    createdAt: string;
    updatedAt: string;
    product?: { id: string; code: string; name: string };
    steps?: ProcessStep[];
    _count?: { steps: number };
}

export interface ProcessStep {
    id: string;
    processDefinitionId: string;
    sequence: number;
    name: string;
    description?: string;
    requiredCapability?: string;
    targetWorkCenterId?: string;
    setupTimeMinutes: number;
    runTimeSecondsPerUnit: number;
    qualityCheckRequired: boolean;
    createdAt: string;
    updatedAt: string;
    targetWorkCenter?: { id: string; code: string; name: string };
    instructions?: Instruction[];
}

export interface Instruction {
    id: string;
    stepId: string;
    sequence: number;
    text: string;
    type: 'CHECK' | 'INPUT' | 'CONFIRMATION';
    mandatory: boolean;
}

// ─── Process Definition Hooks ──────────────────────────────────

export function useProcessDefinitions(productId?: string, status?: string) {
    return useQuery({
        queryKey: ['process-definitions', 'list', productId, status],
        queryFn: () => {
            const sp = new URLSearchParams();
            if (productId) sp.set('productId', productId);
            if (status) sp.set('status', status);
            return apiClient.get<ProcessDefinition[]>(`/process-definitions?${sp.toString()}`);
        },
        staleTime: 30_000,
    });
}

export function useProcessDefinition(id: string | null) {
    return useQuery({
        queryKey: ['process-definitions', 'detail', id],
        queryFn: () => apiClient.get<ProcessDefinition>(`/process-definitions/${id}`),
        enabled: !!id,
    });
}

export function useCreateProcessDefinition() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { code: string; name: string; productId: string; notes?: string }) =>
            apiClient.post<ProcessDefinition>('/process-definitions', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['process-definitions'] });
        },
    });
}

export function useUpdateProcessDefinition() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ProcessDefinition> }) =>
            apiClient.patch<ProcessDefinition>(`/process-definitions/${id}`, data),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['process-definitions', 'detail', vars.id] });
            qc.invalidateQueries({ queryKey: ['process-definitions', 'list'] });
        },
    });
}

export function useApproveProcessDefinition() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, userId }: { id: string; userId: string }) =>
            apiClient.patch<ProcessDefinition>(`/process-definitions/${id}/approve`, { userId }),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['process-definitions', 'detail', vars.id] });
            qc.invalidateQueries({ queryKey: ['process-definitions', 'list'] });
        },
    });
}

export function useCreateNewVersion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClient.post<ProcessDefinition>(`/process-definitions/${id}/new-version`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['process-definitions'] });
        },
    });
}

// ─── Process Step Hooks ────────────────────────────────────────

export function useCreateProcessStep() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ defId, data }: { defId: string; data: Partial<ProcessStep> }) =>
            apiClient.post<ProcessStep>(`/process-definitions/${defId}/steps`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['process-definitions'] });
        },
    });
}

export function useUpdateProcessStep() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ stepId, data }: { stepId: string; data: Partial<ProcessStep> }) =>
            apiClient.patch<ProcessStep>(`/process-definitions/steps/${stepId}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['process-definitions'] });
        },
    });
}

export function useDeleteProcessStep() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (stepId: string) =>
            apiClient.delete(`/process-definitions/steps/${stepId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['process-definitions'] });
        },
    });
}

export function useReorderSteps() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ defId, stepIds }: { defId: string; stepIds: string[] }) =>
            apiClient.patch(`/process-definitions/${defId}/steps/reorder`, { stepIds }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['process-definitions'] });
        },
    });
}

// ─── Instruction Hooks ─────────────────────────────────────────

export function useCreateInstruction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ stepId, data }: { stepId: string; data: Partial<Instruction> }) =>
            apiClient.post<Instruction>(`/process-definitions/steps/${stepId}/instructions`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['process-definitions'] });
        },
    });
}

export function useUpdateInstruction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ instrId, data }: { instrId: string; data: Partial<Instruction> }) =>
            apiClient.patch<Instruction>(`/process-definitions/instructions/${instrId}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['process-definitions'] });
        },
    });
}

export function useDeleteInstruction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (instrId: string) =>
            apiClient.delete(`/process-definitions/instructions/${instrId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['process-definitions'] });
        },
    });
}
