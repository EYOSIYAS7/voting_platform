import type { Request } from 'express';
import { ElectionService } from './election.service.js';
import { CreateElectionDto, UpdateElectionDto, PatchElectionStatusDto, CreateEligibilityRuleDto } from './dto/election.dto.js';
import { ElectionStatus } from './entities/election.entity.js';
export declare class ElectionController {
    private readonly service;
    constructor(service: ElectionService);
    create(dto: CreateElectionDto, req: Request): Promise<import("./entities/election.entity.js").Election>;
    findAll(organizationId?: string, status?: ElectionStatus): Promise<import("./entities/election.entity.js").Election[]>;
    getMyElections(req: Request): Promise<import("./entities/election.entity.js").Election[]>;
    findOne(id: string): Promise<import("./entities/election.entity.js").Election & {
        eligibilityRules: import("./entities/eligibility-rule.entity.js").EligibilityRule[];
    }>;
    update(id: string, dto: UpdateElectionDto): Promise<import("./entities/election.entity.js").Election>;
    patchStatus(id: string, dto: PatchElectionStatusDto): Promise<import("./entities/election.entity.js").Election>;
    addRule(id: string, dto: CreateEligibilityRuleDto): Promise<import("./entities/eligibility-rule.entity.js").EligibilityRule>;
    getRules(id: string): Promise<import("./entities/eligibility-rule.entity.js").EligibilityRule[]>;
    removeRule(id: string, ruleId: string): Promise<void>;
    computeVoters(id: string): Promise<{
        computed: number;
        eligible: number;
    }>;
    getVoters(id: string, page: number, limit: number): Promise<{
        voters: import("./entities/election-voter.entity.js").ElectionVoter[];
        total: number;
    }>;
    checkMyEligibility(id: string, req: Request): Promise<{
        eligible: boolean;
        hasVoted: boolean;
        voterRow: import("./entities/election-voter.entity.js").ElectionVoter | null;
    }>;
}
