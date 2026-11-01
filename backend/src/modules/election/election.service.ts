import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
  Inject,
  forwardRef,
  OnApplicationBootstrap,
  BeforeApplicationShutdown,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';

import { Election, ElectionStatus, ElectionType } from './entities/election.entity.js';
import { EligibilityRule } from './entities/eligibility-rule.entity.js';
import { ElectionVoter } from './entities/election-voter.entity.js';
import { Employee, EmployeeStatus } from '../employee/employee.entity.js';
import { Candidate, CandidateStatus } from '../candidate/entities/candidate.entity.js';
import { VotingService } from '../voting/voting.service.js';

import { OrganizationalUnitService } from '../organizational-unit/organizational-unit.service.js';

import {
  CreateElectionDto,
  UpdateElectionDto,
  PatchElectionStatusDto,
  CreateEligibilityRuleDto,
} from './dto/election.dto.js';

/** Valid status advancement transitions */
const ALLOWED_TRANSITIONS: Record<ElectionStatus, ElectionStatus[]> = {
  [ElectionStatus.DRAFT]:        [ElectionStatus.REGISTRATION, ElectionStatus.UPCOMING, ElectionStatus.ACTIVE, ElectionStatus.CANCELLED],
  [ElectionStatus.REGISTRATION]: [ElectionStatus.UPCOMING, ElectionStatus.ACTIVE, ElectionStatus.CANCELLED],
  [ElectionStatus.UPCOMING]:     [ElectionStatus.ACTIVE, ElectionStatus.CANCELLED],
  [ElectionStatus.ACTIVE]:       [ElectionStatus.ENDED, ElectionStatus.CANCELLED],
  [ElectionStatus.ENDED]:        [],
  [ElectionStatus.CANCELLED]:    [],
};

@Injectable()
export class ElectionService implements OnApplicationBootstrap, BeforeApplicationShutdown {
  private readonly logger = new Logger(ElectionService.name);
  private schedulerTimer?: NodeJS.Timeout;
  private isSyncing = false;
  private readonly startElectionLocks = new Set<string>();

  constructor(
    @InjectRepository(Election)
    private readonly electionRepo: Repository<Election>,

    @InjectRepository(EligibilityRule)
    private readonly ruleRepo: Repository<EligibilityRule>,

    @InjectRepository(ElectionVoter)
    private readonly voterRepo: Repository<ElectionVoter>,

    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,

    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,

    @Inject(forwardRef(() => VotingService))
    private readonly votingService: VotingService,

    private readonly orgUnitService: OrganizationalUnitService,
    private readonly dataSource: DataSource,
  ) {}

  onApplicationBootstrap() {
    this.syncTimeBasedStatuses().catch((err) => {
      this.logger.error(`Initial time-based status sync failed: ${err.message}`);
    });

    this.schedulerTimer = setInterval(() => {
      this.syncTimeBasedStatuses().catch((err) => {
        this.logger.error(`Periodic time-based status sync failed: ${err.message}`);
      });
    }, 10000);
  }

