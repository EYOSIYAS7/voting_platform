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
import { Injectable, NotFoundException, BadRequestException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Election, ElectionStatus, ElectionType } from './entities/election.entity.js';
import { EligibilityRule } from './entities/eligibility-rule.entity.js';
import { ElectionVoter } from './entities/election-voter.entity.js';
import { Employee, EmployeeStatus } from '../employee/employee.entity.js';
import { OrganizationalUnitService } from '../organizational-unit/organizational-unit.service.js';
const ALLOWED_TRANSITIONS = {
    [ElectionStatus.DRAFT]: [ElectionStatus.REGISTRATION, ElectionStatus.CANCELLED],
    [ElectionStatus.REGISTRATION]: [ElectionStatus.UPCOMING, ElectionStatus.CANCELLED],
    [ElectionStatus.UPCOMING]: [ElectionStatus.ACTIVE, ElectionStatus.CANCELLED],
    [ElectionStatus.ACTIVE]: [ElectionStatus.ENDED, ElectionStatus.CANCELLED],
    [ElectionStatus.ENDED]: [],
    [ElectionStatus.CANCELLED]: [],
};
let ElectionService = class ElectionService {
    electionRepo;
    ruleRepo;
    voterRepo;
    employeeRepo;
    orgUnitService;
    dataSource;
    constructor(electionRepo, ruleRepo, voterRepo, employeeRepo, orgUnitService, dataSource) {
        this.electionRepo = electionRepo;
        this.ruleRepo = ruleRepo;
        this.voterRepo = voterRepo;
        this.employeeRepo = employeeRepo;
        this.orgUnitService = orgUnitService;
        this.dataSource = dataSource;
    }
    async create(dto, createdByEmployeeId) {
        if (new Date(dto.startDate) >= new Date(dto.endDate)) {
            throw new BadRequestException('startDate must be before endDate');
        }
        if (dto.unitScopeId && dto.electionType === ElectionType.GENERAL) {
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
    async findAll(organizationId, status) {
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
    async patchStatus(id, dto) {
        const election = await this.findOne(id);
        const allowed = ALLOWED_TRANSITIONS[election.status];
        if (!allowed.includes(dto.status)) {
            throw new BadRequestException(`Cannot transition election from ${election.status} to ${dto.status}. Allowed: ${allowed.join(', ') || 'none'}`);
        }
        election.status = dto.status;
        return this.electionRepo.save(election);
    }
    async addRule(electionId, dto) {
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
                    qb.andWhere(`emp.hiredAt <= NOW() - INTERVAL '${rule.minTenureMonths} months'`);
                }
                const employees = await qb.getMany();
                employees.forEach((e) => eligibleIds.add(e.id));
            }
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.delete(ElectionVoter, { electionId });
            if (eligibleIds.size > 0) {
                const rows = [...eligibleIds].map((empId) => ({
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
    async getVoters(electionId, page = 1, limit = 50) {
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
    async getMyElections(employeeId) {
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
ElectionService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Election)),
    __param(1, InjectRepository(EligibilityRule)),
    __param(2, InjectRepository(ElectionVoter)),
    __param(3, InjectRepository(Employee)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        OrganizationalUnitService,
        DataSource])
], ElectionService);
export { ElectionService };
//# sourceMappingURL=election.service.js.map