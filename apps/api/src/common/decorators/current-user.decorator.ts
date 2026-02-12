import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '@sepenatural/shared';

/**
 * Extracts the authenticated user from the request.
 * Usage: @CurrentUser() user: AuthenticatedUser
 */
export const CurrentUser = createParamDecorator(
    (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as AuthenticatedUser;

        if (data) {
            return user?.[data];
        }

        return user;
    },
);
