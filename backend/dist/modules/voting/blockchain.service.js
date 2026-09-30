var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BlockchainService_1;
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, createWalletClient, http, parseAbi, defineChain, } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
const VOTING_ABI = parseAbi([
    'function createElection(string title, string description, string imageUrl, uint256 registrationStart, uint256 registrationEnd, uint256 votingStart, uint256 votingEnd) returns (uint256)',
    'function addCandidate(uint256 electionId, string name, string description, string imageUrl, address walletAddress) returns (uint256)',
    'function vote(uint256 electionId, uint256 candidateId) external',
    'function hasVoted(uint256 electionId, address voter) view returns (bool)',
    'function getResults(uint256 electionId) view returns ((uint256 id, uint256 electionId, string name, string description, string imageUrl, address walletAddress, uint256 voteCount, bool approved, bool exists)[])',
    'function getElection(uint256 electionId) view returns ((uint256 id, string title, string description, string imageUrl, uint256 registrationStart, uint256 registrationEnd, uint256 votingStart, uint256 votingEnd, uint256 totalVotes, bool exists))',
    'function getElectionStatus(uint256 electionId) view returns (string)',
    'function currentTime() view returns (uint256)',
    'event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, address indexed voter)',
    'event ElectionCreated(uint256 indexed electionId, string title, uint256 votingStart, uint256 votingEnd)',
    'event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name, address walletAddress, bool approved)',
]);
let BlockchainService = BlockchainService_1 = class BlockchainService {
    config;
    logger = new Logger(BlockchainService_1.name);
    publicClient;
    walletClient;
    contractAddress;
    besuChain;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        const rpcUrl = this.config.get('BESU_RPC_URL');
        const chainId = parseInt(this.config.get('BESU_CHAIN_ID') ?? '1337', 10);
        const contractAddress = this.config.get('CONTRACT_ADDRESS');
        const privateKey = this.config.get('SERVER_WALLET_PRIVATE_KEY');
        if (!rpcUrl || !contractAddress || !privateKey) {
            this.logger.error('Missing blockchain config: BESU_RPC_URL, CONTRACT_ADDRESS, SERVER_WALLET_PRIVATE_KEY must all be set.');
            return;
        }
        this.besuChain = defineChain({
            id: chainId,
            name: 'Hyperledger Besu',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
                default: { http: [rpcUrl] },
            },
        });
        this.contractAddress = contractAddress;
        const account = privateKeyToAccount(privateKey);
        this.publicClient = createPublicClient({
            chain: this.besuChain,
            transport: http(rpcUrl),
        });
        this.walletClient = createWalletClient({
            account,
            chain: this.besuChain,
            transport: http(rpcUrl),
        });
        this.logger.log(`✅ BlockchainService initialized`);
        this.logger.log(`   Contract : ${contractAddress}`);
        this.logger.log(`   Relay     : ${account.address}`);
        this.logger.log(`   Chain ID  : ${chainId}`);
        this.logger.log(`   RPC       : ${rpcUrl}`);
    }
    async createElectionOnChain(params) {
        const { request } = await this.publicClient.simulateContract({
            address: this.contractAddress,
            abi: VOTING_ABI,
            functionName: 'createElection',
            args: [
                params.title,
                params.description,
                params.imageUrl,
                params.registrationStart,
                params.registrationEnd,
                params.votingStart,
                params.votingEnd,
            ],
            account: this.walletClient.account,
        });
        const txHash = await this.walletClient.writeContract(request);
        this.logger.log(`createElection tx: ${txHash}`);
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status !== 'success') {
            throw new InternalServerErrorException(`createElection tx reverted: ${txHash}`);
        }
        const log = receipt.logs.find((l) => l.address.toLowerCase() === this.contractAddress.toLowerCase());
        if (!log)
            throw new InternalServerErrorException('ElectionCreated event not found in receipt');
        const electionId = BigInt(log.topics[1]);
        return electionId;
    }
    async addCandidateOnChain(params) {
        const { request } = await this.publicClient.simulateContract({
            address: this.contractAddress,
            abi: VOTING_ABI,
            functionName: 'addCandidate',
            args: [
                params.onChainElectionId,
                params.name,
                params.description,
                params.imageUrl,
                params.walletAddress,
            ],
            account: this.walletClient.account,
        });
        const txHash = await this.walletClient.writeContract(request);
        this.logger.log(`addCandidate tx: ${txHash}`);
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status !== 'success') {
            throw new InternalServerErrorException(`addCandidate tx reverted: ${txHash}`);
        }
        const log = receipt.logs.find((l) => l.address.toLowerCase() === this.contractAddress.toLowerCase());
        if (!log)
            throw new InternalServerErrorException('CandidateAdded event not found in receipt');
        const candidateId = BigInt(log.topics[2]);
        return candidateId;
    }
    async castVoteOnChain(params) {
        const { request } = await this.publicClient.simulateContract({
            address: this.contractAddress,
            abi: VOTING_ABI,
            functionName: 'vote',
            args: [params.onChainElectionId, params.onChainCandidateId],
            account: this.walletClient.account,
        });
        const txHash = await this.walletClient.writeContract(request);
        this.logger.log(`vote tx: ${txHash}`);
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status !== 'success') {
            throw new InternalServerErrorException(`vote tx reverted: ${txHash}`);
        }
        return txHash;
    }
    async hasVotedOnChain(onChainElectionId, voterAddress) {
        return this.publicClient.readContract({
            address: this.contractAddress,
            abi: VOTING_ABI,
            functionName: 'hasVoted',
            args: [onChainElectionId, voterAddress],
        });
    }
    async getResultsOnChain(onChainElectionId) {
        return this.publicClient.readContract({
            address: this.contractAddress,
            abi: VOTING_ABI,
            functionName: 'getResults',
            args: [onChainElectionId],
        });
    }
    async getElectionOnChain(onChainElectionId) {
        return this.publicClient.readContract({
            address: this.contractAddress,
            abi: VOTING_ABI,
            functionName: 'getElection',
            args: [onChainElectionId],
        });
    }
    async getElectionStatusOnChain(onChainElectionId) {
        return this.publicClient.readContract({
            address: this.contractAddress,
            abi: VOTING_ABI,
            functionName: 'getElectionStatus',
            args: [onChainElectionId],
        });
    }
    async getServerWalletAddress() {
        return this.walletClient.account.address;
    }
};
BlockchainService = BlockchainService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], BlockchainService);
export { BlockchainService };
//# sourceMappingURL=blockchain.service.js.map