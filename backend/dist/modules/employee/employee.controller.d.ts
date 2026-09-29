import { EmployeeService } from './employee.service.js';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto.js';
import { EmployeeStatus } from './employee.entity.js';
export declare class EmployeeController {
    private readonly service;
    constructor(service: EmployeeService);
    create(dto: CreateEmployeeDto): Promise<import("./employee.entity.js").Employee>;
    findAll(unitId?: string, status?: EmployeeStatus, positionId?: string): Promise<import("./employee.entity.js").Employee[]>;
    findOne(id: string): Promise<import("./employee.entity.js").Employee>;
    update(id: string, dto: UpdateEmployeeDto): Promise<import("./employee.entity.js").Employee>;
    remove(id: string): Promise<void>;
}
