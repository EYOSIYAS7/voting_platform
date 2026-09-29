import { EmployeeStatus } from '../employee.entity.js';
export declare class CreateEmployeeDto {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    organizationalUnitId: string;
    positionId?: string;
    status?: EmployeeStatus;
    hiredAt?: string;
    profileImageUrl?: string;
}
export declare class UpdateEmployeeDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    organizationalUnitId?: string;
    positionId?: string;
    status?: EmployeeStatus;
    hiredAt?: string;
    profileImageUrl?: string;
}
