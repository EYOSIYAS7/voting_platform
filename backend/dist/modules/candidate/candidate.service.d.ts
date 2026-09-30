import { Repository, DataSource } from 'typeorm';
import { Candidate, CandidateStatus } from './entities/candidate.entity.js';
import { Election } from '../election/entities/election.entity.js';
import { ElectionVoter } from '../election/entities/election-voter.entity.js';
import { Employee } from '../employee/employee.entity.js';
import { NominateCandidateDto, SelfNominateDto, UpdateCandidateDto, ReviewCandidateDto } from './dto/candidate.dto.js';
export declare class CandidateService {
    private readonly candidateRepo;
    private readonly electionRepo;
    private readonly voterRepo;
    private readonly employeeRepo;
    private readonly dataSource;
    constructor(candidateRepo: Repository<Candidate>, electionRepo: Repository<Election>, voterRepo: Repository<ElectionVoter>, employeeRepo: Repository<Employee>, dataSource: DataSource);
    private requireElection;
    private requireEmployee;
    private assertNominationOpen;
    private assertEmployeeEligible;
    private assertMaxCandidatesNotReached;
    nominateByAdmin(electionId: string, dto: NominateCandidateDto, nominatedByEmployeeId: string): Promise<Candidate>;
    selfNominate(electionId: string, dto: SelfNominateDto, employeeId: string): Promise<Candidate>;
    findAll(electionId: string, status?: CandidateStatus): Promise<Candidate[]>;
    findOne(electionId: string, candidateId: string): Promise<Candidate>;
    getMyCandidacy(electionId: string, employeeId: string): Promise<Candidate | null>;
    update(electionId: string, candidateId: string, dto: UpdateCandidateDto, requestingEmployeeId: string, isAdmin: boolean): Promise<Candidate>;
    review(electionId: string, candidateId: string, dto: ReviewCandidateDto, reviewerEmployeeId: string): Promise<Candidate>;
    withdraw(electionId: string, candidateId: string, requestingEmployeeId: string, isAdmin: boolean): Promise<Candidate>;
    remove(electionId: string, candidateId: string): Promise<void>;
}
