var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var VotingService_1;
import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, InternalServerErrorException, Logger, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Election, ElectionStatus } from '../election/entities/election.entity.js';
import { ElectionVoter } from '../election/entities/election-voter.entity.js';
import { Candidate, CandidateStatus } from '../candidate/entities/candidate.entity.js';
import { WalletBinding, WalletBindingStatus } from '../auth/entities/wallet-binding.entity.js';
import { BlockchainService } from './blockchain.service.js';
let VotingService = VotingService_1 = class VotingService {
    electionRepo;
    voterRepo;
    candidateRepo;
    walletRepo;
    blockchain;
    dataSource;
    logger = new Logger(VotingService_1.name);
    constructor(electionRepo, voterRepo, candidateRepo, walletRepo, blockchain, dataSource) {
        this.electionRepo = electionRepo;
        this.voterRepo = voterRepo;
        this.candidateRepo = candidateRepo;
        this.walletRepo = walletRepo;
        this.blockchain = blockchain;
        this.dataSource = dataSource;
    }
    async publishElectionOnChain(electionId, dto) {
        const election = await this.requireElection(electionId);
        if (election.onChainElectionId) {
            throw new ConflictException(`Election is already published on-chain (ID: ${election.onChainElectionId})`);
        }
        if (![ElectionStatus.DRAFT, ElectionStatus.REGISTRATION, ElectionStatus.UPCOMING].includes(election.status)) {
            throw new BadRequestException(`Election must be in DRAFT, REGISTRATION, or UPCOMING status to publish. Current: ${election.status}`);
        }
        const registrationStart = election.registrationDeadline
            ? BigInt(Math.floor(new Date(election.registrationDeadline).getTime() / 1000) - 86400)
            : BigInt(Math.floor(Date.now() / 1000));
        const registrationEnd = election.registrationDeadline
            ? BigInt(Math.floor(new Date(election.registrationDeadline).getTime() / 1000))
            : BigInt(Math.floor(new Date(election.startDate).getTime() / 1000) - 60);
        const votingStart = BigInt(Math.floor(new Date(election.startDate).getTime() / 1000));
        const votingEnd = BigInt(Math.floor(new Date(election.endDate).getTime() / 1000));
        const onChainId = await this.blockchain.createElectionOnChain({
            title: election.title,
            description: election.description ?? '',
            imageUrl: dto.imageUrl ?? '',
            registrationStart,
            registrationEnd,
            votingStart,
            votingEnd,
        });
        election.onChainElectionId = onChainId.toString();
        await this.electionRepo.save(election);
        this.logger.log(`Election ${electionId} published on-chain as ID ${onChainId}`);
        return { election, onChainElectionId: onChainId.toString() };
    }
    async publishCandidateOnChain(electionId, candidateId) {
        const election = await this.requireElection(electionId);
        if (!election.onChainElectionId) {
            throw new BadRequestException('Publish the election on-chain first before publishing candidates.');
        }
        const candidate = await this.candidateRepo.findOne({
            where: { id: candidateId, electionId },
            relations: ['employee'],
        });
        if (!candidate)
            throw new NotFoundException(`Candidate ${candidateId} not found`);
        if (candidate.status !== CandidateStatus.APPROVED) {
            throw new BadRequestException(`Only APPROVED candidates can be published. Current status: ${candidate.status}`);
        }
        if (candidate.onChainCandidateIndex !== null) {
            throw new ConflictException(`Candidate is already published on-chain (index: ${candidate.onChainCandidateIndex})`);
        }
        const binding = await this.walletRepo.findOne({
            where: { employeeId: candidate.employeeId, status: WalletBindingStatus.VERIFIED },
        });
        const walletAddress = binding
            ? binding.walletAddress
            : await this.blockchain.getServerWalletAddress();
        const onChainId = await this.blockchain.addCandidateOnChain({
            onChainElectionId: BigInt(election.onChainElectionId),
            name: `${candidate.employee.firstName} ${candidate.employee.lastName}`,
            description: candidate.statement ?? '',
            imageUrl: candidate.photoUrl ?? '',
            walletAddress,
        });
        candidate.onChainCandidateIndex = Number(onChainId);
        await this.candidateRepo.save(candidate);
        this.logger.log(`Candidate ${candidateId} published on-chain as index ${onChainId}`);
        return { candidate, onChainCandidateIndex: Number(onChainId) };
    }
    async castVote(electionId, dto, employeeId) {
        const election = await this.requireElection(electionId);
        if (election.status !== ElectionStatus.ACTIVE) {
            throw new BadRequestException(`Voting is only allowed when election status is ACTIVE. Current: ${election.status}`);
        }
        if (!election.onChainElectionId) {
            throw new BadRequestException('This election has not been published on-chain yet. Contact an administrator.');
        }
        const now = new Date();
        if (now < new Date(election.startDate)) {
            throw new BadRequestException('Voting has not started yet.');
        }
        if (now > new Date(election.endDate)) {
            throw new BadRequestException('Voting has already ended.');
        }
        const candidate = await this.candidateRepo.findOne({
            where: { id: dto.candidateId, electionId },
        });
        if (!candidate)
            throw new NotFoundException(`Candidate ${dto.candidateId} not found`);
        if (candidate.status !== CandidateStatus.APPROVED) {
            throw new BadRequestException('You can only vote for an APPROVED candidate.');
        }
        if (candidate.onChainCandidateIndex === null) {
            throw new BadRequestException('This candidate has not been published on-chain yet. Contact an administrator.');
        }
        const voterRow = await this.voterRepo.findOne({
            where: { electionId, employeeId },
        });
        if (!voterRow || !voterRow.isEligible) {
            throw new ForbiddenException('You are not eligible to vote in this election. Contact an administrator if you believe this is an error.');
        }
        if (voterRow.hasVoted) {
            throw new ConflictException('You have already cast your vote in this election.');
        }
        const serverWallet = await this.blockchain.getServerWalletAddress();
        const alreadyVotedOnChain = await this.blockchain.hasVotedOnChain(BigInt(election.onChainElectionId), serverWallet);
        if (alreadyVotedOnChain) {
            this.logger.error(`On-chain hasVoted=true but DB hasVoted=false for election ${electionId}. Possible desync.`);
            throw new InternalServerErrorException('Vote state is inconsistent. Please contact an administrator.');
        }
        const txHash = await this.blockchain.castVoteOnChain({
            onChainElectionId: BigInt(election.onChainElectionId),
            onChainCandidateId: BigInt(candidate.onChainCandidateIndex),
        });
        const votedAt = new Date();
        await this.voterRepo.update({ id: voterRow.id }, { hasVoted: true, txHash, votedAt });
        this.logger.log(`Vote cast by employee ${employeeId} in election ${electionId} → tx ${txHash}`);
        return { txHash, candidateId: dto.candidateId, votedAt };
    }
    async getResults(electionId) {
        const election = await this.requireElection(electionId);
        if (!election.onChainElectionId) {
            throw new BadRequestException('Election has not been published on-chain yet.');
        }
        const onChainResults = await this.blockchain.getResultsOnChain(BigInt(election.onChainElectionId));
        const dbCandidates = await this.candidateRepo.find({
            where: { electionId, status: CandidateStatus.APPROVED },
            relations: ['employee'],
        });
        const candidateMap = new Map(dbCandidates.map((c) => [c.onChainCandidateIndex, c]));
        const totalVotes = onChainResults.reduce((sum, c) => sum + c.voteCount, 0n);
        return {
            electionId,
            onChainElectionId: election.onChainElectionId,
            title: election.title,
            status: election.status,
            totalVotes: Number(totalVotes),
            candidates: onChainResults.map((c) => {
                const dbCandidate = candidateMap.get(Number(c.id));
                return {
                    onChainCandidateIndex: Number(c.id),
                    candidateId: dbCandidate?.id ?? null,
                    name: c.name,
                    voteCount: Number(c.voteCount),
                    percentage: totalVotes > 0n
                        ? ((Number(c.voteCount) / Number(totalVotes)) * 100).toFixed(2)
                        : '0.00',
                    statement: dbCandidate?.statement ?? null,
                    photoUrl: dbCandidate?.photoUrl ?? null,
                    employee: dbCandidate?.employee
                        ? {
                            id: dbCandidate.employee.id,
                            firstName: dbCandidate.employee.firstName,
                            lastName: dbCandidate.employee.lastName,
                            email: dbCandidate.employee.email,
                        }
                        : null,
                };
            }),
        };
    }
    async verifyMyVote(electionId, employeeId) {
        await this.requireElection(electionId);
        const voterRow = await this.voterRepo.findOne({
            where: { electionId, employeeId },
        });
        if (!voterRow) {
            return { voted: false, txHash: null, votedAt: null, candidateId: null };
        }
        return {
            voted: voterRow.hasVoted,
            txHash: voterRow.txHash,
            votedAt: voterRow.votedAt,
            candidateId: null,
        };
    }
    async requireElection(electionId) {
        const election = await this.electionRepo.findOne({ where: { id: electionId } });
        if (!election)
            throw new NotFoundException(`Election ${electionId} not found`);
        return election;
    }
};
VotingService = VotingService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(Election)),
    __param(1, InjectRepository(ElectionVoter)),
    __param(2, InjectRepository(Candidate)),
    __param(3, InjectRepository(WalletBinding)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        BlockchainService,
        DataSource])
], VotingService);
export { VotingService };
//# sourceMappingURL=voting.service.js.map