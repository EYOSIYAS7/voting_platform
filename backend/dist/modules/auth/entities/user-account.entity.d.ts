import { Employee } from '../../employee/employee.entity.js';
export declare class UserAccount {
    id: string;
    employeeId: string;
    employee: Employee;
    passwordHash: string;
    mustChangePassword: boolean;
    isActive: boolean;
    failedLoginCount: number;
    lockedUntil: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
