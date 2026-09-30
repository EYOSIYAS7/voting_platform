import { Injectable, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
  parseAbi,
  defineChain,
  type PublicClient,
  type WalletClient,
  type GetContractReturnType,
  type Chain,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// ── Minimal ABI — only functions we call from the server ─────────────────────
const VOTING_ABI = parseAbi([
  // Election management
  'function createElection(string title, string description, string imageUrl, uint256 registrationStart, uint256 registrationEnd, uint256 votingStart, uint256 votingEnd) returns (uint256)',
  // Candidate management
  'function addCandidate(uint256 electionId, string name, string description, string imageUrl, address walletAddress) returns (uint256)',
  // Voting
  'function vote(uint256 electionId, uint256 candidateId) external',
  // Read
  'function hasVoted(uint256 electionId, address voter) view returns (bool)',
  'function getResults(uint256 electionId) view returns ((uint256 id, uint256 electionId, string name, string description, string imageUrl, address walletAddress, uint256 voteCount, bool approved, bool exists)[])',
  'function getElection(uint256 electionId) view returns ((uint256 id, string title, string description, string imageUrl, uint256 registrationStart, uint256 registrationEnd, uint256 votingStart, uint256 votingEnd, uint256 totalVotes, bool exists))',
  'function getElectionStatus(uint256 electionId) view returns (string)',
  'function currentTime() view returns (uint256)',
  // Events
  'event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, address indexed voter)',
  'event ElectionCreated(uint256 indexed electionId, string title, uint256 votingStart, uint256 votingEnd)',
  'event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name, address walletAddress, bool approved)',
]);

export type VotingContract = GetContractReturnType<typeof VOTING_ABI, WalletClient | PublicClient>;

/**
 * BlockchainService — viem wrapper around the deployed VotingPlatform contract.
 *
 * Architecture:
 *  - publicClient  → read-only calls (getResults, hasVoted, currentTime)
 *  - walletClient  → write calls signed by the server relay wallet
 *  - contractAddress → from CONTRACT_ADDRESS env var
 *  - serverAccount → from SERVER_WALLET_PRIVATE_KEY env var (the superAdmin)
 */
@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);

  private publicClient!: PublicClient;
  private walletClient!: WalletClient;
  private contractAddress!: Address;
  private besuChain!: Chain;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const rpcUrl          = this.config.get<string>('BESU_RPC_URL');
    const chainId         = parseInt(this.config.get<string>('BESU_CHAIN_ID') ?? '1337', 10);
    const contractAddress = this.config.get<string>('CONTRACT_ADDRESS');
    const privateKey      = this.config.get<string>('SERVER_WALLET_PRIVATE_KEY');

    if (!rpcUrl || !contractAddress || !privateKey) {
      this.logger.error(
        'Missing blockchain config: BESU_RPC_URL, CONTRACT_ADDRESS, SERVER_WALLET_PRIVATE_KEY must all be set.',
      );
      return;
    }

    // Define a custom chain for Hyperledger Besu (any chainId, no public explorer)
    this.besuChain = defineChain({
      id:   chainId,
      name: 'Hyperledger Besu',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [rpcUrl] },
      },
    });

    this.contractAddress = contractAddress as Address;

    const account = privateKeyToAccount(privateKey as `0x${string}`);

    this.publicClient = createPublicClient({
      chain:     this.besuChain,
      transport: http(rpcUrl),
    });

    this.walletClient = createWalletClient({
      account,
      chain:     this.besuChain,
      transport: http(rpcUrl),
    });

    this.logger.log(`✅ BlockchainService initialized`);
    this.logger.log(`   Contract : ${contractAddress}`);
    this.logger.log(`   Relay     : ${account.address}`);
    this.logger.log(`   Chain ID  : ${chainId}`);
    this.logger.log(`   RPC       : ${rpcUrl}`);
  }

  // ─────────────────── Elections ────────────────────────────────────────────

  /**
   * Publish an election to the blockchain.
   * Returns the on-chain election ID (uint256 as bigint).
   */
  async createElectionOnChain(params: {
    title:             string;
    description:       string;
    imageUrl:          string;
    registrationStart: bigint;
    registrationEnd:   bigint;
    votingStart:       bigint;
    votingEnd:         bigint;
  }): Promise<bigint> {
    const { request } = await this.publicClient.simulateContract({
      address:      this.contractAddress,
      abi:          VOTING_ABI,
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

    // Decode the ElectionCreated event to extract the electionId
    const log = receipt.logs.find((l) =>
      l.address.toLowerCase() === this.contractAddress.toLowerCase(),
    );
    if (!log) throw new InternalServerErrorException('ElectionCreated event not found in receipt');

    // The first indexed topic (topic[1]) is the electionId as a bytes32 padded uint256
    const electionId = BigInt(log.topics[1] as string);
    return electionId;
  }

  // ─────────────────── Candidates ───────────────────────────────────────────

  /**
   * Register a pre-approved candidate on-chain.
   * Returns the on-chain candidate ID (uint256 as bigint).
   */
  async addCandidateOnChain(params: {
    onChainElectionId: bigint;
    name:              string;
    description:       string;
    imageUrl:          string;
    walletAddress:     Address;
  }): Promise<bigint> {
    const { request } = await this.publicClient.simulateContract({
      address:      this.contractAddress,
      abi:          VOTING_ABI,
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

    const log = receipt.logs.find((l) =>
      l.address.toLowerCase() === this.contractAddress.toLowerCase(),
    );
    if (!log) throw new InternalServerErrorException('CandidateAdded event not found in receipt');

    // topic[2] = candidateId
    const candidateId = BigInt(log.topics[2] as string);
    return candidateId;
  }

  // ─────────────────── Voting ───────────────────────────────────────────────

  /**
   * Cast a vote on-chain. The server relay wallet is msg.sender.
   * Returns the transaction hash for record-keeping.
   */
  async castVoteOnChain(params: {
    onChainElectionId:  bigint;
    onChainCandidateId: bigint;
  }): Promise<`0x${string}`> {
    const { request } = await this.publicClient.simulateContract({
      address:      this.contractAddress,
      abi:          VOTING_ABI,
      functionName: 'vote',
      args:         [params.onChainElectionId, params.onChainCandidateId],
      account:      this.walletClient.account,
    });

    const txHash = await this.walletClient.writeContract(request);
    this.logger.log(`vote tx: ${txHash}`);

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== 'success') {
      throw new InternalServerErrorException(`vote tx reverted: ${txHash}`);
    }

    return txHash;
  }

  // ─────────────────── Read-only ────────────────────────────────────────────

  async hasVotedOnChain(onChainElectionId: bigint, voterAddress: Address): Promise<boolean> {
    return this.publicClient.readContract({
      address:      this.contractAddress,
      abi:          VOTING_ABI,
      functionName: 'hasVoted',
      args:         [onChainElectionId, voterAddress],
    }) as Promise<boolean>;
  }

  async getResultsOnChain(onChainElectionId: bigint) {
    return this.publicClient.readContract({
      address:      this.contractAddress,
      abi:          VOTING_ABI,
      functionName: 'getResults',
      args:         [onChainElectionId],
    });
  }

  async getElectionOnChain(onChainElectionId: bigint) {
    return this.publicClient.readContract({
      address:      this.contractAddress,
      abi:          VOTING_ABI,
      functionName: 'getElection',
      args:         [onChainElectionId],
    });
  }

  async getElectionStatusOnChain(onChainElectionId: bigint): Promise<string> {
    return this.publicClient.readContract({
      address:      this.contractAddress,
      abi:          VOTING_ABI,
      functionName: 'getElectionStatus',
      args:         [onChainElectionId],
    }) as Promise<string>;
  }

  async getServerWalletAddress(): Promise<Address> {
    return this.walletClient.account!.address as Address;
  }
}
