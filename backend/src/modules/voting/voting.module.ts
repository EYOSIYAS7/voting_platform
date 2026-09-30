import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Election } from '../election/entities/election.entity.js';
import { ElectionVoter } from '../election/entities/election-voter.entity.js';
import { Candidate } from '../candidate/entities/candidate.entity.js';
import { WalletBinding } from '../auth/entities/wallet-binding.entity.js';

import { BlockchainService } from './blockchain.service.js';
import { VotingService } from './voting.service.js';
import { VotingController } from './voting.controller.js';

import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Election, ElectionVoter, Candidate, WalletBinding]),
    AuthModule,
  ],
  providers: [BlockchainService, VotingService],
  controllers: [VotingController],
  exports: [BlockchainService, VotingService],
})
export class VotingModule {}
