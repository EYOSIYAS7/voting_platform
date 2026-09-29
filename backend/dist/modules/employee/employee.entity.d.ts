import { OrganizationalUnit } from '../organizational-unit/organizational-unit.entity.js';
import { Position } from '../position/position.entity.js';
export declare enum EmployeeStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    PENDING = "PENDING",
    TERMINATED = "TERMINATED"
}
export declare class Employee {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    organizationalUnitId: string;
    organizationalUnit: OrganizationalUnit;
    positionId: string;
    position: Position;
    status: EmployeeStatus;
    profileImageUrl: string;
    hiredAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
