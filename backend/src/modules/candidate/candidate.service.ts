import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Candidate, CandidateStatus } from './entities/candidate.entity.js';
import { Election, ElectionStatus } from '../election/entities/election.entity.js';
import { ElectionVoter } from '../election/entities/election-voter.entity.js';
import { Employee } from '../employee/employee.entity.js';

import {
  NominateCandidateDto,
  SelfNominateDto,
  UpdateCandidateDto,
  ReviewCandidateDto,
} from './dto/candidate.dto.js';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,

    @InjectRepository(Election)
    private readonly electionRepo: Repository<Election>,

    @InjectRepository(ElectionVoter)
    private readonly voterRepo: Repository<ElectionVoter>,

    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,

    private readonly dataSource: DataSource,
  ) {}

  /* ─────────────────── Internal helpers ─────────────────── */

  private async requireElection(electionId: string): Promise<Election> {
    const election = await this.electionRepo.findOne({ where: { id: electionId } });
    if (!election) throw new NotFoundException(`Election ${electionId} not found`);
    return election;
  }

  private async requireEmployee(employeeId: string): Promise<Employee> {
    const emp = await this.employeeRepo.findOne({ where: { id: employeeId } });
    if (!emp) throw new NotFoundException(`Employee ${employeeId} not found`);
    return emp;
  }

  /**
   * Asserts the election is in a status that accepts candidate nominations.
   * Nominations are allowed in DRAFT and REGISTRATION.
   */
  private assertNominationOpen(election: Election): void {
    const allowed: ElectionStatus[] = [ElectionStatus.DRAFT, ElectionStatus.REGISTRATION];
    if (!allowed.includes(election.status)) {
      throw new BadRequestException(
        `Candidate nominations are only allowed when election is in DRAFT or REGISTRATION status. Current: ${election.status}`,
      );
    }
  }

  /**
   * Checks whether an employee is eligible to be a candidate.
   * If election_voters have been computed, the employee must be in that table.
   * Otherwise (voters not yet computed) we allow nomination — eligibility is
   * checked again at the compute-voters step.
   */
  private async assertEmployeeEligible(election: Election, employeeId: string): Promise<void> {
    if (!election.votersComputed) return; // Skip — voters not pre-computed yet

    const voterRow = await this.voterRepo.findOne({
      where: { electionId: election.id, employeeId, isEligible: true },
    });
    if (!voterRow) {
      throw new ForbiddenException(
        'This employee is not eligible to participate in this election.',
      );
    }
  }

  private async assertMaxCandidatesNotReached(election: Election): Promise<void> {
    if (election.maxCandidates === 0) return; // 0 = unlimited

    const count = await this.candidateRepo.count({
      where: {
        electionId: election.id,
        status: CandidateStatus.APPROVED,
      },
    });

    if (count >= election.maxCandidates) {
      throw new BadRequestException(
        `Election has reached the maximum number of approved candidates (${election.maxCandidates}).`,
      );
    }
  }

  /* ─────────────────── NOMINATIONS ──────────────────────── */

  /**
   * Admin nominates any employee as a candidate.
   */
  async nominateByAdmin(
    electionId: string,
    dto: NominateCandidateDto,
    nominatedByEmployeeId: string,
  ): Promise<Candidate> {
    const election = await this.requireElection(electionId);
    this.assertNominationOpen(election);

    await this.requireEmployee(dto.employeeId);
    await this.assertEmployeeEligible(election, dto.employeeId);

    const existing = await this.candidateRepo.findOne({
      where: { electionId, employeeId: dto.employeeId },
    });
    if (existing) {
      throw new ConflictException(
        `Employee is already nominated for this election (status: ${existing.status}).`,
      );
    }

    const candidate = this.candidateRepo.create({
      electionId,
      employeeId: dto.employeeId,
      statement: dto.statement ?? null,
      slogan: dto.slogan ?? null,
      photoUrl: dto.photoUrl ?? null,
      status: CandidateStatus.PENDING,
      nominatedByEmployeeId,
    });

    return this.candidateRepo.save(candidate);
  }

  /**
   * Employee nominates themselves.
   * The employee must be eligible for the election (if voters computed).
   */
  async selfNominate(
    electionId: string,
    dto: SelfNominateDto,
    employeeId: string,
  ): Promise<Candidate> {
    const election = await this.requireElection(electionId);
    this.assertNominationOpen(election);

    await this.assertEmployeeEligible(election, employeeId);

    const existing = await this.candidateRepo.findOne({
      where: { electionId, employeeId },
    });
    if (existing) {
      throw new ConflictException(
        `You are already nominated for this election (status: ${existing.status}).`,
      );
    }

    const candidate = this.candidateRepo.create({
      electionId,
      employeeId,
      statement: dto.statement ?? null,
      slogan: dto.slogan ?? null,
      photoUrl: dto.photoUrl ?? null,
      status: CandidateStatus.PENDING,
      nominatedByEmployeeId: employeeId,
    });

    return this.candidateRepo.save(candidate);
  }

  /* ─────────────────── QUERIES ───────────────────────────── */

  async findAll(
    electionId: string,
    status?: CandidateStatus,
  ): Promise<Candidate[]> {
    await this.requireElection(electionId);

    const where: any = { electionId };
    if (status) where.status = status;

    return this.candidateRepo.find({
      where,
      relations: ['employee'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(electionId: string, candidateId: string): Promise<Candidate> {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId, electionId },
      relations: ['employee', 'election'],
    });
    if (!candidate) {
      throw new NotFoundException(`Candidate ${candidateId} not found in election ${electionId}`);
    }
    return candidate;
  }

  /** Get candidacy details for the currently authenticated employee */
  async getMyCandidacy(electionId: string, employeeId: string): Promise<Candidate | null> {
    return this.candidateRepo.findOne({
      where: { electionId, employeeId },
      relations: ['election'],
    });
  }

  /* ─────────────────── UPDATES ───────────────────────────── */

  /**
   * Update campaign statement / slogan / photo.
   * Only allowed while PENDING and election is in DRAFT or REGISTRATION.
   */
  async update(
    electionId: string,
    candidateId: string,
    dto: UpdateCandidateDto,
    requestingEmployeeId: string,
    isAdmin: boolean,
  ): Promise<Candidate> {
    const candidate = await this.findOne(electionId, candidateId);

    // Only the candidate themselves or an admin can update
    if (!isAdmin && candidate.employeeId !== requestingEmployeeId) {
      throw new ForbiddenException('You can only update your own candidacy.');
    }

    if (candidate.status !== CandidateStatus.PENDING) {
      throw new BadRequestException(
        'Only PENDING candidates can update their profile. Contact an admin to reverse a review.',
      );
    }

    const election = await this.requireElection(electionId);
    this.assertNominationOpen(election);

    Object.assign(candidate, {
      statement: dto.statement ?? candidate.statement,
      slogan:    dto.slogan    ?? candidate.slogan,
      photoUrl:  dto.photoUrl  ?? candidate.photoUrl,
    });

    return this.candidateRepo.save(candidate);
  }

  /* ─────────────────── REVIEW WORKFLOW ──────────────────── */

  /**
   * Admin approves or rejects a PENDING candidacy.
   * APPROVED candidates count against maxCandidates.
   */
  async review(
    electionId: string,
    candidateId: string,
    dto: ReviewCandidateDto,
    reviewerEmployeeId: string,
  ): Promise<Candidate> {
    const candidate = await this.findOne(electionId, candidateId);

    if (candidate.status !== CandidateStatus.PENDING) {
      throw new BadRequestException(
        `Can only review PENDING candidates. Current status: ${candidate.status}`,
      );
    }

    if (dto.status === CandidateStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('A rejectionReason is required when rejecting a candidate.');
    }

    if (dto.status === CandidateStatus.APPROVED) {
      const election = await this.requireElection(electionId);
      await this.assertMaxCandidatesNotReached(election);
    }

    candidate.status              = dto.status;
    candidate.rejectionReason     = dto.rejectionReason ?? null;
    candidate.reviewedByEmployeeId = reviewerEmployeeId;
    candidate.reviewedAt          = new Date();

    return this.candidateRepo.save(candidate);
  }

  /* ─────────────────── WITHDRAWAL ───────────────────────── */

  /**
   * An employee withdraws their own candidacy.
   * Admins can also withdraw on behalf of a candidate.
   */
  async withdraw(
    electionId: string,
    candidateId: string,
    requestingEmployeeId: string,
    isAdmin: boolean,
  ): Promise<Candidate> {
    const candidate = await this.findOne(electionId, candidateId);

    if (!isAdmin && candidate.employeeId !== requestingEmployeeId) {
      throw new ForbiddenException('You can only withdraw your own candidacy.');
    }

    const withdrawable: CandidateStatus[] = [
      CandidateStatus.PENDING,
      CandidateStatus.APPROVED,
    ];
    if (!withdrawable.includes(candidate.status)) {
      throw new BadRequestException(
        `Cannot withdraw a candidacy with status ${candidate.status}.`,
      );
    }

    const election = await this.requireElection(electionId);
    if (election.status === ElectionStatus.ACTIVE || election.status === ElectionStatus.ENDED) {
      throw new BadRequestException(
        'Cannot withdraw a candidacy once the election is ACTIVE or has ENDED.',
      );
    }

    candidate.status = CandidateStatus.WITHDRAWN;
    return this.candidateRepo.save(candidate);
  }

  /* ─────────────────── DELETE (Admin only) ───────────────── */

  async remove(electionId: string, candidateId: string): Promise<void> {
    const candidate = await this.findOne(electionId, candidateId);

    const election = await this.requireElection(electionId);
    if ([ElectionStatus.ACTIVE, ElectionStatus.ENDED].includes(election.status)) {
      throw new BadRequestException(
        'Cannot delete a candidate from an ACTIVE or ENDED election.',
      );
    }

    await this.candidateRepo.remove(candidate);
  }
}