  beforeApplicationShutdown() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
    }
  }

  /* ──────────────────────────── ELECTIONS ──────────────────────────── */

  async create(dto: CreateElectionDto, createdByEmployeeId: string): Promise<Election> {
    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('startDate must be before endDate');
    }
    if (dto.unitScopeId && dto.electionType !== ElectionType.UNIT_SCOPED) {
      throw new BadRequestException(
        'unitScopeId can only be set when electionType is UNIT_SCOPED',
      );
    }

    const election = this.electionRepo.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      registrationDeadline: dto.registrationDeadline
        ? new Date(dto.registrationDeadline)
        : null,
      electionType: dto.electionType ?? ElectionType.GENERAL,
      status: ElectionStatus.DRAFT,
      createdByEmployeeId,
    });

    return this.electionRepo.save(election);
  }

  /** Fast local DB update to mark ended elections without making blockchain calls */
  private async fastSyncEndedElections(): Promise<void> {
    await this.electionRepo
      .createQueryBuilder()
      .update(Election)
      .set({ status: ElectionStatus.ENDED })
      .where('status = :active AND "endDate" <= :now', {
        active: ElectionStatus.ACTIVE,
        now: new Date(),
      })
      .execute()
      .catch(() => {});
  }

  async findAll(organizationId?: string, status?: ElectionStatus): Promise<Election[]> {
    await this.fastSyncEndedElections();

    const where: Partial<Record<keyof Election, unknown>> = {};
    if (organizationId) where.organizationId = organizationId;
    if (status)         where.status = status;

    return this.electionRepo.find({
      where: Object.keys(where).length ? (where as any) : undefined,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Election> {
    const election = await this.electionRepo.findOne({ where: { id } });
    if (!election) throw new NotFoundException(`Election ${id} not found`);
    return election;
  }

  async findOneWithRules(id: string): Promise<Election & { eligibilityRules: EligibilityRule[] }> {
    const election = await this.findOne(id);
    const eligibilityRules = await this.ruleRepo.find({ where: { electionId: id }, order: { createdAt: 'ASC' } });
    return { ...election, eligibilityRules };
  }

  async update(id: string, dto: UpdateElectionDto): Promise<Election> {
    const election = await this.findOne(id);

    if (election.status !== ElectionStatus.DRAFT) {
      throw new BadRequestException(
        'Only DRAFT elections can be fully updated. Use PATCH /status to advance status.',
      );
    }

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate)) {
        throw new BadRequestException('startDate must be before endDate');
      }
    }

    Object.assign(election, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : election.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : election.endDate,
      registrationDeadline: dto.registrationDeadline
        ? new Date(dto.registrationDeadline)
        : election.registrationDeadline,
    });

    return this.electionRepo.save(election);
  }

  /**
   * Activates live voting for an election:
   * 1. Publishes on-chain if not yet published
   * 2. Sets status to ACTIVE
   * 3. Publishes all approved candidates to blockchain
   * 4. Ensures voter roll is computed
   */
  async startElection(id: string): Promise<Election> {
    if (this.startElectionLocks.has(id)) {
      this.logger.warn(`startElection already in progress for election ${id}, skipping concurrent invocation`);
      return this.findOne(id);
    }
    this.startElectionLocks.add(id);

    try {
      let election = await this.findOne(id);
      if (election.status === ElectionStatus.CANCELLED || election.status === ElectionStatus.ENDED) {
        return election;
      }

      const now = new Date();
      // If startDate was in the future, bring it to now so voting is immediately open
      if (new Date(election.startDate) > now) {
        election.startDate = now;
        await this.electionRepo.save(election);
      }

      // 1. Publish on-chain if not already published
      if (!election.onChainElectionId) {
        this.logger.log(`Publishing election ${id} on-chain before activating...`);
        const pub = await this.votingService.publishElectionOnChain(id, {});
        election.onChainElectionId = pub.onChainElectionId;
      }

      // 2. Set status to ACTIVE
      election.status = ElectionStatus.ACTIVE;
      await this.electionRepo.save(election);

      // 3. Publish all approved candidates to blockchain if not already on-chain
      const approvedCandidates = await this.candidateRepo.find({
        where: { electionId: id, status: CandidateStatus.APPROVED },
      });
      for (const cand of approvedCandidates) {
        const fresh = await this.candidateRepo.findOne({ where: { id: cand.id } });
        if (fresh && (fresh.onChainCandidateIndex === null || fresh.onChainCandidateIndex === undefined)) {
          try {
            this.logger.log(`Publishing candidate ${fresh.id} on-chain for election ${id}...`);
            const pubRes = await this.votingService.publishCandidateOnChain(id, fresh.id);
            fresh.onChainCandidateIndex = pubRes.onChainCandidateIndex;
            await this.candidateRepo.save(fresh);
          } catch (err: any) {
            this.logger.error(`Error auto-publishing candidate ${fresh.id} on-chain: ${err.message}`);
          }
        }
      }

      // 4. Ensure voter roll is computed
      if (!election.votersComputed) {
        await this.computeEligibleVoters(id).catch((err) => {
          this.logger.error(`Error computing voter roll for election ${id}: ${err.message}`);
        });
      }

      return this.findOne(id);
    } finally {
      this.startElectionLocks.delete(id);
    }
  }

  /**
   * Automated periodic / on-demand lifecycle sync based on time:
   * - ACTIVE elections past endDate -> ENDED
   * - UPCOMING/REGISTRATION/DRAFT elections past startDate -> startElection()
   * - REGISTRATION elections past registrationDeadline -> UPCOMING
   */
  async syncTimeBasedStatuses(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const now = new Date();

      const elections = await this.electionRepo.find({
        where: [
          { status: ElectionStatus.DRAFT },
          { status: ElectionStatus.REGISTRATION },
          { status: ElectionStatus.UPCOMING },
          { status: ElectionStatus.ACTIVE },
        ],
      });

      for (const el of elections) {
        const start = new Date(el.startDate);
        const end = new Date(el.endDate);
        const regEnd = el.registrationDeadline ? new Date(el.registrationDeadline) : null;

        // 1. If currently ACTIVE and end time passed -> transition to ENDED
        if (el.status === ElectionStatus.ACTIVE && now >= end) {
          this.logger.log(`Election ${el.id} (${el.title}) reached end time (${el.endDate}). Auto-ending election.`);
          el.status = ElectionStatus.ENDED;
          await this.electionRepo.save(el);
          continue;
        }

        // 2. If DRAFT / REGISTRATION / UPCOMING and start time reached (and not yet ended) -> auto start election!
        if (
          (el.status === ElectionStatus.UPCOMING ||
            el.status === ElectionStatus.REGISTRATION ||
            el.status === ElectionStatus.DRAFT) &&
          now >= start &&
          now < end
        ) {
          this.logger.log(
            `Election ${el.id} (${el.title}) reached start time (${el.startDate}). Auto-starting and publishing on-chain.`,
          );
          try {
            await this.startElection(el.id);
          } catch (err: any) {
            this.logger.error(`Auto-start failed for election ${el.id}: ${err.message}`);
          }
          continue;
        }

        // 3. Close registration if deadline passed but voting has not started yet
        if (
          el.status === ElectionStatus.REGISTRATION &&
          regEnd &&
          now >= regEnd &&
          now < start
        ) {
          this.logger.log(`Election ${el.id} (${el.title}) registration deadline passed. Moving to UPCOMING.`);
          el.status = ElectionStatus.UPCOMING;
          await this.electionRepo.save(el);
          continue;
        }

        // 4. Self-healing: if election is ACTIVE and on-chain, check if any APPROVED candidate missed deployment
        if (el.status === ElectionStatus.ACTIVE && el.onChainElectionId && now < end) {
          const approvedCandidates = await this.candidateRepo.find({
            where: { electionId: el.id, status: CandidateStatus.APPROVED },
          });
          for (const cand of approvedCandidates) {
            if (cand.onChainCandidateIndex === null || cand.onChainCandidateIndex === undefined) {
              try {
                this.logger.log(`Self-healing: Auto-publishing missing candidate ${cand.id} on-chain for active election ${el.id}...`);
                const pubRes = await this.votingService.publishCandidateOnChain(el.id, cand.id);
                cand.onChainCandidateIndex = pubRes.onChainCandidateIndex;
                await this.candidateRepo.save(cand);
              } catch (err: any) {
                this.logger.error(`Self-healing candidate publish failed for ${cand.id}: ${err.message}`);
              }
            }
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  async patchStatus(id: string, dto: PatchElectionStatusDto): Promise<Election> {
    const election = await this.findOne(id);
    const allowed = ALLOWED_TRANSITIONS[election.status];

    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition election from ${election.status} to ${dto.status}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    if (dto.status === ElectionStatus.ACTIVE) {
      return this.startElection(id);
    }

    if (dto.status === ElectionStatus.ENDED) {
      const now = new Date();
      if (new Date(election.endDate) > now) {
        election.endDate = now;
      }
      election.status = ElectionStatus.ENDED;
      return this.electionRepo.save(election);
    }

    election.status = dto.status;
    return this.electionRepo.save(election);
  }

  /* ───────────────────────── ELIGIBILITY RULES ──────────────────────── */

  async addRule(electionId: string, dto: CreateEligibilityRuleDto): Promise<EligibilityRule> {
    const election = await this.findOne(electionId);

    if (![ElectionStatus.DRAFT, ElectionStatus.REGISTRATION].includes(election.status)) {
      throw new BadRequestException('Eligibility rules can only be modified in DRAFT or REGISTRATION status');
    }

    if (dto.employeeId) {
      const emp = await this.employeeRepo.findOne({ where: { id: dto.employeeId } });
      if (!emp) {
        throw new NotFoundException(`Employee with ID ${dto.employeeId} not found`);
      }
    }

    const rule = this.ruleRepo.create({
      electionId,
      unitId: dto.unitId ?? null,
      employeeId: dto.employeeId ?? null,
      includeDescendants: dto.includeDescendants ?? true,
      allowedPositionIds: dto.allowedPositionIds ?? null,
      minTenureMonths: dto.minTenureMonths ?? 0,
      requiredStatus: dto.requiredStatus ?? 'ACTIVE',
      description: dto.description ?? null,
    });

    return this.ruleRepo.save(rule);
  }

  async getRules(electionId: string): Promise<EligibilityRule[]> {
    await this.findOne(electionId); // ensure election exists
    return this.ruleRepo.find({ where: { electionId }, order: { createdAt: 'ASC' } });
  }

  async removeRule(electionId: string, ruleId: string): Promise<void> {
    const rule = await this.ruleRepo.findOne({ where: { id: ruleId, electionId } });
    if (!rule) throw new NotFoundException(`Eligibility rule ${ruleId} not found for election ${electionId}`);
    await this.ruleRepo.remove(rule);
  }

  /* ────────────────────────── VOTER COMPUTATION ─────────────────────── */

  /**
   * Evaluates all eligibility rules against the employee table
   * and writes results into election_voters.
   *
   * Existing rows for this election are deleted and recomputed fresh.
   * This is intentionally idempotent — safe to call multiple times.
   */
  async computeEligibleVoters(electionId: string): Promise<{ electionId: string; eligibleCount: number }> {
    const election = await this.findOne(electionId);

    if (election.status === ElectionStatus.CANCELLED) {
      throw new BadRequestException('Cannot compute voters for a cancelled election');
    }

    const rules = await this.ruleRepo.find({ where: { electionId } });

    // ── Resolve eligible employee IDs from rules ──────────────────────────
    const eligibleIds = new Set<string>();

    if (rules.length === 0) {
      // No rules → all active employees in the organization are eligible
      const allActive = await this.employeeRepo.find({
        where: { status: EmployeeStatus.ACTIVE },
      });
      // Filter by organization via unit lookup (employees belong to units in org)
      const orgUnits = await this.dataSource.query<{ id: string }[]>(
        `SELECT id FROM organizational_units WHERE "organizationId" = $1`,
        [election.organizationId],
      );
      const orgUnitIds = new Set(orgUnits.map((u) => u.id));
      for (const emp of allActive) {
        if (orgUnitIds.has(emp.organizationalUnitId)) eligibleIds.add(emp.id);
      }
    } else {
      for (const rule of rules) {
        if (rule.employeeId) {
          const emp = await this.employeeRepo.findOne({
            where: { id: rule.employeeId },
          });
          if (emp && (rule.requiredStatus === 'ANY' || emp.status === EmployeeStatus.ACTIVE)) {
            eligibleIds.add(emp.id);
          }
          continue;
        }

        let unitIds: string[] | null = null;

        if (rule.unitId) {
          unitIds = rule.includeDescendants
            ? await this.orgUnitService.getDescendantIds(rule.unitId)
            : [rule.unitId];
        } else {
          // No unit restriction — get all units for this organization
          const orgUnits = await this.dataSource.query<{ id: string }[]>(
            `SELECT id FROM organizational_units WHERE "organizationId" = $1`,
            [election.organizationId],
          );
          unitIds = orgUnits.map((u) => u.id);
        }

        // Build employee query
        const qb = this.employeeRepo.createQueryBuilder('emp');
        qb.where('emp.organizationalUnitId IN (:...unitIds)', { unitIds: unitIds.length ? unitIds : ['__none__'] });

        if (rule.requiredStatus && rule.requiredStatus !== 'ANY') {
          qb.andWhere('emp.status = :status', { status: rule.requiredStatus });
        }

        if (rule.allowedPositionIds && rule.allowedPositionIds.length > 0) {
          qb.andWhere('emp.positionId IN (:...positionIds)', { positionIds: rule.allowedPositionIds });
        }

        if (rule.minTenureMonths > 0) {
          // Filter by hired date — must be at least N months before now
          // Use parameterized value to prevent SQL injection
          qb.andWhere(
            `emp.hiredAt <= NOW() - MAKE_INTERVAL(months => :tenureMonths)`,
            { tenureMonths: rule.minTenureMonths },
          );
        }

        const employees = await qb.getMany();
        employees.forEach((e) => eligibleIds.add(e.id));
      }
    }

    // ── Transactionally update voter roll without erasing voting history ───
    await this.dataSource.transaction(async (manager) => {
      // 1. Fetch existing voter records for this election
      const existingRows = await manager.find(ElectionVoter, {
        where: { electionId },
      });
      const existingMap = new Map(existingRows.map((r) => [r.employeeId, r]));

      // 2. Handle existing voters that are no longer eligible under updated rules:
      for (const row of existingRows) {
        if (!eligibleIds.has(row.employeeId)) {
          if (row.hasVoted) {
            // NEVER erase a voter who has already cast a vote!
            // Mark isEligible = false, but preserve hasVoted, txHash, and votedAt
            row.isEligible = false;
            await manager.save(row);
          } else {
            // Safe to remove if they haven't voted
            await manager.remove(row);
          }
        }
      }

      // 3. Handle all eligible voters:
      for (const empId of eligibleIds) {
        const existing = existingMap.get(empId);
        if (existing) {
          // If already in table, ensure isEligible is true, but DO NOT touch hasVoted, txHash, or votedAt!
          if (!existing.isEligible) {
            existing.isEligible = true;
            await manager.save(existing);
          }
        } else {
          // New eligible voter who has not voted
          const newVoter = manager.create(ElectionVoter, {
            electionId,
            employeeId: empId,
            isEligible: true,
            hasVoted: false,
            txHash: null,
            votedAt: null,
          });
          await manager.save(newVoter);
        }
      }

      await manager.update(Election, { id: electionId }, { votersComputed: true });
    });

    return { electionId, eligibleCount: eligibleIds.size };
  }

  /* ───────────────────────── VOTER QUERIES ──────────────────────────── */

  async getVoters(
    electionId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: ElectionVoter[]; total: number; page: number; limit: number }> {
    await this.findOne(electionId);

    const [data, total] = await this.voterRepo.findAndCount({
      where: { electionId },
      relations: ['employee'],
      skip: (page - 1) * limit,
      take: limit,
      order: { checkedAt: 'ASC' },
    });

    return { data, total, page, limit };
  }

  /** Check if a specific employee is eligible for an election */
  async checkMyEligibility(
    electionId: string,
    employeeId: string,
  ): Promise<{ eligible: boolean; hasVoted: boolean; voterRow: ElectionVoter | null }> {
    await this.findOne(electionId);

    const voterRow = await this.voterRepo.findOne({
      where: { electionId, employeeId },
    });

    return {
      eligible: voterRow?.isEligible ?? false,
      hasVoted: voterRow?.hasVoted ?? false,
      voterRow,
    };
  }

  /**
   * Returns all elections created by the given employee.
   * Used by election creators to manage their own elections.
   */
  async getElectionsCreatedByMe(employeeId: string): Promise<Election[]> {
    await this.syncTimeBasedStatuses().catch(() => {});

    return this.electionRepo.find({
      where: { createdByEmployeeId: employeeId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Returns all elections the given employee is eligible for.
   * Only returns elections where voters have been computed.
   */
  async getMyElections(employeeId: string): Promise<Election[]> {
    await this.syncTimeBasedStatuses().catch(() => {});

    // Automatically compute voters for any elections that haven't been computed yet
    const uncomputed = await this.electionRepo.find({
      where: { votersComputed: false },
    });
    for (const el of uncomputed) {
      await this.computeEligibleVoters(el.id).catch(() => {});
    }

    const voterRows = await this.voterRepo.find({
      where: { employeeId, isEligible: true },
      select: ['electionId'],
    });

    if (voterRows.length === 0) return [];

    const electionIds = voterRows.map((v) => v.electionId);
    return this.electionRepo.find({
      where: { id: In(electionIds) },
      order: { startDate: 'DESC' },
    });
  }
}
