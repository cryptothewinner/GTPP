import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';

export type RbacRole =
    | 'super_admin'
    | 'admin'
    | 'production_manager'
    | 'quality_manager'
    | 'warehouse_operator'
    | 'operator'
    | 'viewer';

/**
 * Decorator to set required roles on a route handler.
 * Usage: @Roles('admin', 'production_manager')
 */
export const Roles = (...roles: RbacRole[]) => SetMetadata(ROLES_KEY, roles);

const ROLE_PRIORITY: Record<RbacRole, number> = {
    viewer: 10,
    operator: 20,
    warehouse_operator: 20,
    quality_manager: 30,
    production_manager: 30,
    admin: 40,
    super_admin: 50,
};

function normalizeRole(value: unknown): RbacRole | null {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.toLowerCase();

    if (normalized in ROLE_PRIORITY) {
        return normalized as RbacRole;
    }

    // Backward compatibility for Prisma role names.
    if (normalized === 'manager') return 'production_manager';
    if (normalized === 'viewer') return 'viewer';
    if (normalized === 'operator') return 'operator';
    if (normalized === 'admin') return 'admin';

    return null;
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<RbacRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        const currentRole = normalizeRole(user?.role);

        if (!currentRole) {
            return false;
        }

        const currentPriority = ROLE_PRIORITY[currentRole];
        return requiredRoles.some((requiredRole) => currentPriority >= ROLE_PRIORITY[requiredRole]);
    }
}
