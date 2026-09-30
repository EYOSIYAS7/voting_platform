import { CandidateStatus } from '../entities/candidate.entity.js';
export declare class NominateCandidateDto {
    employeeId: string;
    statement?: string;
    slogan?: string;
    photoUrl?: string;
}
export declare class SelfNominateDto {
    statement?: string;
    slogan?: string;
    photoUrl?: string;
}
export declare class UpdateCandidateDto {
    statement?: string;
    slogan?: string;
    photoUrl?: string;
}
export declare class ReviewCandidateDto {
    status: CandidateStatus.APPROVED | CandidateStatus.REJECTED;
    rejectionReason?: string;
}
