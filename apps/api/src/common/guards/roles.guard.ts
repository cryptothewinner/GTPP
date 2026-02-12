import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@sepenatural/shared';

export const ROLES_KEY = 'roles';

/**
 * Decorator to set required roles on a route handler.
 * Usage: @Roles('admin', 'production_manager')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Guard that checks if the authenticated user has
 * at least one of the required roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are specified, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.roles) {
            return false;
        }

        // super_admin bypasses all role checks
        if (user.roles.includes('super_admin')) {
            return true;
        }

        return requiredRoles.some((role) => user.roles.includes(role));
    }
}
