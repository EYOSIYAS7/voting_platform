import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Election } from './entities/election.entity.js';
import { EligibilityRule } from './entities/eligibility-rule.entity.js';
import { ElectionVoter } from './entities/election-voter.entity.js';
import { Employee } from '../employee/employee.entity.js';

import { ElectionService } from './election.service.js';
import { ElectionController } from './election.controller.js';

// OrganizationalUnitModule exports OrganizationalUnitService (with getDescendantIds)
import { OrganizationalUnitModule } from '../organizational-unit/organizational-unit.module.js';

// AuthModule exports AbilityFactory and PermissionsGuard
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Election, EligibilityRule, ElectionVoter, Employee]),
    OrganizationalUnitModule,
    AuthModule,
  ],
  providers: [ElectionService],
  controllers: [ElectionController],
  exports: [ElectionService],
})
export class ElectionModule {}
