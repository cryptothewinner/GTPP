'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { EntitySchema, FieldDefinition, FieldGroup, EntityPermissions } from '@sepe/shared';

interface FormSchemaResponse {
    entitySlug: string;
    displayName: string;
    fields: FieldDefinition[];
    fieldGroups: FieldGroup[];
    permissions: EntityPermissions;
}

/**
 * Hook to fetch the form schema for a metadata-defined entity.
 * Used by the DynamicFormEngine to know HOW to render a form.
 *
 * @example
 * const { schema, isLoading } = useEntityFormSchema('production-order');
 * // schema.fields → array of FieldDefinition
 * // schema.fieldGroups → logical groupings for form sections
 */
export function useEntityFormSchema(entitySlug: string) {
    const query = useQuery({
        queryKey: ['entity-schema', entitySlug, 'form'],
        queryFn: () =>
            api.get<FormSchemaResponse>(`/metadata/entities/${entitySlug}/form`),
        staleTime: 5 * 60 * 1000,  // Schema rarely changes — cache 5 minutes
        gcTime: 30 * 60 * 1000,
        enabled: !!entitySlug,
    });

    return {
        schema: query.data,
        isLoading: query.isLoading,
        error: query.error,
    };
}

/**
 * Hook to fetch all entity definitions for navigation.
 */
export function useEntityList() {
    return useQuery({
        queryKey: ['entity-list'],
        queryFn: () =>
            api.get<
                Array<{
                    slug: string;
                    displayName: string;
                    icon: string | null;
                    module: string | null;
                }>
            >('/metadata/entities'),
        staleTime: 10 * 60 * 1000,
    });
}
