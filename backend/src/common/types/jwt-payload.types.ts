import { SystemRole } from '../../modules/auth/entities/role.entity.js';

export interface JwtPayload {
  /** UserAccount.id */
  sub: string;

  /** Employee.id */
  employeeId: string;

  /** Employee.email */
  email: string;

  /** All role names assigned to this user */
  roles: SystemRole[];

  /**
   * Scoped role assignments:
   * { roleId: string; orgUnitId: string | null }[]
   * Used by CASL to build fine-grained abilities.
   */
  scopes: Array<{ roleId: string; orgUnitId: string | null }>;

  /** Whether the user must change their password before doing anything else */
  mustChangePassword: boolean;
}

export interface AuthenticatedUser {
  userId: string;
  employeeId: string;
  email: string;
  roles: SystemRole[];
  scopes: Array<{ roleId: string; orgUnitId: string | null }>;
  mustChangePassword: boolean;
}
