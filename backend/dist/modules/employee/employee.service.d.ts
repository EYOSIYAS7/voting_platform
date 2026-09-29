import { Repository } from 'typeorm';
import { Employee, EmployeeStatus } from './employee.entity.js';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto.js';
export declare class EmployeeService {
    private readonly repo;
    constructor(repo: Repository<Employee>);
    create(dto: CreateEmployeeDto): Promise<Employee>;
    findAll(filters?: {
        unitId?: string;
        status?: EmployeeStatus;
        positionId?: string;
    }): Promise<Employee[]>;
    findByUnitIds(unitIds: string[], status?: EmployeeStatus): Promise<Employee[]>;
    findOne(id: string): Promise<Employee>;
    findByEmail(email: string): Promise<Employee | null>;
    findByEmployeeId(employeeId: string): Promise<Employee | null>;
    update(id: string, dto: UpdateEmployeeDto): Promise<Employee>;
    remove(id: string): Promise<void>;
}
