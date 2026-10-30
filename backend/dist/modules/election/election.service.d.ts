import { Repository, DataSource } from 'typeorm';
import { Election, ElectionStatus } from './entities/election.entity.js';
import { EligibilityRule } from './entities/eligibility-rule.entity.js';
import { ElectionVoter } from './entities/election-voter.entity.js';
import { Employee } from '../employee/employee.entity.js';
import { OrganizationalUnitService } from '../organizational-unit/organizational-unit.service.js';
import { CreateElectionDto, UpdateElectionDto, PatchElectionStatusDto, CreateEligibilityRuleDto } from './dto/election.dto.js';
export declare class ElectionService {
    private readonly electionRepo;
    private readonly ruleRepo;
    private readonly voterRepo;
    private readonly employeeRepo;
    private readonly orgUnitService;
    private readonly dataSource;
    constructor(electionRepo: Repository<Election>, ruleRepo: Repository<EligibilityRule>, voterRepo: Repository<ElectionVoter>, employeeRepo: Repository<Employee>, orgUnitService: OrganizationalUnitService, dataSource: DataSource);
    create(dto: CreateElectionDto, createdByEmployeeId: string): Promise<Election>;
    findAll(organizationId?: string, status?: ElectionStatus): Promise<Election[]>;
    findOne(id: string): Promise<Election>;
    findOneWithRules(id: string): Promise<Election & {
        eligibilityRules: EligibilityRule[];
    }>;
    update(id: string, dto: UpdateElectionDto): Promise<Election>;
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
