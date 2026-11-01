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

@Module({
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
export class EmployeeModule {}
