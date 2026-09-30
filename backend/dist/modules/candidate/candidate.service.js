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
import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Candidate, CandidateStatus } from './entities/candidate.entity.js';
import { Election, ElectionStatus } from '../election/entities/election.entity.js';
import { ElectionVoter } from '../election/entities/election-voter.entity.js';
import { Employee } from '../employee/employee.entity.js';
let CandidateService = class CandidateService {
    candidateRepo;
    electionRepo;
    voterRepo;
    employeeRepo;
    dataSource;
    constructor(candidateRepo, electionRepo, voterRepo, employeeRepo, dataSource) {
        this.candidateRepo = candidateRepo;
        this.electionRepo = electionRepo;
        this.voterRepo = voterRepo;
        this.employeeRepo = employeeRepo;
        this.dataSource = dataSource;
    }
    async requireElection(electionId) {
        const election = await this.electionRepo.findOne({ where: { id: electionId } });
        if (!election)
            throw new NotFoundException(`Election ${electionId} not found`);
        return election;
    }
    async requireEmployee(employeeId) {
        const emp = await this.employeeRepo.findOne({ where: { id: employeeId } });
        if (!emp)
            throw new NotFoundException(`Employee ${employeeId} not found`);
        return emp;
    }
    assertNominationOpen(election) {
        const allowed = [ElectionStatus.DRAFT, ElectionStatus.REGISTRATION];
        if (!allowed.includes(election.status)) {
            throw new BadRequestException(`Candidate nominations are only allowed when election is in DRAFT or REGISTRATION status. Current: ${election.status}`);
        }
    }
    async assertEmployeeEligible(election, employeeId) {
        if (!election.votersComputed)
            return;
        const voterRow = await this.voterRepo.findOne({
            where: { electionId: election.id, employeeId, isEligible: true },
        });
        if (!voterRow) {
            throw new ForbiddenException('This employee is not eligible to participate in this election.');
        }
    }
    async assertMaxCandidatesNotReached(election) {
        if (election.maxCandidates === 0)
            return;
        const count = await this.candidateRepo.count({
            where: {
                electionId: election.id,
                status: CandidateStatus.APPROVED,
            },
        });
        if (count >= election.maxCandidates) {
            throw new BadRequestException(`Election has reached the maximum number of approved candidates (${election.maxCandidates}).`);
        }
    }
    async nominateByAdmin(electionId, dto, nominatedByEmployeeId) {
        const election = await this.requireElection(electionId);
        this.assertNominationOpen(election);
        await this.requireEmployee(dto.employeeId);
        await this.assertEmployeeEligible(election, dto.employeeId);
        const existing = await this.candidateRepo.findOne({
            where: { electionId, employeeId: dto.employeeId },
        });
        if (existing) {
            throw new ConflictException(`Employee is already nominated for this election (status: ${existing.status}).`);
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
    async selfNominate(electionId, dto, employeeId) {
        const election = await this.requireElection(electionId);
        this.assertNominationOpen(election);
        await this.assertEmployeeEligible(election, employeeId);
        const existing = await this.candidateRepo.findOne({
            where: { electionId, employeeId },
        });
        if (existing) {
            throw new ConflictException(`You are already nominated for this election (status: ${existing.status}).`);
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
    async findAll(electionId, status) {
        await this.requireElection(electionId);
        const where = { electionId };
        if (status)
            where.status = status;
        return this.candidateRepo.find({
            where,
            relations: ['employee'],
            order: { createdAt: 'ASC' },
        });
    }
    async findOne(electionId, candidateId) {
        const candidate = await this.candidateRepo.findOne({
            where: { id: candidateId, electionId },
            relations: ['employee', 'election'],
        });
        if (!candidate) {
            throw new NotFoundException(`Candidate ${candidateId} not found in election ${electionId}`);
        }
        return candidate;
    }
    async getMyCandidacy(electionId, employeeId) {
        return this.candidateRepo.findOne({
            where: { electionId, employeeId },
            relations: ['election'],
        });
    }
    async update(electionId, candidateId, dto, requestingEmployeeId, isAdmin) {
        const candidate = await this.findOne(electionId, candidateId);
        if (!isAdmin && candidate.employeeId !== requestingEmployeeId) {
            throw new ForbiddenException('You can only update your own candidacy.');
        }
        if (candidate.status !== CandidateStatus.PENDING) {
            throw new BadRequestException('Only PENDING candidates can update their profile. Contact an admin to reverse a review.');
        }
        const election = await this.requireElection(electionId);
        this.assertNominationOpen(election);
        Object.assign(candidate, {
            statement: dto.statement ?? candidate.statement,
            slogan: dto.slogan ?? candidate.slogan,
            photoUrl: dto.photoUrl ?? candidate.photoUrl,
        });
        return this.candidateRepo.save(candidate);
    }
    async review(electionId, candidateId, dto, reviewerEmployeeId) {
        const candidate = await this.findOne(electionId, candidateId);
        if (candidate.status !== CandidateStatus.PENDING) {
            throw new BadRequestException(`Can only review PENDING candidates. Current status: ${candidate.status}`);
        }
        if (dto.status === CandidateStatus.REJECTED && !dto.rejectionReason) {
            throw new BadRequestException('A rejectionReason is required when rejecting a candidate.');
        }
        if (dto.status === CandidateStatus.APPROVED) {
            const election = await this.requireElection(electionId);
            await this.assertMaxCandidatesNotReached(election);
        }
        candidate.status = dto.status;
        candidate.rejectionReason = dto.rejectionReason ?? null;
        candidate.reviewedByEmployeeId = reviewerEmployeeId;
        candidate.reviewedAt = new Date();
        return this.candidateRepo.save(candidate);
    }
    async withdraw(electionId, candidateId, requestingEmployeeId, isAdmin) {
        const candidate = await this.findOne(electionId, candidateId);
        if (!isAdmin && candidate.employeeId !== requestingEmployeeId) {
            throw new ForbiddenException('You can only withdraw your own candidacy.');
        }
        const withdrawable = [
            CandidateStatus.PENDING,
            CandidateStatus.APPROVED,
        ];
        if (!withdrawable.includes(candidate.status)) {
            throw new BadRequestException(`Cannot withdraw a candidacy with status ${candidate.status}.`);
        }
        const election = await this.requireElection(electionId);
        if (election.status === ElectionStatus.ACTIVE || election.status === ElectionStatus.ENDED) {
            throw new BadRequestException('Cannot withdraw a candidacy once the election is ACTIVE or has ENDED.');
        }
        candidate.status = CandidateStatus.WITHDRAWN;
        return this.candidateRepo.save(candidate);
    }
    async remove(electionId, candidateId) {
        const candidate = await this.findOne(electionId, candidateId);
        const election = await this.requireElection(electionId);
        if ([ElectionStatus.ACTIVE, ElectionStatus.ENDED].includes(election.status)) {
            throw new BadRequestException('Cannot delete a candidate from an ACTIVE or ENDED election.');
        }
        await this.candidateRepo.remove(candidate);
    }
};
CandidateService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Candidate)),
    __param(1, InjectRepository(Election)),
    __param(2, InjectRepository(ElectionVoter)),
    __param(3, InjectRepository(Employee)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        DataSource])
], CandidateService);
export { CandidateService };
//# sourceMappingURL=candidate.service.js.map