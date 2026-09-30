import { SystemRole } from '../../modules/auth/entities/role.entity.js';
export interface JwtPayload {
    sub: string;
    employeeId: string;
    email: string;
    roles: SystemRole[];
    scopes: Array<{
        roleId: string;
        orgUnitId: string | null;
    }>;
    mustChangePassword: boolean;
}
export interface AuthenticatedUser {
    userId: string;
    employeeId: string;
    email: string;
    roles: SystemRole[];
    scopes: Array<{
        roleId: string;
        orgUnitId: string | null;
    }>;
    mustChangePassword: boolean;
}
