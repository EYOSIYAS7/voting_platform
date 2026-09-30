import type { Request } from 'express';
import { VotingService } from './voting.service.js';
import { CastVoteDto, PublishElectionDto } from './dto/voting.dto.js';
export declare class VotingController {
    private readonly service;
    constructor(service: VotingService);
    publishElectionOnChain(electionId: string, dto: PublishElectionDto): Promise<{
        election: import("../election/entities/election.entity.js").Election;
        onChainElectionId: string;
    }>;
    publishCandidateOnChain(electionId: string, candidateId: string): Promise<{
        candidate: import("../candidate/entities/candidate.entity.js").Candidate;
        onChainCandidateIndex: number;
    }>;
    castVote(electionId: string, dto: CastVoteDto, req: Request): Promise<{
        txHash: string;
        candidateId: string;
        votedAt: Date;
    }>;
    getResults(electionId: string): Promise<{
        electionId: string;
        onChainElectionId: string;
        title: string;
        status: import("../election/entities/election.entity.js").ElectionStatus;
        totalVotes: number;
        candidates: {
            onChainCandidateIndex: number;
            candidateId: string | null;
            name: any;
            voteCount: number;
            percentage: string;
            statement: string | null;
            photoUrl: string | null;
            employee: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            } | null;
        }[];
    }>;
    verifyMyVote(electionId: string, req: Request): Promise<{
        voted: boolean;
        txHash: string | null;
        votedAt: Date | null;
        candidateId: null;
    }>;
}
