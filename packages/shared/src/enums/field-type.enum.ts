/**
 * All field types supported by the Metadata Engine.
 * The FormEngine on the frontend maps each type to a UI component.
 * The ValidationEngine on the backend maps each type to AJV rules.
 */
export enum FieldType {
    STRING = 'string',
    TEXT = 'text',       // Long text / textarea
    NUMBER = 'number',
    DECIMAL = 'decimal',
    BOOLEAN = 'boolean',
    DATE = 'date',
    DATETIME = 'datetime',
    ENUM = 'enum',
    RELATION = 'relation',   // FK to another entity
    JSON = 'json',       // Free-form JSON
    FILE = 'file',       // File attachment reference
    CURRENCY = 'currency',
    BARCODE = 'barcode',
}
