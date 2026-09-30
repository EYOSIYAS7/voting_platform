import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';

import { Election, ElectionStatus, ElectionType } from './entities/election.entity.js';
import { EligibilityRule } from './entities/eligibility-rule.entity.js';
import { ElectionVoter } from './entities/election-voter.entity.js';
import { Employee, EmployeeStatus } from '../employee/employee.entity.js';

import { OrganizationalUnitService } from '../organizational-unit/organizational-unit.service.js';

import {
  CreateElectionDto,
  UpdateElectionDto,
  PatchElectionStatusDto,
  CreateEligibilityRuleDto,
} from './dto/election.dto.js';

/** Valid status advancement transitions */
const ALLOWED_TRANSITIONS: Record<ElectionStatus, ElectionStatus[]> = {
  [ElectionStatus.DRAFT]:        [ElectionStatus.REGISTRATION, ElectionStatus.CANCELLED],
  [ElectionStatus.REGISTRATION]: [ElectionStatus.UPCOMING,     ElectionStatus.CANCELLED],
  [ElectionStatus.UPCOMING]:     [ElectionStatus.ACTIVE,       ElectionStatus.CANCELLED],
  [ElectionStatus.ACTIVE]:       [ElectionStatus.ENDED,        ElectionStatus.CANCELLED],
  [ElectionStatus.ENDED]:        [],
  [ElectionStatus.CANCELLED]:    [],
};

@Injectable()
export class ElectionService {
  constructor(
    @InjectRepository(Election)
    private readonly electionRepo: Repository<Election>,

    @InjectRepository(EligibilityRule)
    private readonly ruleRepo: Repository<EligibilityRule>,

    @InjectRepository(ElectionVoter)
    private readonly voterRepo: Repository<ElectionVoter>,

    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,

    private readonly orgUnitService: OrganizationalUnitService,
    private readonly dataSource: DataSource,
  ) {}

  /* ──────────────────────────── ELECTIONS ──────────────────────────── */

  async create(dto: CreateElectionDto, createdByEmployeeId: string): Promise<Election> {
    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('startDate must be before endDate');
    }
    if (dto.unitScopeId && dto.electionType === ElectionType.GENERAL) {
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

  async findAll(organizationId?: string, status?: ElectionStatus): Promise<Election[]> {
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

  async patchStatus(id: string, dto: PatchElectionStatusDto): Promise<Election> {
    const election = await this.findOne(id);
    const allowed = ALLOWED_TRANSITIONS[election.status];

    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition election from ${election.status} to ${dto.status}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
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

    const rule = this.ruleRepo.create({
      electionId,
      unitId: dto.unitId ?? null,
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
  async computeEligibleVoters(electionId: string): Promise<{ computed: number; eligible: number }> {
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
          qb.andWhere(
            `emp.hiredAt <= NOW() - INTERVAL '${rule.minTenureMonths} months'`,
          );
        }

        const employees = await qb.getMany();
        employees.forEach((e) => eligibleIds.add(e.id));
      }
    }

    // ── Transactionally replace voter rows ───────────────────────────────
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(ElectionVoter, { electionId });

      if (eligibleIds.size > 0) {
        const rows: Partial<ElectionVoter>[] = [...eligibleIds].map((empId) => ({
          electionId,
          employeeId: empId,
          isEligible: true,
          hasVoted: false,
          txHash: null,
          votedAt: null,
        }));
        await manager
          .createQueryBuilder()
          .insert()
          .into(ElectionVoter)
          .values(rows)
          .execute();
      }

      await manager.update(Election, { id: electionId }, { votersComputed: true });
    });

    return { computed: eligibleIds.size, eligible: eligibleIds.size };
  }

  /* ───────────────────────── VOTER QUERIES ──────────────────────────── */

  async getVoters(
    electionId: string,
    page = 1,
    limit = 50,
  ): Promise<{ voters: ElectionVoter[]; total: number }> {
    await this.findOne(electionId);

    const [voters, total] = await this.voterRepo.findAndCount({
      where: { electionId },
      relations: ['employee'],
      skip: (page - 1) * limit,
      take: limit,
      order: { checkedAt: 'ASC' },
    });

    return { voters, total };
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
   * Returns all elections the given employee is eligible for.
   * Only returns elections where voters have been computed.
   */
  async getMyElections(employeeId: string): Promise<Election[]> {
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
