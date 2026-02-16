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

/**
 * Legacy database role values kept for explicit mapping from Prisma enum.
 */
export enum LegacyDbUserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    OPERATOR = 'OPERATOR',
    VIEWER = 'VIEWER',
}

export const ROLE_PRIORITY: Record<UserRole, number> = {
    [UserRole.VIEWER]: 10,
    [UserRole.OPERATOR]: 20,
    [UserRole.WAREHOUSE_OPERATOR]: 20,
    [UserRole.QUALITY_MANAGER]: 30,
    [UserRole.PRODUCTION_MANAGER]: 30,
    [UserRole.ADMIN]: 40,
    [UserRole.SUPER_ADMIN]: 50,
};

export function normalizeUserRole(value: unknown): UserRole | null {
    if (typeof value !== 'string') return null;

    switch (value) {
        case UserRole.SUPER_ADMIN:
        case UserRole.ADMIN:
        case UserRole.PRODUCTION_MANAGER:
        case UserRole.QUALITY_MANAGER:
        case UserRole.WAREHOUSE_OPERATOR:
        case UserRole.OPERATOR:
        case UserRole.VIEWER:
            return value;
        case LegacyDbUserRole.ADMIN:
            return UserRole.ADMIN;
        case LegacyDbUserRole.MANAGER:
            return UserRole.PRODUCTION_MANAGER;
        case LegacyDbUserRole.OPERATOR:
            return UserRole.OPERATOR;
        case LegacyDbUserRole.VIEWER:
            return UserRole.VIEWER;
        default: {
            const lowered = value.toLowerCase();
            if (lowered in ROLE_PRIORITY) {
                return lowered as UserRole;
            }
            return null;
        }
    }
}
