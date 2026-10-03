/**
 * Domain Type Definitions for INSA E-Voting Platform
 * Synchronized with NestJS backend modules and TypeORM entities
 */

export enum SystemRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  ELECTION_ADMIN = 'ELECTION_ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  AUDITOR = 'AUDITOR',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  TERMINATED = 'TERMINATED',
}

export enum UnitType {
  DIRECTORATE = 'DIRECTORATE',
  DIVISION = 'DIVISION',
  DEPARTMENT = 'DEPARTMENT',
  TEAM = 'TEAM',
  BRANCH = 'BRANCH',
}

export enum ElectionType {
  GENERAL = 'GENERAL',
  UNIT_SCOPED = 'UNIT_SCOPED',
  POSITION_SCOPED = 'POSITION_SCOPED',
}

export enum ElectionStatus {
  DRAFT = 'DRAFT',
  REGISTRATION = 'REGISTRATION',
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export enum CandidateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum WalletBindingStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REVOKED = 'REVOKED',
}

// ── Auth & Account Types ───────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: string;
  mustChangePassword: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserAccount {
  id: string;
  employeeId: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  lockedUntil: string | null;
}

export interface UserRoleScope {
  role: SystemRole;
  orgUnitId: string | null;
}

export interface AuthenticatedUser {
  userId: string;
  employeeId: string;
  email: string;
  roles: SystemRole[];
  scopes: Array<{ roleId: string; orgUnitId: string | null }>;
  mustChangePassword: boolean;
}

export interface UserProfileResponse {
  account: {
    id: string;
    mustChangePassword: boolean;
    lastLoginAt: string | null;
    isActive: boolean;
  };
  employee: EmployeeWithDetails;
  roles: UserRoleScope[];
  walletBinding: {
    address: string;
    verifiedAt: string;
  } | null;
}

// ── Wallet Binding ────────────────────────────────────────────────────────────

export interface WalletChallengeRequest {
  walletAddress: string;
}

export interface WalletChallengeResponse {
  challenge: string;
  message: string;
}

export interface WalletVerifyRequest {
  walletAddress: string;
  challenge: string;
  signature: string;
}

export interface WalletBinding {
  id: string;
  employeeId: string;
  walletAddress: string;
  status: WalletBindingStatus;
  verifiedAt: string | null;
  createdAt: string;
}

// ── Organizational Entities ───────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationalUnit {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  type: UnitType;
  parentId?: string | null;
  parent?: OrganizationalUnit | null;
  children?: OrganizationalUnit[];
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  organizationId: string;
  title: string;
  code: string;
  level: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  organizationalUnitId: string;
  positionId?: string | null;
  status: EmployeeStatus;
  profileImageUrl?: string | null;
  hiredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeWithDetails extends Employee {
  organizationalUnit?: OrganizationalUnit;
  position?: Position;
}

// ── Election Entities ─────────────────────────────────────────────────────────

export interface Election {
  id: string;
  organizationId: string;
  organization?: Organization;
  title: string;
  description: string | null;
  electionType: ElectionType;
  status: ElectionStatus;
  unitScopeId: string | null;
  registrationDeadline: string | null;
  startDate: string;
  endDate: string;
  onChainElectionId: string | null;
  maxCandidates: number;
  votersComputed: boolean;
  createdByEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
  rules?: EligibilityRule[];
}

export interface CreateElectionDto {
  title: string;
  description?: string;
  electionType?: ElectionType;
  organizationId: string;
  unitScopeId?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  maxCandidates?: number;
}

export interface UpdateElectionDto {
  title?: string;
  description?: string;
  electionType?: ElectionType;
  unitScopeId?: string;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  maxCandidates?: number;
}

export interface PatchElectionStatusDto {
  status: ElectionStatus;
}

// ── Eligibility Engine ────────────────────────────────────────────────────────

export interface EligibilityRule {
  id: string;
  electionId: string;
  unitId: string | null;
  includeDescendants: boolean;
  allowedPositionIds: string[] | null;
  minTenureMonths: number;
  requiredStatus: string;
  description: string | null;
  createdAt: string;
}

export interface CreateEligibilityRuleDto {
  unitId?: string;
  includeDescendants?: boolean;
  allowedPositionIds?: string[];
  minTenureMonths?: number;
  requiredStatus?: string;
  description?: string;
}

export interface ElectionVoter {
  id: string;
  electionId: string;
  employeeId: string;
  employee?: EmployeeWithDetails;
  isEligible: boolean;
  txHash: string | null;
  hasVoted: boolean;
  votedAt: string | null;
  checkedAt: string;
}

export interface EligibilityCheckResponse {
  electionId: string;
  employeeId: string;
  isEligible: boolean;
  hasVoted: boolean;
  votedAt: string | null;
  reason?: string;
}

// ── Candidate Management ──────────────────────────────────────────────────────

export interface Candidate {
  id: string;
  electionId: string;
  employeeId: string;
  employee?: EmployeeWithDetails;
  statement: string | null;
  slogan: string | null;
  photoUrl: string | null;
  status: CandidateStatus;
  rejectionReason: string | null;
  onChainCandidateIndex: number | null;
  nominatedByEmployeeId: string | null;
  reviewedByEmployeeId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SelfNominateDto {
  statement?: string;
  slogan?: string;
  photoUrl?: string;
}

export interface NominateCandidateDto extends SelfNominateDto {
  employeeId: string;
}

export interface UpdateCandidateDto {
  statement?: string;
  slogan?: string;
  photoUrl?: string;
}

export interface ReviewCandidateDto {
  status: CandidateStatus.APPROVED | CandidateStatus.REJECTED;
  rejectionReason?: string;
}

// ── Voting & Live On-Chain Results ────────────────────────────────────────────

export interface PublishElectionDto {
  imageUrl?: string;
}

export interface CastVoteDto {
  candidateId: string;
  note?: string;
}

export interface CastVoteResponse {
  txHash: string;
  blockNumber: number;
  timestamp: string;
  electionId: string;
  onChainElectionId: string;
  message: string;
}

export interface CandidateResult {
  onChainCandidateIndex: number;
  candidateId: string | null;
  name: string;
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
}

export interface VotingResultsResponse {
  electionId: string;
  onChainElectionId: string | null;
  title: string;
  status: ElectionStatus;
  totalVotes: number;
  candidates: CandidateResult[];
}

export interface VoteProofResponse {
  voted: boolean;
  txHash: string | null;
  votedAt: string | null;
  candidateId: null; // intentionally null to preserve ballot secrecy
}
