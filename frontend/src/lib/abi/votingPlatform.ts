// ABI for VotingPlatform.sol
// Source of truth: the compiled JSON ABI produced by the deploy script.
// Using the compiled ABI ensures wagmi/viem decodes all responses correctly.
import { Abi } from 'viem';
import deployedJson from './VotingPlatform.json';

export const VOTING_PLATFORM_ABI = deployedJson.abi as unknown as Abi;

export type ElectionStatus = "Pending" | "Registration" | "Upcoming" | "Active" | "Ended";

export interface Election {
  id: bigint;
  title: string;
  description: string;
  imageUrl: string;
  registrationStart: bigint;
  registrationEnd: bigint;
  votingStart: bigint;
  votingEnd: bigint;
  totalVotes: bigint;
  exists: boolean;
  status?: ElectionStatus;
}

export interface Candidate {
  id: bigint;
  electionId: bigint;
  name: string;
  description: string;
  imageUrl: string;
  walletAddress: string;
  voteCount: bigint;
  approved: boolean;
  exists: boolean;
}
