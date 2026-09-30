var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let VotingModule = class VotingModule {
};
VotingModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forFeature([Election, ElectionVoter, Candidate, WalletBinding]),
            AuthModule,
        ],
        providers: [BlockchainService, VotingService],
        controllers: [VotingController],
        exports: [BlockchainService, VotingService],
    })
], VotingModule);
export { VotingModule };
//# sourceMappingURL=voting.module.js.map