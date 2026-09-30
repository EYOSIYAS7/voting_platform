import { ElectionType, ElectionStatus } from '../entities/election.entity.js';
export declare class CreateElectionDto {
    title: string;
    description?: string;
    organizationId: string;
    electionType?: ElectionType;
    unitScopeId?: string;
    registrationDeadline?: string;
    startDate: string;
    endDate: string;
    maxCandidates?: number;
}
declare const UpdateElectionDto_base: import("@nestjs/common").Type<Partial<CreateElectionDto>>;
export declare class UpdateElectionDto extends UpdateElectionDto_base {
}
export declare class PatchElectionStatusDto {
    status: ElectionStatus;
}
export declare class CreateEligibilityRuleDto {
    unitId?: string;
    includeDescendants?: boolean;
    allowedPositionIds?: string[];
    minTenureMonths?: number;
    requiredStatus?: string;
    description?: string;
}
export {};
