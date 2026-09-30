import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import type { Address } from 'viem';

import { Election, ElectionStatus } from '../election/entities/election.entity.js';
import { ElectionVoter } from '../election/entities/election-voter.entity.js';
import { Candidate, CandidateStatus } from '../candidate/entities/candidate.entity.js';
import { WalletBinding, WalletBindingStatus } from '../auth/entities/wallet-binding.entity.js';

import { BlockchainService } from './blockchain.service.js';
import { CastVoteDto, PublishElectionDto } from './dto/voting.dto.js';

@Injectable()
export class VotingService {
  private readonly logger = new Logger(VotingService.name);

  constructor(
    @InjectRepository(Election)
    private readonly electionRepo: Repository<Election>,

    @InjectRepository(ElectionVoter)
    private readonly voterRepo: Repository<ElectionVoter>,

    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,

    @InjectRepository(WalletBinding)
    private readonly walletRepo: Repository<WalletBinding>,

    private readonly blockchain: BlockchainService,
    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────── Publish election on-chain ─────────────────────────────

  /**
   * Publishes a UPCOMING or ACTIVE election to the blockchain.
   * Stores the returned on-chain ID in election.onChainElectionId.
   * Must be called before any votes can be cast.
   */
  async publishElectionOnChain(
    electionId: string,
    dto: PublishElectionDto,
  ): Promise<{ election: Election; onChainElectionId: string }> {
    const election = await this.requireElection(electionId);

    if (election.onChainElectionId) {
      throw new ConflictException(
        `Election is already published on-chain (ID: ${election.onChainElectionId})`,
      );
    }

    if (![ElectionStatus.DRAFT, ElectionStatus.REGISTRATION, ElectionStatus.UPCOMING].includes(election.status)) {
      throw new BadRequestException(
        `Election must be in DRAFT, REGISTRATION, or UPCOMING status to publish. Current: ${election.status}`,
      );
    }

    const registrationStart = election.registrationDeadline
      ? BigInt(Math.floor(new Date(election.registrationDeadline).getTime() / 1000) - 86400)
      : BigInt(Math.floor(Date.now() / 1000));

    const registrationEnd = election.registrationDeadline
      ? BigInt(Math.floor(new Date(election.registrationDeadline).getTime() / 1000))
      : BigInt(Math.floor(new Date(election.startDate).getTime() / 1000) - 60);

    const votingStart = BigInt(Math.floor(new Date(election.startDate).getTime() / 1000));
    const votingEnd   = BigInt(Math.floor(new Date(election.endDate).getTime() / 1000));

    const onChainId = await this.blockchain.createElectionOnChain({
      title:             election.title,
      description:       election.description ?? '',
      imageUrl:          dto.imageUrl ?? '',
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

  // ─────────────────── Publish candidate on-chain ────────────────────────────

  /**
   * Publishes a single APPROVED candidate to the blockchain.
   * The candidate's bound wallet address is used as their on-chain identity.
   * Stores the returned on-chain candidate index in candidate.onChainCandidateIndex.
   */
  async publishCandidateOnChain(
    electionId: string,
    candidateId: string,
  ): Promise<{ candidate: Candidate; onChainCandidateIndex: number }> {
    const election = await this.requireElection(electionId);

    if (!election.onChainElectionId) {
      throw new BadRequestException(
        'Publish the election on-chain first before publishing candidates.',
      );
    }

    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId, electionId },
      relations: ['employee'],
    });
    if (!candidate) throw new NotFoundException(`Candidate ${candidateId} not found`);

    if (candidate.status !== CandidateStatus.APPROVED) {
      throw new BadRequestException(
        `Only APPROVED candidates can be published. Current status: ${candidate.status}`,
      );
    }

    if (candidate.onChainCandidateIndex !== null) {
      throw new ConflictException(
        `Candidate is already published on-chain (index: ${candidate.onChainCandidateIndex})`,
      );
    }

    // Get the candidate's bound wallet
    const binding = await this.walletRepo.findOne({
      where: { employeeId: candidate.employeeId, status: WalletBindingStatus.VERIFIED },
    });

    // Use server wallet as fallback if candidate has no wallet bound yet
    const walletAddress: Address = binding
      ? (binding.walletAddress as Address)
      : await this.blockchain.getServerWalletAddress();

    const onChainId = await this.blockchain.addCandidateOnChain({
      onChainElectionId: BigInt(election.onChainElectionId),
      name:              `${candidate.employee.firstName} ${candidate.employee.lastName}`,
      description:       candidate.statement ?? '',
      imageUrl:          candidate.photoUrl ?? '',
      walletAddress,
    });

    candidate.onChainCandidateIndex = Number(onChainId);
    await this.candidateRepo.save(candidate);

    this.logger.log(`Candidate ${candidateId} published on-chain as index ${onChainId}`);
    return { candidate, onChainCandidateIndex: Number(onChainId) };
  }

  // ─────────────────── Cast vote ─────────────────────────────────────────────

  /**
   * Server-relay vote casting pipeline:
   *
   * 1. Verify election is ACTIVE and has an on-chain ID
   * 2. Verify candidate is APPROVED and has an on-chain index
   * 3. Verify employee is eligible (election_voters lookup)
   * 4. Verify employee has not already voted (DB + on-chain double check)
   * 5. Call vote() on-chain using server relay wallet
   * 6. Record txHash, hasVoted=true, votedAt in election_voters
   */
  async castVote(
    electionId: string,
    dto: CastVoteDto,
    employeeId: string,
  ): Promise<{ txHash: string; candidateId: string; votedAt: Date }> {
    // ── 1. Election checks ──────────────────────────────────────────────────
    const election = await this.requireElection(electionId);

    if (election.status !== ElectionStatus.ACTIVE) {
      throw new BadRequestException(
        `Voting is only allowed when election status is ACTIVE. Current: ${election.status}`,
      );
    }

    if (!election.onChainElectionId) {
      throw new BadRequestException(
        'This election has not been published on-chain yet. Contact an administrator.',
      );
    }

    const now = new Date();
    if (now < new Date(election.startDate)) {
      throw new BadRequestException('Voting has not started yet.');
    }
    if (now > new Date(election.endDate)) {
      throw new BadRequestException('Voting has already ended.');
    }

    // ── 2. Candidate checks ─────────────────────────────────────────────────
    const candidate = await this.candidateRepo.findOne({
      where: { id: dto.candidateId, electionId },
    });
    if (!candidate) throw new NotFoundException(`Candidate ${dto.candidateId} not found`);

    if (candidate.status !== CandidateStatus.APPROVED) {
      throw new BadRequestException('You can only vote for an APPROVED candidate.');
    }

    if (candidate.onChainCandidateIndex === null) {
      throw new BadRequestException(
        'This candidate has not been published on-chain yet. Contact an administrator.',
      );
    }

    // ── 3. Eligibility check ────────────────────────────────────────────────
    const voterRow = await this.voterRepo.findOne({
      where: { electionId, employeeId },
    });

    if (!voterRow || !voterRow.isEligible) {
      throw new ForbiddenException(
        'You are not eligible to vote in this election. Contact an administrator if you believe this is an error.',
      );
    }

    // ── 4. Double-vote prevention (DB) ──────────────────────────────────────
    if (voterRow.hasVoted) {
      throw new ConflictException('You have already cast your vote in this election.');
    }

    // ── 4b. Double-vote prevention (on-chain, as safety net) ────────────────
    const serverWallet = await this.blockchain.getServerWalletAddress();
    const alreadyVotedOnChain = await this.blockchain.hasVotedOnChain(
      BigInt(election.onChainElectionId),
      serverWallet,
    );
    // Note: the server wallet votes for ALL employees, so this check is a
    // belt-and-suspenders guard — the DB hasVoted flag is the primary source.
    // If the contract returns true AND DB says false, something is desynchronised.
    if (alreadyVotedOnChain) {
      this.logger.error(
        `On-chain hasVoted=true but DB hasVoted=false for election ${electionId}. Possible desync.`,
      );
      throw new InternalServerErrorException(
        'Vote state is inconsistent. Please contact an administrator.',
      );
    }

    // ── 5. Submit on-chain ──────────────────────────────────────────────────
    const txHash = await this.blockchain.castVoteOnChain({
      onChainElectionId:  BigInt(election.onChainElectionId),
      onChainCandidateId: BigInt(candidate.onChainCandidateIndex),
    });

    // ── 6. Record in DB ─────────────────────────────────────────────────────
    const votedAt = new Date();
    await this.voterRepo.update(
      { id: voterRow.id },
      { hasVoted: true, txHash, votedAt },
    );

    this.logger.log(
      `Vote cast by employee ${employeeId} in election ${electionId} → tx ${txHash}`,
    );

    return { txHash, candidateId: dto.candidateId, votedAt };
  }

  // ─────────────────── Results ───────────────────────────────────────────────

  /**
   * Fetches live vote counts from the blockchain and enriches them with DB candidate info.
   */
  async getResults(electionId: string) {
    const election = await this.requireElection(electionId);

    if (!election.onChainElectionId) {
      throw new BadRequestException('Election has not been published on-chain yet.');
    }

    const onChainResults = await this.blockchain.getResultsOnChain(
      BigInt(election.onChainElectionId),
    ) as any[];

    // Enrich with DB candidate data (name, statement, photoUrl already in DB)
    const dbCandidates = await this.candidateRepo.find({
      where: { electionId, status: CandidateStatus.APPROVED },
      relations: ['employee'],
    });

    const candidateMap = new Map(
      dbCandidates.map((c) => [c.onChainCandidateIndex, c]),
    );

    const totalVotes = onChainResults.reduce(
      (sum: bigint, c: any) => sum + (c.voteCount as bigint),
      0n,
    );

    return {
      electionId,
      onChainElectionId:  election.onChainElectionId,
      title:              election.title,
      status:             election.status,
      totalVotes:         Number(totalVotes),
      candidates: onChainResults.map((c: any) => {
        const dbCandidate = candidateMap.get(Number(c.id));
        return {
          onChainCandidateIndex: Number(c.id),
          candidateId:           dbCandidate?.id ?? null,
          name:                  c.name,
          voteCount:             Number(c.voteCount),
          percentage:            totalVotes > 0n
            ? ((Number(c.voteCount) / Number(totalVotes)) * 100).toFixed(2)
            : '0.00',
          statement:  dbCandidate?.statement ?? null,
          photoUrl:   dbCandidate?.photoUrl ?? null,
          employee: dbCandidate?.employee
            ? {
                id:        dbCandidate.employee.id,
                firstName: dbCandidate.employee.firstName,
                lastName:  dbCandidate.employee.lastName,
                email:     dbCandidate.employee.email,
              }
            : null,
        };
      }),
    };
  }

  // ─────────────────── Verify own vote ──────────────────────────────────────

  /**
   * Returns the employee's vote proof: their txHash and the candidate they voted for.
   * Only the employee who voted can retrieve this.
   */
  async verifyMyVote(electionId: string, employeeId: string) {
    await this.requireElection(electionId);

    const voterRow = await this.voterRepo.findOne({
      where: { electionId, employeeId },
    });

    if (!voterRow) {
      return { voted: false, txHash: null, votedAt: null, candidateId: null };
    }

    return {
      voted:      voterRow.hasVoted,
      txHash:     voterRow.txHash,
      votedAt:    voterRow.votedAt,
      candidateId: null, // We intentionally do NOT expose which candidate they voted for
    };
  }

  // ─────────────────── Private helpers ───────────────────────────────────────

  private async requireElection(electionId: string): Promise<Election> {
    const election = await this.electionRepo.findOne({ where: { id: electionId } });
    if (!election) throw new NotFoundException(`Election ${electionId} not found`);
    return election;
  }
}
