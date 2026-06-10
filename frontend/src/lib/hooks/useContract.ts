'use client';

import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { VOTING_PLATFORM_ABI, Election, Candidate, ElectionStatus } from '@/lib/abi/votingPlatform';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { useCallback } from 'react';

// ─── useContract: low-level helpers ──────────────────────────────────────────
export function useContractAddress() {
  return CONTRACT_ADDRESS as `0x${string}`;
}

// ─── useAllElections ──────────────────────────────────────────────────────────
export function useAllElectionIds() {
  return useReadContract({
    address:      CONTRACT_ADDRESS as `0x${string}`,
    abi:          VOTING_PLATFORM_ABI,
    functionName: 'getAllElectionIds',
  });
}

// ─── useElection ──────────────────────────────────────────────────────────────
export function useElection(id: bigint) {
  return useReadContract({
    address:      CONTRACT_ADDRESS as `0x${string}`,
    abi:          VOTING_PLATFORM_ABI,
    functionName: 'getElection',
    args:         [id],
    query:        { enabled: id > 0n },
  });
}

// ─── useElectionStatus ────────────────────────────────────────────────────────
export function useElectionStatus(id: bigint) {
  return useReadContract({
    address:      CONTRACT_ADDRESS as `0x${string}`,
    abi:          VOTING_PLATFORM_ABI,
    functionName: 'getElectionStatus',
    args:         [id],
    query:        { enabled: id > 0n, refetchInterval: 10_000 },
  });
}

// ─── useCandidates ────────────────────────────────────────────────────────────
export function useCandidateIds(electionId: bigint) {
  return useReadContract({
    address:      CONTRACT_ADDRESS as `0x${string}`,
    abi:          VOTING_PLATFORM_ABI,
    functionName: 'getCandidateIds',
    args:         [electionId],
    query:        { enabled: electionId > 0n },
  });
}

export function useCandidate(electionId: bigint, candidateId: bigint) {
  return useReadContract({
    address:      CONTRACT_ADDRESS as `0x${string}`,
    abi:          VOTING_PLATFORM_ABI,
    functionName: 'getCandidate',
    args:         [electionId, candidateId],
    query:        { enabled: electionId > 0n && candidateId > 0n },
  });
}

export function useResults(electionId: bigint) {
  return useReadContract({
    address:      CONTRACT_ADDRESS as `0x${string}`,
    abi:          VOTING_PLATFORM_ABI,
    functionName: 'getResults',
    args:         [electionId],
    query:        { enabled: electionId > 0n, refetchInterval: 8_000 },
  });
}

// ─── useHasVoted ──────────────────────────────────────────────────────────────
export function useHasVoted(electionId: bigint, voter: string) {
  return useReadContract({
    address:      CONTRACT_ADDRESS as `0x${string}`,
    abi:          VOTING_PLATFORM_ABI,
    functionName: 'hasVoted',
    args:         [electionId, voter as `0x${string}`],
    query:        { enabled: electionId > 0n && !!voter },
  });
}

export function useVoterChoice(electionId: bigint, voter: string) {
  return useReadContract({
    address:      CONTRACT_ADDRESS as `0x${string}`,
    abi:          VOTING_PLATFORM_ABI,
    functionName: 'voterChoice',
    args:         [electionId, voter as `0x${string}`],
    query:        { enabled: electionId > 0n && !!voter },
  });
}

// ─── useSuperAdmin ────────────────────────────────────────────────────────────
export function useSuperAdmin() {
  return useReadContract({
    address:      CONTRACT_ADDRESS as `0x${string}`,
    abi:          VOTING_PLATFORM_ABI,
    functionName: 'superAdmin',
  });
}

// ─── useIsAdmin ───────────────────────────────────────────────────────────────
export function useIsAdmin(address?: string) {
  return useReadContract({
    address:      CONTRACT_ADDRESS as `0x${string}`,
    abi:          VOTING_PLATFORM_ABI,
    functionName: 'isAdmin',
    args:         [address as `0x${string}`],
    query:        { enabled: !!address },
  });
}

// ─── useVote ──────────────────────────────────────────────────────────────────
export function useVote() {
  return useWriteContract();
}

// ─── useCreateElection ────────────────────────────────────────────────────────
export function useCreateElection() {
  return useWriteContract();
}

// ─── useRegisterAsCandidate ──────────────────────────────────────────────────
export function useRegisterAsCandidate() {
  return useWriteContract();
}

// ─── useAddCandidate ─────────────────────────────────────────────────────────
export function useAddCandidate() {
  return useWriteContract();
}

// ─── useApproveCandidate ──────────────────────────────────────────────────────
export function useApproveCandidate() {
  return useWriteContract();
}

// ─── useRejectCandidate ───────────────────────────────────────────────────────
export function useRejectCandidate() {
  return useWriteContract();
}

// ─── useGrantAdmin ────────────────────────────────────────────────────────────
export function useGrantAdmin() {
  return useWriteContract();
}
