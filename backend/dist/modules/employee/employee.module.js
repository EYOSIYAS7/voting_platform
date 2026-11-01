var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employee.entity.js';
import { EmployeeService } from './employee.service.js';
import { EmployeeController } from './employee.controller.js';
import { Position } from '../position/position.entity.js';
import { OrganizationalUnit } from '../organizational-unit/organizational-unit.entity.js';
import { UserAccount } from '../auth/entities/user-account.entity.js';
import { Role } from '../auth/entities/role.entity.js';
import { UserRoleScope } from '../auth/entities/user-role-scope.entity.js';
let EmployeeModule = class EmployeeModule {
};
EmployeeModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forFeature([
                Employee,
                Position,
                OrganizationalUnit,
                UserAccount,
                Role,
                UserRoleScope,
            ]),
        ],
        controllers: [EmployeeController],
        providers: [EmployeeService],
        exports: [EmployeeService],
    })
], EmployeeModule);
export { EmployeeModule };
//# sourceMappingURL=employee.module.js.map