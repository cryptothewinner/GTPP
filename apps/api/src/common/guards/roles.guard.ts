import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_PRIORITY, UserRole, normalizeUserRole } from '@sepenatural/shared';

export const ROLES_KEY = 'roles';

export type RbacRole = `${UserRole}`;

/**
 * Decorator to set required roles on a route handler.
 * Usage: @Roles('admin', 'production_manager')
 */
export const Roles = (...roles: RbacRole[]) => SetMetadata(ROLES_KEY, roles);

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
        const currentRole = normalizeUserRole(user?.role);

        if (!currentRole) {
            return false;
        }

        const currentPriority = ROLE_PRIORITY[currentRole];
        return requiredRoles.some((requiredRole) => currentPriority >= ROLE_PRIORITY[requiredRole]);
    }
}
