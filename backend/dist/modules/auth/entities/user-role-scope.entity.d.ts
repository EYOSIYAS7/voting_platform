import { UserAccount } from './user-account.entity.js';
import { Role } from './role.entity.js';
export declare class UserRoleScope {
    id: string;
    userId: string;
    user: UserAccount;
    roleId: string;
    role: Role;
    orgUnitId: string | null;
    grantedBy: string | null;
    createdAt: Date;
}
