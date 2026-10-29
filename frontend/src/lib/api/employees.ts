import { api } from './client';
import {
  Employee,
  EmployeeStatus,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  CreateAccountDto,
  AssignRoleDto,
  RoleEntity,
  UserRoleScope,
} from '../types/api';

export const employeesApi = {
  // ── Employee Records ──────────────────────────────────────────────────────

  getEmployees(filters?: {
    unitId?: string;
    status?: EmployeeStatus;
    positionId?: string;
    search?: string;
  }): Promise<Employee[]> {
    return api.get<Employee[]>('/employees', { params: filters });
  },

  getEmployee(id: string): Promise<Employee> {
    return api.get<Employee>(`/employees/${id}`);
  },

  createEmployee(dto: CreateEmployeeDto): Promise<Employee> {
    return api.post<Employee>('/employees', dto);
  },

  updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    return api.patch<Employee>(`/employees/${id}`, dto);
  },

  deleteEmployee(id: string): Promise<void> {
    return api.delete<void>(`/employees/${id}`);
  },

  // ── Accounts & RBAC Roles ─────────────────────────────────────────────────

  createAccount(dto: CreateAccountDto): Promise<{ id: string; employeeId: string; email: string }> {
    return api.post('/auth/accounts', dto);
  },

  getRoles(): Promise<RoleEntity[]> {
    return api.get<RoleEntity[]>('/auth/roles');
  },

  getUserRoles(userId: string): Promise<UserRoleScope[]> {
    return api.get<UserRoleScope[]>(`/auth/users/${userId}/roles`);
  },

  assignRole(dto: AssignRoleDto): Promise<UserRoleScope> {
    return api.post<UserRoleScope>('/auth/roles/assign', dto);
  },

  revokeRole(scopeId: string): Promise<void> {
    return api.delete<void>(`/auth/roles/scopes/${scopeId}`);
  },
};

