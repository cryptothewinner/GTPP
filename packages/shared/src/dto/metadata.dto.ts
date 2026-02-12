export interface FieldDefinition {
    key: string;
    name?: string; // Legacy support
    label: string;
    group?: string; // Legacy support
    type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'textarea' | 'readonly';
    required?: boolean;
    readonly?: boolean;
    placeholder?: string;
    defaultValue?: unknown;
    min?: number;
    max?: number;
    options?: { label: string; value: string | number | boolean }[];
    gridVisible?: boolean;
    gridWidth?: number;
    gridPinned?: 'left' | 'right' | null;
    ui?: {
        component?: string;
        width?: 'full' | 'half' | 'third' | 'quarter';
        hidden?: boolean;
        props?: Record<string, any>;
        helpText?: string;
    };
    order?: number;
    section?: string;
    tooltip?: string;
    validation?: {
        pattern?: string;
        patternMessage?: string;
        minLength?: number;
        maxLength?: number;
    };
}

export interface FieldGroup {
    key: string;
    label: string;
    description?: string;
    order?: number;
}

export interface EntityDefinitionDto {
    id: string;
    slug: string;
    name: string;
    displayName: string;
    description?: string;
    icon?: string;
    fields: FieldDefinition[];
    fieldGroups: FieldGroup[];
    createdAt: string;
    updatedAt: string;
}
