import { UserRole } from '../enums/user-role.enum';

export interface JwtPayload {
    sub: string;        // User ID
    email: string;
    role: UserRole;
    tenantId?: string;
    iat?: number;
    exp?: number;
}

export interface AuthenticatedUser {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
}
