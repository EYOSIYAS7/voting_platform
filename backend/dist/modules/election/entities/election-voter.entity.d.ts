import { Election } from './election.entity.js';
import { Employee } from '../../employee/employee.entity.js';
export declare class ElectionVoter {
    id: string;
    electionId: string;
    election: Election;
    employeeId: string;
    employee: Employee;
    isEligible: boolean;
    txHash: string | null;
    hasVoted: boolean;
    votedAt: Date | null;
    checkedAt: Date;
}
