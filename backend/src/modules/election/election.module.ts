import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Election } from './entities/election.entity.js';
import { EligibilityRule } from './entities/eligibility-rule.entity.js';
import { ElectionVoter } from './entities/election-voter.entity.js';
import { Employee } from '../employee/employee.entity.js';
import { Candidate } from '../candidate/entities/candidate.entity.js';

import { ElectionService } from './election.service.js';
import { ElectionController } from './election.controller.js';

// OrganizationalUnitModule exports OrganizationalUnitService (with getDescendantIds)
import { OrganizationalUnitModule } from '../organizational-unit/organizational-unit.module.js';

// AuthModule exports AbilityFactory and PermissionsGuard
import { AuthModule } from '../auth/auth.module.js';
import { VotingModule } from '../voting/voting.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Election,
      EligibilityRule,
      ElectionVoter,
      Employee,
      Candidate,
    ]),
    OrganizationalUnitModule,
    AuthModule,
    forwardRef(() => VotingModule),
  ],
  providers: [ElectionService],
  controllers: [ElectionController],
  exports: [ElectionService],
})
export class ElectionModule {}
