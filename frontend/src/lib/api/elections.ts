import { api } from './client';
import {
  Election,
  ElectionStatus,
  CreateElectionDto,
  UpdateElectionDto,
  EligibilityRule,
  CreateEligibilityRuleDto,
  ElectionVoter,
  EligibilityCheckResponse,
  Candidate,
  CandidateStatus,
  SelfNominateDto,
  NominateCandidateDto,
  UpdateCandidateDto,
  ReviewCandidateDto,
  PublishElectionDto,
  CastVoteDto,
  CastVoteResponse,
  VotingResultsResponse,
  VoteProofResponse,
} from '../types/api';

export const electionsApi = {
  /** List all elections, optionally filtered by status */
  getElections(params?: { organizationId?: string; status?: ElectionStatus }): Promise<Election[]> {
    return api.get<Election[]>('/elections', { params });
  },

  /** Get elections the authenticated employee is eligible to participate in */
  getMyElections(): Promise<Election[]> {
    return api.get<Election[]>('/elections/mine');
  },

  /** Get election by ID including rules */
  getElection(id: string): Promise<Election> {
    return api.get<Election>(`/elections/${id}`);
  },

  /** Create new election (Admin) */
  createElection(dto: CreateElectionDto): Promise<Election> {
    return api.post<Election>('/elections', dto);
  },

  /** Update draft election (Admin) */
  updateElection(id: string, dto: UpdateElectionDto): Promise<Election> {
    return api.put<Election>(`/elections/${id}`, dto);
  },

  /** Advance or change election lifecycle status */
  patchStatus(id: string, status: ElectionStatus): Promise<Election> {
    return api.patch<Election>(`/elections/${id}/status`, { status });
  },

  // ── Eligibility Rules ────────────────────────────────────────────────────────

  getEligibilityRules(id: string): Promise<EligibilityRule[]> {
    return api.get<EligibilityRule[]>(`/elections/${id}/eligibility-rules`);
  },

  addEligibilityRule(id: string, dto: CreateEligibilityRuleDto): Promise<EligibilityRule> {
    return api.post<EligibilityRule>(`/elections/${id}/eligibility-rules`, dto);
  },

  removeEligibilityRule(electionId: string, ruleId: string): Promise<void> {
    return api.delete<void>(`/elections/${electionId}/eligibility-rules/${ruleId}`);
  },

  computeEligibleVoters(id: string): Promise<{ electionId: string; eligibleCount: number }> {
    return api.post<{ electionId: string; eligibleCount: number }>(`/elections/${id}/compute-voters`);
  },

  getVoters(
    id: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: ElectionVoter[]; total: number; page: number; limit: number }> {
    return api.get<{ data: ElectionVoter[]; total: number; page: number; limit: number }>(
      `/elections/${id}/voters`,
      { params: { page, limit } }
    );
  },

  checkMyEligibility(id: string): Promise<EligibilityCheckResponse> {
    return api.get<EligibilityCheckResponse>(`/elections/${id}/my-eligibility`);
  },

  // ── Candidates ───────────────────────────────────────────────────────────────

  getCandidates(electionId: string, status?: CandidateStatus): Promise<Candidate[]> {
    return api.get<Candidate[]>(`/elections/${electionId}/candidates`, {
      params: { status },
    });
  },

  getMyCandidacy(electionId: string): Promise<Candidate | null> {
    return api.get<Candidate | null>(`/elections/${electionId}/candidates/me`);
  },

  getCandidate(electionId: string, candidateId: string): Promise<Candidate> {
    return api.get<Candidate>(`/elections/${electionId}/candidates/${candidateId}`);
  },

  selfNominate(electionId: string, dto: SelfNominateDto): Promise<Candidate> {
    return api.post<Candidate>(`/elections/${electionId}/candidates/self-nominate`, dto);
  },

  nominateByAdmin(electionId: string, dto: NominateCandidateDto): Promise<Candidate> {
    return api.post<Candidate>(`/elections/${electionId}/candidates/nominate`, dto);
  },

  updateCandidate(
    electionId: string,
    candidateId: string,
    dto: UpdateCandidateDto
  ): Promise<Candidate> {
    return api.patch<Candidate>(`/elections/${electionId}/candidates/${candidateId}`, dto);
  },

  reviewCandidate(
    electionId: string,
    candidateId: string,
    dto: ReviewCandidateDto
  ): Promise<Candidate> {
    return api.patch<Candidate>(
      `/elections/${electionId}/candidates/${candidateId}/review`,
      dto
    );
  },

  withdrawCandidacy(electionId: string, candidateId: string): Promise<Candidate> {
    return api.patch<Candidate>(`/elections/${electionId}/candidates/${candidateId}/withdraw`, {});
  },

  // ── Voting & Blockchain Relay ────────────────────────────────────────────────

  publishElectionOnChain(
    electionId: string,
    dto: PublishElectionDto = {}
  ): Promise<{ electionId: string; onChainElectionId: string; txHash: string }> {
    return api.post<{ electionId: string; onChainElectionId: string; txHash: string }>(
      `/elections/${electionId}/publish-onchain`,
      dto
    );
  },

  publishCandidateOnChain(
    electionId: string,
    candidateId: string
  ): Promise<{ candidateId: string; onChainCandidateIndex: number; txHash: string }> {
    return api.post<{ candidateId: string; onChainCandidateIndex: number; txHash: string }>(
      `/elections/${electionId}/candidates/${candidateId}/publish-onchain`,
      {}
    );
  },

  castVote(electionId: string, dto: CastVoteDto): Promise<CastVoteResponse> {
    return api.post<CastVoteResponse>(`/elections/${electionId}/vote`, dto);
  },

  getResults(electionId: string): Promise<VotingResultsResponse> {
    return api.get<VotingResultsResponse>(`/elections/${electionId}/results`);
  },

  verifyMyVote(electionId: string): Promise<VoteProofResponse> {
    return api.get<VoteProofResponse>(`/elections/${electionId}/verify-vote`);
  },
};
