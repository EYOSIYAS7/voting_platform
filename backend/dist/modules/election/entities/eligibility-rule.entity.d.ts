import { Election } from './election.entity.js';
export declare class EligibilityRule {
    id: string;
    electionId: string;
    election: Election;
    unitId: string | null;
    includeDescendants: boolean;
    allowedPositionIds: string[] | null;
    minTenureMonths: number;
    requiredStatus: string;
    description: string | null;
    createdAt: Date;
}
