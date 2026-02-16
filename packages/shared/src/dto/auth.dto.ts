import type { LegacyDbUserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
    id: string;
    email: string;
    fullName: string;
    role: LegacyDbUserRole;
}
