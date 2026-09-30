import { Election } from '../../election/entities/election.entity.js';
import { Employee } from '../../employee/employee.entity.js';
export declare enum CandidateStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    WITHDRAWN = "WITHDRAWN"
}
export declare class Candidate {
    id: string;
    electionId: string;
    election: Election;
    employeeId: string;
    employee: Employee;
    statement: string | null;
    slogan: string | null;
    photoUrl: string | null;
    status: CandidateStatus;
    rejectionReason: string | null;
    onChainCandidateIndex: number | null;
    nominatedByEmployeeId: string | null;
    reviewedByEmployeeId: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
