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
var ElectionService_1;
import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Election, ElectionStatus, ElectionType } from './entities/election.entity.js';
import { EligibilityRule } from './entities/eligibility-rule.entity.js';
import { ElectionVoter } from './entities/election-voter.entity.js';
import { Employee, EmployeeStatus } from '../employee/employee.entity.js';
import { Candidate, CandidateStatus } from '../candidate/entities/candidate.entity.js';
import { VotingService } from '../voting/voting.service.js';
import { OrganizationalUnitService } from '../organizational-unit/organizational-unit.service.js';
const ALLOWED_TRANSITIONS = {
    [ElectionStatus.DRAFT]: [ElectionStatus.REGISTRATION, ElectionStatus.UPCOMING, ElectionStatus.ACTIVE, ElectionStatus.CANCELLED],
    [ElectionStatus.REGISTRATION]: [ElectionStatus.UPCOMING, ElectionStatus.ACTIVE, ElectionStatus.CANCELLED],
    [ElectionStatus.UPCOMING]: [ElectionStatus.ACTIVE, ElectionStatus.CANCELLED],
    [ElectionStatus.ACTIVE]: [ElectionStatus.ENDED, ElectionStatus.CANCELLED],
    [ElectionStatus.ENDED]: [],
    [ElectionStatus.CANCELLED]: [],
};
let ElectionService = ElectionService_1 = class ElectionService {
    electionRepo;
    ruleRepo;
    voterRepo;
    employeeRepo;
    candidateRepo;
    votingService;
    orgUnitService;
    dataSource;
    logger = new Logger(ElectionService_1.name);
    schedulerTimer;
    isSyncing = false;
    startElectionLocks = new Set();
    constructor(electionRepo, ruleRepo, voterRepo, employeeRepo, candidateRepo, votingService, orgUnitService, dataSource) {
        this.electionRepo = electionRepo;
        this.ruleRepo = ruleRepo;
        this.voterRepo = voterRepo;
        this.employeeRepo = employeeRepo;
        this.candidateRepo = candidateRepo;
        this.votingService = votingService;
        this.orgUnitService = orgUnitService;
        this.dataSource = dataSource;
    }
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
    async create(dto, createdByEmployeeId) {
        if (new Date(dto.startDate) >= new Date(dto.endDate)) {
            throw new BadRequestException('startDate must be before endDate');
        }
        if (dto.unitScopeId && dto.electionType !== ElectionType.UNIT_SCOPED) {
            throw new BadRequestException('unitScopeId can only be set when electionType is UNIT_SCOPED');
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
    async fastSyncEndedElections() {
        await this.electionRepo
            .createQueryBuilder()
            .update(Election)
            .set({ status: ElectionStatus.ENDED })
            .where('status = :active AND "endDate" <= :now', {
            active: ElectionStatus.ACTIVE,
            now: new Date(),
        })
            .execute()
            .catch(() => { });
    }
    async findAll(organizationId, status) {
        await this.fastSyncEndedElections();
        const where = {};
        if (organizationId)
            where.organizationId = organizationId;
        if (status)
            where.status = status;
        return this.electionRepo.find({
            where: Object.keys(where).length ? where : undefined,
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const election = await this.electionRepo.findOne({ where: { id } });
        if (!election)
            throw new NotFoundException(`Election ${id} not found`);
        return election;
    }
    async findOneWithRules(id) {
        const election = await this.findOne(id);
        const eligibilityRules = await this.ruleRepo.find({ where: { electionId: id }, order: { createdAt: 'ASC' } });
        return { ...election, eligibilityRules };
    }
    async update(id, dto) {
        const election = await this.findOne(id);
        if (election.status !== ElectionStatus.DRAFT) {
            throw new BadRequestException('Only DRAFT elections can be fully updated. Use PATCH /status to advance status.');
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
    async startElection(id) {
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
            if (new Date(election.startDate) > now) {
                election.startDate = now;
                await this.electionRepo.save(election);
            }
            if (!election.onChainElectionId) {
                this.logger.log(`Publishing election ${id} on-chain before activating...`);
                const pub = await this.votingService.publishElectionOnChain(id, {});
                election.onChainElectionId = pub.onChainElectionId;
            }
            election.status = ElectionStatus.ACTIVE;
            await this.electionRepo.save(election);
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
                    }
                    catch (err) {
                        this.logger.error(`Error auto-publishing candidate ${fresh.id} on-chain: ${err.message}`);
                    }
                }
            }
            if (!election.votersComputed) {
                await this.computeEligibleVoters(id).catch((err) => {
                    this.logger.error(`Error computing voter roll for election ${id}: ${err.message}`);
                });
            }
            return this.findOne(id);
        }
        finally {
            this.startElectionLocks.delete(id);
        }
    }
    async syncTimeBasedStatuses() {
        if (this.isSyncing)
            return;
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
                if (el.status === ElectionStatus.ACTIVE && now >= end) {
                    this.logger.log(`Election ${el.id} (${el.title}) reached end time (${el.endDate}). Auto-ending election.`);
                    el.status = ElectionStatus.ENDED;
                    await this.electionRepo.save(el);
                    continue;
                }
                if ((el.status === ElectionStatus.UPCOMING ||
                    el.status === ElectionStatus.REGISTRATION ||
                    el.status === ElectionStatus.DRAFT) &&
                    now >= start &&
                    now < end) {
                    this.logger.log(`Election ${el.id} (${el.title}) reached start time (${el.startDate}). Auto-starting and publishing on-chain.`);
                    try {
                        await this.startElection(el.id);
                    }
                    catch (err) {
                        this.logger.error(`Auto-start failed for election ${el.id}: ${err.message}`);
                    }
                    continue;
                }
                if (el.status === ElectionStatus.REGISTRATION &&
                    regEnd &&
                    now >= regEnd &&
                    now < start) {
                    this.logger.log(`Election ${el.id} (${el.title}) registration deadline passed. Moving to UPCOMING.`);
                    el.status = ElectionStatus.UPCOMING;
                    await this.electionRepo.save(el);
                    continue;
                }
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
                            }
                            catch (err) {
                                this.logger.error(`Self-healing candidate publish failed for ${cand.id}: ${err.message}`);
                            }
                        }
                    }
                }
            }
        }
        finally {
            this.isSyncing = false;
        }
    }
    async patchStatus(id, dto) {
        const election = await this.findOne(id);
        const allowed = ALLOWED_TRANSITIONS[election.status];
        if (!allowed.includes(dto.status)) {
            throw new BadRequestException(`Cannot transition election from ${election.status} to ${dto.status}. Allowed: ${allowed.join(', ') || 'none'}`);
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
    async addRule(electionId, dto) {
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
    async getRules(electionId) {
        await this.findOne(electionId);
        return this.ruleRepo.find({ where: { electionId }, order: { createdAt: 'ASC' } });
    }
    async removeRule(electionId, ruleId) {
        const rule = await this.ruleRepo.findOne({ where: { id: ruleId, electionId } });
        if (!rule)
            throw new NotFoundException(`Eligibility rule ${ruleId} not found for election ${electionId}`);
        await this.ruleRepo.remove(rule);
    }
    async computeEligibleVoters(electionId) {
        const election = await this.findOne(electionId);
        if (election.status === ElectionStatus.CANCELLED) {
            throw new BadRequestException('Cannot compute voters for a cancelled election');
        }
        const rules = await this.ruleRepo.find({ where: { electionId } });
        const eligibleIds = new Set();
        if (rules.length === 0) {
            const allActive = await this.employeeRepo.find({
                where: { status: EmployeeStatus.ACTIVE },
            });
            const orgUnits = await this.dataSource.query(`SELECT id FROM organizational_units WHERE "organizationId" = $1`, [election.organizationId]);
            const orgUnitIds = new Set(orgUnits.map((u) => u.id));
            for (const emp of allActive) {
                if (orgUnitIds.has(emp.organizationalUnitId))
                    eligibleIds.add(emp.id);
            }
        }
        else {
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
                let unitIds = null;
                if (rule.unitId) {
                    unitIds = rule.includeDescendants
                        ? await this.orgUnitService.getDescendantIds(rule.unitId)
                        : [rule.unitId];
                }
                else {
                    const orgUnits = await this.dataSource.query(`SELECT id FROM organizational_units WHERE "organizationId" = $1`, [election.organizationId]);
                    unitIds = orgUnits.map((u) => u.id);
                }
                const qb = this.employeeRepo.createQueryBuilder('emp');
                qb.where('emp.organizationalUnitId IN (:...unitIds)', { unitIds: unitIds.length ? unitIds : ['__none__'] });
                if (rule.requiredStatus && rule.requiredStatus !== 'ANY') {
                    qb.andWhere('emp.status = :status', { status: rule.requiredStatus });
                }
                if (rule.allowedPositionIds && rule.allowedPositionIds.length > 0) {
                    qb.andWhere('emp.positionId IN (:...positionIds)', { positionIds: rule.allowedPositionIds });
                }
                if (rule.minTenureMonths > 0) {
                    qb.andWhere(`emp.hiredAt <= NOW() - MAKE_INTERVAL(months => :tenureMonths)`, { tenureMonths: rule.minTenureMonths });
                }
                const employees = await qb.getMany();
                employees.forEach((e) => eligibleIds.add(e.id));
            }
        }
        await this.dataSource.transaction(async (manager) => {
            const existingRows = await manager.find(ElectionVoter, {
                where: { electionId },
            });
            const existingMap = new Map(existingRows.map((r) => [r.employeeId, r]));
            for (const row of existingRows) {
                if (!eligibleIds.has(row.employeeId)) {
                    if (row.hasVoted) {
                        row.isEligible = false;
                        await manager.save(row);
                    }
                    else {
                        await manager.remove(row);
                    }
                }
            }
            for (const empId of eligibleIds) {
                const existing = existingMap.get(empId);
                if (existing) {
                    if (!existing.isEligible) {
                        existing.isEligible = true;
                        await manager.save(existing);
                    }
                }
                else {
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
    async getVoters(electionId, page = 1, limit = 50) {
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
    async checkMyEligibility(electionId, employeeId) {
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
    async getElectionsCreatedByMe(employeeId) {
        await this.syncTimeBasedStatuses().catch(() => { });
        return this.electionRepo.find({
            where: { createdByEmployeeId: employeeId },
            order: { createdAt: 'DESC' },
        });
    }
    async getMyElections(employeeId) {
        await this.syncTimeBasedStatuses().catch(() => { });
        const uncomputed = await this.electionRepo.find({
            where: { votersComputed: false },
        });
        for (const el of uncomputed) {
            await this.computeEligibleVoters(el.id).catch(() => { });
        }
        const voterRows = await this.voterRepo.find({
            where: { employeeId, isEligible: true },
            select: ['electionId'],
        });
        if (voterRows.length === 0)
            return [];
        const electionIds = voterRows.map((v) => v.electionId);
        return this.electionRepo.find({
            where: { id: In(electionIds) },
            order: { startDate: 'DESC' },
        });
    }
};
ElectionService = ElectionService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(Election)),
    __param(1, InjectRepository(EligibilityRule)),
    __param(2, InjectRepository(ElectionVoter)),
    __param(3, InjectRepository(Employee)),
    __param(4, InjectRepository(Candidate)),
    __param(5, Inject(forwardRef(() => VotingService))),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        VotingService,
        OrganizationalUnitService,
        DataSource])
], ElectionService);
export { ElectionService };
//# sourceMappingURL=election.service.js.map