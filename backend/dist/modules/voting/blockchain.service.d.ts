import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type PublicClient, type WalletClient, type GetContractReturnType, type Address } from 'viem';
declare const VOTING_ABI: readonly [{
    readonly name: "createElection";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "string";
        readonly name: "title";
    }, {
        readonly type: "string";
        readonly name: "description";
    }, {
        readonly type: "string";
        readonly name: "imageUrl";
    }, {
        readonly type: "uint256";
        readonly name: "registrationStart";
    }, {
        readonly type: "uint256";
        readonly name: "registrationEnd";
    }, {
        readonly type: "uint256";
        readonly name: "votingStart";
    }, {
        readonly type: "uint256";
        readonly name: "votingEnd";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "addCandidate";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "electionId";
    }, {
        readonly type: "string";
        readonly name: "name";
    }, {
        readonly type: "string";
        readonly name: "description";
    }, {
        readonly type: "string";
        readonly name: "imageUrl";
    }, {
        readonly type: "address";
        readonly name: "walletAddress";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "vote";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "electionId";
    }, {
        readonly type: "uint256";
        readonly name: "candidateId";
    }];
    readonly outputs: readonly [];
}, {
    readonly name: "hasVoted";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "electionId";
    }, {
        readonly type: "address";
        readonly name: "voter";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly name: "getResults";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "electionId";
    }];
    readonly outputs: readonly [{
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly type: "uint256";
            readonly name: "id";
        }, {
            readonly type: "uint256";
            readonly name: "electionId";
        }, {
            readonly type: "string";
            readonly name: "name";
        }, {
            readonly type: "string";
            readonly name: "description";
        }, {
            readonly type: "string";
            readonly name: "imageUrl";
        }, {
            readonly type: "address";
            readonly name: "walletAddress";
        }, {
            readonly type: "uint256";
            readonly name: "voteCount";
        }, {
            readonly type: "bool";
            readonly name: "approved";
        }, {
            readonly type: "bool";
            readonly name: "exists";
        }];
    }];
}, {
    readonly name: "getElection";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "electionId";
    }];
    readonly outputs: readonly [{
        readonly type: "tuple";
        readonly components: readonly [{
            readonly type: "uint256";
            readonly name: "id";
        }, {
            readonly type: "string";
            readonly name: "title";
        }, {
            readonly type: "string";
            readonly name: "description";
        }, {
            readonly type: "string";
            readonly name: "imageUrl";
        }, {
            readonly type: "uint256";
            readonly name: "registrationStart";
        }, {
            readonly type: "uint256";
            readonly name: "registrationEnd";
        }, {
            readonly type: "uint256";
            readonly name: "votingStart";
        }, {
            readonly type: "uint256";
            readonly name: "votingEnd";
        }, {
            readonly type: "uint256";
            readonly name: "totalVotes";
        }, {
            readonly type: "bool";
            readonly name: "exists";
        }];
    }];
}, {
    readonly name: "getElectionStatus";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "electionId";
    }];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
}, {
    readonly name: "currentTime";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "VoteCast";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "electionId";
        readonly indexed: true;
    }, {
        readonly type: "uint256";
        readonly name: "candidateId";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "voter";
        readonly indexed: true;
    }];
}, {
    readonly name: "ElectionCreated";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "electionId";
        readonly indexed: true;
    }, {
        readonly type: "string";
        readonly name: "title";
    }, {
        readonly type: "uint256";
        readonly name: "votingStart";
    }, {
        readonly type: "uint256";
        readonly name: "votingEnd";
    }];
}, {
    readonly name: "CandidateAdded";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "electionId";
        readonly indexed: true;
    }, {
        readonly type: "uint256";
        readonly name: "candidateId";
        readonly indexed: true;
    }, {
        readonly type: "string";
        readonly name: "name";
    }, {
        readonly type: "address";
        readonly name: "walletAddress";
    }, {
        readonly type: "bool";
        readonly name: "approved";
    }];
}];
export type VotingContract = GetContractReturnType<typeof VOTING_ABI, WalletClient | PublicClient>;
export declare class BlockchainService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private publicClient;
    private walletClient;
    private contractAddress;
    private besuChain;
    constructor(config: ConfigService);
    onModuleInit(): void;
    createElectionOnChain(params: {
        title: string;
        description: string;
        imageUrl: string;
        registrationStart: bigint;
        registrationEnd: bigint;
        votingStart: bigint;
        votingEnd: bigint;
    }): Promise<bigint>;
    addCandidateOnChain(params: {
        onChainElectionId: bigint;
        name: string;
        description: string;
        imageUrl: string;
        walletAddress: Address;
    }): Promise<bigint>;
    castVoteOnChain(params: {
        onChainElectionId: bigint;
        onChainCandidateId: bigint;
    }): Promise<`0x${string}`>;
    hasVotedOnChain(onChainElectionId: bigint, voterAddress: Address): Promise<boolean>;
    getResultsOnChain(onChainElectionId: bigint): Promise<readonly {
        id: bigint;
        electionId: bigint;
        name: string;
        description: string;
        imageUrl: string;
        walletAddress: `0x${string}`;
        voteCount: bigint;
        approved: boolean;
        exists: boolean;
    }[]>;
    getElectionOnChain(onChainElectionId: bigint): Promise<{
        id: bigint;
        description: string;
        imageUrl: string;
        exists: boolean;
        title: string;
        registrationStart: bigint;
        registrationEnd: bigint;
        votingStart: bigint;
        votingEnd: bigint;
        totalVotes: bigint;
    }>;
    getElectionStatusOnChain(onChainElectionId: bigint): Promise<string>;
    getServerWalletAddress(): Promise<Address>;
}
export {};
