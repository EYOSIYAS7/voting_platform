import { Organization } from '../../organization/organization.entity.js';
export declare enum ElectionType {
    GENERAL = "GENERAL",
    UNIT_SCOPED = "UNIT_SCOPED",
    POSITION_SCOPED = "POSITION_SCOPED"
}
export declare enum ElectionStatus {
    DRAFT = "DRAFT",
    REGISTRATION = "REGISTRATION",
    UPCOMING = "UPCOMING",
    ACTIVE = "ACTIVE",
    ENDED = "ENDED",
    CANCELLED = "CANCELLED"
}
export declare class Election {
    id: string;
    organizationId: string;
    organization: Organization;
    title: string;
    description: string | null;
    electionType: ElectionType;
    status: ElectionStatus;
    unitScopeId: string | null;
    registrationDeadline: Date | null;
    startDate: Date;
    endDate: Date;
    onChainElectionId: string | null;
    maxCandidates: number;
    votersComputed: boolean;
    createdByEmployeeId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
