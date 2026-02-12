import { FieldType } from '../enums/field-type.enum';

// ─── Field-Level UI Hints ────────────────────────────────────
export interface FieldUIConfig {
    /** Which UI component the FormEngine should render */
    component:
    | 'input'
    | 'textarea'
    | 'number-input'
    | 'currency-input'
    | 'date-picker'
    | 'datetime-picker'
    | 'select'
    | 'searchable-select'
    | 'multi-select'
    | 'checkbox'
    | 'toggle'
    | 'status-badge-select'
    | 'file-upload'
    | 'barcode-scanner'
    | 'json-editor';
    placeholder?: string;
    /** Layout width: 'full' | 'half' | 'third' | 'quarter' */
    width: 'full' | 'half' | 'third' | 'quarter';
    readOnly?: boolean;
    hidden?: boolean;
    helpText?: string;
    prefix?: string;   // e.g. "₺" for currency
    suffix?: string;   // e.g. "kg" for weight
    rows?: number;     // For textarea
    minDate?: string;  // 'today' | ISO string
    maxDate?: string;
}

// ─── Enum Option ─────────────────────────────────────────────
export interface EnumOption {
    value: string;
    label: string;
    color?: string;
    icon?: string;
}

// ─── Relation Config ─────────────────────────────────────────
export interface RelationConfig {
    /** Target entity slug (e.g., 'product') */
    entity: string;
    /** Which field to display in dropdowns */
    displayField: string;
    /** Which field to store as value (usually 'id') */
    valueField: string;
    /** If true, allow creating new items inline */
    allowCreate?: boolean;
    /** Optional filter to apply when loading options */
    filter?: Record<string, unknown>;
}

// ─── Netsis Field Mapping ────────────────────────────────────
export interface NetsisFieldMapping {
    /** Column name in the Netsis table */
    netsisField: string;
    /** Transform function name to apply during sync */
    transform?: string;
}

// ─── Field Definition ────────────────────────────────────────
/**
 * A single field inside an EntityDefinition schema.
 * This is the atomic unit of the Metadata Engine.
 */
export interface FieldDefinition {
    /** Internal field name (camelCase, used as form key) */
    name: string;
    /** Human-readable label (Turkish) */
    label: string;
    /** Data type — drives both validation and UI rendering */
    type: FieldType;

    // ── Validation ──
    required?: boolean;
    unique?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    precision?: number;
    pattern?: string;
    defaultValue?: unknown;

    // ── Enum-specific ──
    options?: EnumOption[];

    // ── Relation-specific ──
    relation?: RelationConfig;

    // ── Layout & Grouping ──
    displayOrder: number;
    group: string;

    // ── UI Rendering ──
    ui: FieldUIConfig;

    // ── Netsis Integration ──
    netsisMapping?: NetsisFieldMapping;
}

// ─── Field Group ─────────────────────────────────────────────
export interface FieldGroup {
    key: string;
    label: string;
    order: number;
    collapsible?: boolean;
    description?: string;
}

// ─── List/Grid View Config ───────────────────────────────────
export interface ListColumnConfig {
    field: string;
    header: string;
    width?: number;
    pinned?: 'left' | 'right';
    sortable?: boolean;
    cellRenderer?: string;
    valueFormatter?: string;
}

export interface ListFilterConfig {
    field: string;
    type: 'text' | 'number-range' | 'date-range' | 'multi-select' | 'boolean';
}

export interface ListViewConfig {
    defaultSort: { field: string; direction: 'asc' | 'desc' };
    searchableFields: string[];
    columns: ListColumnConfig[];
    filters: ListFilterConfig[];
    pageSize?: number;
}

// ─── Permissions Block ───────────────────────────────────────
export interface EntityPermissions {
    create: string[];
    read: string[];
    update: string[];
    delete: string[];
}

// ─── Lifecycle Hooks ─────────────────────────────────────────
export interface EntityHooks {
    beforeCreate?: string[];
    afterCreate?: string[];
    beforeUpdate?: string[];
    afterUpdate?: string[];
    beforeDelete?: string[];
    afterDelete?: string[];
}

// ─── Netsis Entity-Level Mapping ─────────────────────────────
export interface NetsisEntityMapping {
    enabled: boolean;
    netsisTable: string;
    syncDirection: 'to_netsis' | 'from_netsis' | 'bidirectional';
    syncSchedule?: string; // cron expression
}

// ─── Complete Entity Schema ──────────────────────────────────
/**
 * The root JSON object stored in EntityDefinition.schema.
 * This is the single source of truth for how an entity behaves
 * across the entire system: Form, Grid, Validation, Sync.
 */
export interface EntitySchema {
    /** Human-readable name */
    displayName: string;
    /** Description (shown in admin panel) */
    description: string;
    /** Schema version — enables safe migration */
    version: number;
    /** Underlying DB table (for dynamic entities) */
    tableName?: string;

    /** Netsis ERP mapping config */
    netsisMapping?: NetsisEntityMapping;

    /** All field definitions */
    fields: FieldDefinition[];

    /** Logical grouping for form layout */
    fieldGroups: FieldGroup[];

    /** AG Grid / list configuration */
    listView: ListViewConfig;

    /** RBAC permissions */
    permissions: EntityPermissions;

    /** Lifecycle hooks (event names) */
    hooks?: EntityHooks;
}
