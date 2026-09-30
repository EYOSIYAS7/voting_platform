import { Repository, DataSource } from 'typeorm';
import { Election, ElectionStatus } from '../election/entities/election.entity.js';
import { ElectionVoter } from '../election/entities/election-voter.entity.js';
import { Candidate } from '../candidate/entities/candidate.entity.js';
import { WalletBinding } from '../auth/entities/wallet-binding.entity.js';
import { BlockchainService } from './blockchain.service.js';
import { CastVoteDto, PublishElectionDto } from './dto/voting.dto.js';
export declare class VotingService {
    private readonly electionRepo;
    private readonly voterRepo;
    private readonly candidateRepo;
    private readonly walletRepo;
    private readonly blockchain;
    private readonly dataSource;
    private readonly logger;
    constructor(electionRepo: Repository<Election>, voterRepo: Repository<ElectionVoter>, candidateRepo: Repository<Candidate>, walletRepo: Repository<WalletBinding>, blockchain: BlockchainService, dataSource: DataSource);
    publishElectionOnChain(electionId: string, dto: PublishElectionDto): Promise<{
        election: Election;
        onChainElectionId: string;
    }>;
    publishCandidateOnChain(electionId: string, candidateId: string): Promise<{
        candidate: Candidate;
        onChainCandidateIndex: number;
    }>;
    castVote(electionId: string, dto: CastVoteDto, employeeId: string): Promise<{
        txHash: string;
        candidateId: string;
        votedAt: Date;
    }>;
    getResults(electionId: string): Promise<{
        electionId: string;
        onChainElectionId: string;
        title: string;
        status: ElectionStatus;
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
    verifyMyVote(electionId: string, employeeId: string): Promise<{
        voted: boolean;
        txHash: string | null;
        votedAt: Date | null;
        candidateId: null;
    }>;
    private requireElection;
}
