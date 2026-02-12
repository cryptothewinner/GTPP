import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { EntityFormSchemaResponse } from '@sepenatural/shared';

export function useEntitySchema(entitySlug: string | null) {
    return useQuery({
        queryKey: ['metadata', 'entity-schema', entitySlug],
        queryFn: () =>
            apiClient.get<EntityFormSchemaResponse>(`/metadata/${entitySlug}`),
        enabled: !!entitySlug,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes — metadata rarely changes
        gcTime: 30 * 60 * 1000,
    });
}
