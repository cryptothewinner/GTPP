export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';

export interface AuthenticatedUser {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
}
