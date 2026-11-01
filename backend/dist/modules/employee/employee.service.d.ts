import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Employee, EmployeeStatus } from './employee.entity.js';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto.js';
import { Position } from '../position/position.entity.js';
import { OrganizationalUnit } from '../organizational-unit/organizational-unit.entity.js';
import { UserAccount } from '../auth/entities/user-account.entity.js';
import { Role } from '../auth/entities/role.entity.js';
import { UserRoleScope } from '../auth/entities/user-role-scope.entity.js';
export declare class EmployeeService implements OnApplicationBootstrap {
    private readonly repo;
    private readonly positionRepo;
    private readonly unitRepo;
    private readonly accountRepo;
    private readonly roleRepo;
    private readonly scopeRepo;
    constructor(repo: Repository<Employee>, positionRepo: Repository<Position>, unitRepo: Repository<OrganizationalUnit>, accountRepo: Repository<UserAccount>, roleRepo: Repository<Role>, scopeRepo: Repository<UserRoleScope>);
    onApplicationBootstrap(): Promise<void>;
    syncRoleAndScopeForEmployee(employeeId: string, grantedBy?: string): Promise<void>;
    create(dto: CreateEmployeeDto): Promise<Employee>;
    findAll(filters?: {
        unitId?: string;
        status?: EmployeeStatus;
        positionId?: string;
        search?: string;
    }): Promise<Employee[]>;
    findByUnitIds(unitIds: string[], status?: EmployeeStatus): Promise<Employee[]>;
    findOne(id: string): Promise<Employee>;
    findByEmail(email: string): Promise<Employee | null>;
    findByEmployeeId(employeeId: string): Promise<Employee | null>;
    update(id: string, dto: UpdateEmployeeDto): Promise<Employee>;
    remove(id: string): Promise<void>;
}
