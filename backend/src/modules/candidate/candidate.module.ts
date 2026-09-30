import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Candidate } from './entities/candidate.entity.js';
import { Election } from '../election/entities/election.entity.js';
import { ElectionVoter } from '../election/entities/election-voter.entity.js';
import { Employee } from '../employee/employee.entity.js';

import { CandidateService } from './candidate.service.js';
import { CandidateController } from './candidate.controller.js';

// AuthModule exports AbilityFactory and PermissionsGuard
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate, Election, ElectionVoter, Employee]),
    AuthModule,
  ],
  providers: [CandidateService],
  controllers: [CandidateController],
  exports: [CandidateService],
})
export class CandidateModule {}
