'use client';

import { useEntityFormSchema } from '@/hooks/use-entity-schema';
import type { FieldDefinition, FieldGroup } from '@sepenatural/shared';

interface DynamicFormEngineProps {
    entitySlug: string;
    recordId?: string;
    onSubmit?: (data: Record<string, unknown>) => void;
}

/**
 * DynamicFormEngine — Renders forms entirely from metadata.
 *
 * This is a PLACEHOLDER for Phase 2 implementation.
 * The full engine will:
 * 1. Fetch the form schema from /metadata/entities/:slug/form
 * 2. Group fields by fieldGroups
 * 3. Render each field using the appropriate Shadcn/UI component
 * 4. Handle validation (client-side + server-side)
 * 5. Manage form state with react-hook-form
 */
export function DynamicFormEngine({
    entitySlug,
    recordId,
    onSubmit,
}: DynamicFormEngineProps) {
    const { schema, isLoading, error } = useEntityFormSchema(entitySlug);

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4 p-6">
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="h-10 bg-gray-200 rounded w-full" />
                <div className="h-10 bg-gray-200 rounded w-full" />
                <div className="h-10 bg-gray-200 rounded w-2/3" />
            </div>
        );
    }

    if (error || !schema) {
        return (
            <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
                <p className="text-red-800">
                    Şema yüklenemedi: {entitySlug}
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">
                {schema.displayName}
                {recordId ? ' — Düzenle' : ' — Yeni Kayıt'}
            </h2>

            {/* Render field groups */}
            {schema.fieldGroups.map((group: FieldGroup) => (
                <fieldset key={group.key} className="border rounded-lg p-4">
                    <legend className="text-lg font-semibold px-2">
                        {group.label}
                    </legend>

                    <div className="grid grid-cols-12 gap-4 mt-4">
                        {schema.fields
                            .filter((f: FieldDefinition) => f.group === group.key)
                            .map((field: FieldDefinition) => (
                                <div
                                    key={field.name}
                                    className={getWidthClass(field.ui?.width)}
                                >
                                    {/* Phase 2: Replace with actual form components */}
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.label}
                                        {field.required && (
                                            <span className="text-red-500 ml-1">*</span>
                                        )}
                                    </label>
                                    <div className="h-10 bg-gray-100 rounded border border-gray-300 flex items-center px-3 text-sm text-gray-400">
                                        [{field.type}] {field.ui?.component}
                                    </div>
                                    {field.ui?.helpText && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {field.ui?.helpText}
                                        </p>
                                    )}
                                </div>
                            ))}
                    </div>
                </fieldset>
            ))}

            {/* Phase 2: Submit button */}
            <div className="flex justify-end pt-4">
                <button
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    onClick={() => onSubmit?.({})}
                >
                    Kaydet
                </button>
            </div>
        </div>
    );
}

function getWidthClass(width: string | undefined): string {
    if (!width) return 'col-span-12';
    switch (width) {
        case 'full': return 'col-span-12';
        case 'half': return 'col-span-6';
        case 'third': return 'col-span-4';
        case 'quarter': return 'col-span-3';
        default: return 'col-span-12';
    }
}
