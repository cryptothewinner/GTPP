/**
 * System-wide roles aligned with manufacturing hierarchy.
 * Permissions are enforced at both API (guard) and UI (metadata) levels.
 */
export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    ADMIN = 'admin',
    PRODUCTION_MANAGER = 'production_manager',
    QUALITY_MANAGER = 'quality_manager',
    WAREHOUSE_OPERATOR = 'warehouse_operator',
    OPERATOR = 'operator',
    VIEWER = 'viewer',
}
