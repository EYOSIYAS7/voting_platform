import type { Request } from 'express';
import { CandidateService } from './candidate.service.js';
import { NominateCandidateDto, SelfNominateDto, UpdateCandidateDto, ReviewCandidateDto } from './dto/candidate.dto.js';
import { CandidateStatus } from './entities/candidate.entity.js';
export declare class CandidateController {
    private readonly service;
    constructor(service: CandidateService);
    findAll(electionId: string, status?: CandidateStatus): Promise<import("./entities/candidate.entity.js").Candidate[]>;
    getMyCandidacy(electionId: string, req: Request): Promise<import("./entities/candidate.entity.js").Candidate | null>;
    findOne(electionId: string, candidateId: string): Promise<import("./entities/candidate.entity.js").Candidate>;
    nominateByAdmin(electionId: string, dto: NominateCandidateDto, req: Request): Promise<import("./entities/candidate.entity.js").Candidate>;
    selfNominate(electionId: string, dto: SelfNominateDto, req: Request): Promise<import("./entities/candidate.entity.js").Candidate>;
    update(electionId: string, candidateId: string, dto: UpdateCandidateDto, req: Request): Promise<import("./entities/candidate.entity.js").Candidate>;
    review(electionId: string, candidateId: string, dto: ReviewCandidateDto, req: Request): Promise<import("./entities/candidate.entity.js").Candidate>;
    withdraw(electionId: string, candidateId: string, req: Request): Promise<import("./entities/candidate.entity.js").Candidate>;
    remove(electionId: string, candidateId: string): Promise<void>;
}
