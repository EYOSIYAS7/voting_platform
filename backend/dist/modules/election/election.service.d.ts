import { OnApplicationBootstrap, BeforeApplicationShutdown } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Election, ElectionStatus } from './entities/election.entity.js';
import { EligibilityRule } from './entities/eligibility-rule.entity.js';
import { ElectionVoter } from './entities/election-voter.entity.js';
import { Employee } from '../employee/employee.entity.js';
import { Candidate } from '../candidate/entities/candidate.entity.js';
import { VotingService } from '../voting/voting.service.js';
import { OrganizationalUnitService } from '../organizational-unit/organizational-unit.service.js';
import { CreateElectionDto, UpdateElectionDto, PatchElectionStatusDto, CreateEligibilityRuleDto } from './dto/election.dto.js';
export declare class ElectionService implements OnApplicationBootstrap, BeforeApplicationShutdown {
    private readonly electionRepo;
    private readonly ruleRepo;
    private readonly voterRepo;
    private readonly employeeRepo;
    private readonly candidateRepo;
    private readonly votingService;
    private readonly orgUnitService;
    private readonly dataSource;
    private readonly logger;
    private schedulerTimer?;
    private isSyncing;
    private readonly startElectionLocks;
    constructor(electionRepo: Repository<Election>, ruleRepo: Repository<EligibilityRule>, voterRepo: Repository<ElectionVoter>, employeeRepo: Repository<Employee>, candidateRepo: Repository<Candidate>, votingService: VotingService, orgUnitService: OrganizationalUnitService, dataSource: DataSource);
    onApplicationBootstrap(): void;
    beforeApplicationShutdown(): void;
    create(dto: CreateElectionDto, createdByEmployeeId: string): Promise<Election>;
    private fastSyncEndedElections;
    findAll(organizationId?: string, status?: ElectionStatus): Promise<Election[]>;
    findOne(id: string): Promise<Election>;
    findOneWithRules(id: string): Promise<Election & {
        eligibilityRules: EligibilityRule[];
    }>;
    update(id: string, dto: UpdateElectionDto): Promise<Election>;
    startElection(id: string): Promise<Election>;
    syncTimeBasedStatuses(): Promise<void>;
    patchStatus(id: string, dto: PatchElectionStatusDto): Promise<Election>;
    addRule(electionId: string, dto: CreateEligibilityRuleDto): Promise<EligibilityRule>;
    getRules(electionId: string): Promise<EligibilityRule[]>;
    removeRule(electionId: string, ruleId: string): Promise<void>;
    computeEligibleVoters(electionId: string): Promise<{
        electionId: string;
        eligibleCount: number;
    }>;
    getVoters(electionId: string, page?: number, limit?: number): Promise<{
        data: ElectionVoter[];
        total: number;
        page: number;
        limit: number;
    }>;
    checkMyEligibility(electionId: string, employeeId: string): Promise<{
        eligible: boolean;
        hasVoted: boolean;
        voterRow: ElectionVoter | null;
    }>;
    getElectionsCreatedByMe(employeeId: string): Promise<Election[]>;
    getMyElections(employeeId: string): Promise<Election[]>;
}
