'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { electionsApi } from '@/lib/api/elections';
import { organizationsApi } from '@/lib/api/organizations';
import { employeesApi } from '@/lib/api/employees';
import {
  Election,
  ElectionStatus,
  ElectionType,
  Candidate,
  CandidateStatus,
  EligibilityRule,
  ElectionVoter,
  OrganizationalUnit,
  Position,
  EmployeeWithDetails,
  EmployeeStatus,
  SystemRole,
  VotingResultsResponse,
} from '@/lib/types/api';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Vote,
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Loader2,
  X,
  FileText,
  AlertCircle,
  Building2,
  Search,
} from 'lucide-react';
import styles from './manage-election.module.css';

const LIFECYCLE_STEPS: { status: ElectionStatus; label: string; number: number }[] = [
  { status: ElectionStatus.DRAFT, label: 'Draft', number: 1 },
  { status: ElectionStatus.REGISTRATION, label: 'Registration', number: 2 },
  { status: ElectionStatus.UPCOMING, label: 'Review & Finalize', number: 3 },
  { status: ElectionStatus.ACTIVE, label: 'Live Voting', number: 4 },
  { status: ElectionStatus.ENDED, label: 'Concluded', number: 5 },
];

const NEXT_STATUS_MAP: Partial<Record<ElectionStatus, { next: ElectionStatus; actionLabel: string }>> = {
  [ElectionStatus.DRAFT]: {
    next: ElectionStatus.REGISTRATION,
    actionLabel: 'Open Candidate Registration',
  },
  [ElectionStatus.REGISTRATION]: {
    next: ElectionStatus.UPCOMING,
    actionLabel: 'Close Registration & Review',
  },
  [ElectionStatus.UPCOMING]: {
    next: ElectionStatus.ACTIVE,
    actionLabel: 'Start Live Voting & Publish to Chain',
  },
  [ElectionStatus.ACTIVE]: {
    next: ElectionStatus.ENDED,
    actionLabel: 'End Voting & Conclude',
  },
};

export default function ManageElectionPage() {
  const params = useParams<{ id: string }>();
  const electionId = params.id;
  const router = useRouter();

  const { isAuthenticated, isInitialized, hasRole, employee } = useAuthStore();
  const canManage =
    hasRole(SystemRole.ELECTION_ADMIN) || hasRole(SystemRole.SYSTEM_ADMIN);
  const isSysAdmin = hasRole(SystemRole.SYSTEM_ADMIN);

  // Core Data
  const [election, setElection] = useState<Election | null>(null);
  const [rules, setRules] = useState<EligibilityRule[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voters, setVoters] = useState<ElectionVoter[]>([]);
  const [voterTotal, setVoterTotal] = useState(0);
  const [voterPage, setVoterPage] = useState(1);
  const [results, setResults] = useState<VotingResultsResponse | null>(null);

  // Metadata for Lookups
  const [orgUnits, setOrgUnits] = useState<OrganizationalUnit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  // Page UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'rules' | 'results'>('overview');
  const [candidateFilter, setCandidateFilter] = useState<'ALL' | CandidateStatus>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [rejectingCandidate, setRejectingCandidate] = useState<Candidate | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Add Rule Form State
  const [ruleType, setRuleType] = useState<'scope' | 'employee'>('scope');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [includeDescendants, setIncludeDescendants] = useState(true);
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([]);
  const [minTenureMonths, setMinTenureMonths] = useState(0);
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');

  // Nominate Candidate Form State
  const [nomineeSearch, setNomineeSearch] = useState('');
  const [nomineeResults, setNomineeResults] = useState<EmployeeWithDetails[]>([]);
  const [selectedNominee, setSelectedNominee] = useState<EmployeeWithDetails | null>(null);
  const [nomineeStatement, setNomineeStatement] = useState('');
  const [nomineeSlogan, setNomineeSlogan] = useState('');

  // Access Guard
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !canManage) {
        router.replace('/dashboard');
      }
    }
  }, [isInitialized, isAuthenticated, canManage, router]);

  // Load Metadata (units & positions)
  useEffect(() => {
    async function loadMetadata() {
      try {
        const orgs = await organizationsApi.getOrganizations();
        if (orgs.length > 0) {
          const orgId = orgs[0].id;
          const [u, p] = await Promise.all([
            organizationsApi.getOrgUnits(orgId),
            organizationsApi.getPositions(),
          ]);
          setOrgUnits(u);
          setPositions(p);
        }
      } catch (err) {
        console.error('Failed to load organization metadata:', err);
      }
    }
    if (isAuthenticated) {
      loadMetadata();
    }
  }, [isAuthenticated]);

  // Load Main Election Data
  const loadElectionData = useCallback(async () => {
    if (!electionId) return;
    try {
      setIsLoading(true);
      const [elData, rulesData, candData] = await Promise.all([
        electionsApi.getElection(electionId),
        electionsApi.getEligibilityRules(electionId),
        electionsApi.getCandidates(electionId),
      ]);

      // Creator check: allow if creator or system admin
      if (!isSysAdmin && elData.createdByEmployeeId && employee?.id && elData.createdByEmployeeId !== employee.id) {
        router.replace('/my-elections');
        return;
      }

      setElection(elData);
      setRules(rulesData);
      setCandidates(candData);

      // Load voters if computed
      if (elData.votersComputed) {
        try {
          const vData = await electionsApi.getVoters(electionId, voterPage, 20);
          setVoters(vData.data);
          setVoterTotal(vData.total);
        } catch (e) {
          console.error('Failed to load voters roll:', e);
        }
      }

      // Load results if active or ended
      if (elData.status === ElectionStatus.ACTIVE || elData.status === ElectionStatus.ENDED) {
        try {
          const resData = await electionsApi.getResults(electionId);
          setResults(resData);
        } catch (e) {
          console.error('Failed to load live results:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load election workspace:', err);
      setFeedbackMessage({ type: 'error', text: 'Could not load election details.' });
    } finally {
      setIsLoading(false);
    }
  }, [electionId, isSysAdmin, employee?.id, voterPage, router]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && canManage) {
      loadElectionData();
    }
  }, [isInitialized, isAuthenticated, canManage, loadElectionData]);

  // Search nominees when nominating
  useEffect(() => {
    if (!showNominateModal || !nomineeSearch.trim()) {
      setNomineeResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const found = await employeesApi.getEmployees({
          search: nomineeSearch.trim(),
          status: EmployeeStatus.ACTIVE,
        });
        setNomineeResults(found.slice(0, 8));
      } catch (e) {
        console.error('Employee search failed:', e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [showNominateModal, nomineeSearch]);

  // Lifecycle Advancement
  const handleAdvanceStatus = async () => {
    if (!election) return;
    const transition = NEXT_STATUS_MAP[election.status];
    if (!transition) return;

    try {
      setActionLoading(true);
      const updated = await electionsApi.patchStatus(election.id, transition.next);
      setElection(updated);
      setShowAdvanceModal(false);
      setFeedbackMessage({
        type: 'success',
        text: `Election successfully transitioned to ${transition.next}.`,
      });
      loadElectionData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status transition failed.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Lifecycle Cancellation
  const handleCancelElection = async () => {
    if (!election) return;
    try {
      setActionLoading(true);
      const updated = await electionsApi.patchStatus(election.id, ElectionStatus.CANCELLED);
      setElection(updated);
      setShowCancelModal(false);
      setFeedbackMessage({
        type: 'success',
        text: 'Election has been cancelled.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Publish to Hyperledger Besu On-Chain
  const handlePublishOnChain = async () => {
    if (!election) return;
    try {
      setActionLoading(true);
      const res = await electionsApi.publishElectionOnChain(election.id, {});
      setShowPublishModal(false);
      setFeedbackMessage({
        type: 'success',
        text: `Election published to Hyperledger Besu on-chain with ID #${res.onChainElectionId}!`,
      });
      loadElectionData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Publishing on-chain failed.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Candidate Review (Approve / Reject)
  const handleReviewCandidate = async (candidateId: string, status: CandidateStatus.APPROVED | CandidateStatus.REJECTED, reason?: string) => {
    if (!election) return;
    try {
      setActionLoading(true);
      await electionsApi.reviewCandidate(election.id, candidateId, {
        status,
        rejectionReason: reason,
      });
      setFeedbackMessage({
        type: 'success',
        text: `Candidate ${status === CandidateStatus.APPROVED ? 'approved' : 'rejected'} successfully.`,
      });
      setRejectingCandidate(null);
      setRejectionReason('');
      loadElectionData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Review action failed.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Publish Candidate On-Chain
  const handlePublishCandidateOnChain = async (candidateId: string) => {
    if (!election) return;
    try {
      setActionLoading(true);
      const res = await electionsApi.publishCandidateOnChain(election.id, candidateId);
      setFeedbackMessage({
        type: 'success',
        text: `Candidate published to on-chain ballot at slot #${res.onChainCandidateIndex}!`,
      });
      loadElectionData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Publishing candidate on-chain failed.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Nominate Candidate
  const handleCreateNomination = async () => {
    if (!election || !selectedNominee) return;
    try {
      setActionLoading(true);
      await electionsApi.nominateByAdmin(election.id, {
        employeeId: selectedNominee.id,
        statement: nomineeStatement.trim() || undefined,
        slogan: nomineeSlogan.trim() || undefined,
      });
      setShowNominateModal(false);
      setSelectedNominee(null);
      setNomineeSearch('');
      setNomineeStatement('');
      setNomineeSlogan('');
      setFeedbackMessage({
        type: 'success',
        text: `Candidate ${selectedNominee.firstName} ${selectedNominee.lastName} successfully nominated!`,
      });
      loadElectionData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nomination failed.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Compute Eligible Voter Roll
  const handleComputeRoll = async () => {
    if (!election) return;
    try {
      setActionLoading(true);
      const res = await electionsApi.computeEligibleVoters(election.id);
      setFeedbackMessage({
        type: 'success',
        text: `Voter roll computed! Total ${res.eligibleCount} eligible employees identified.`,
      });
      loadElectionData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voter roll computation failed.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Add Eligibility Rule
  const handleAddRule = async () => {
    if (!election) return;
    try {
      setActionLoading(true);
      if (ruleType === 'employee') {
        if (!targetEmployeeId.trim()) {
          setFeedbackMessage({ type: 'error', text: 'Please specify an employee ID or select an employee.' });
          return;
        }
        await electionsApi.addEligibilityRule(election.id, {
          employeeId: targetEmployeeId.trim(),
          description: ruleDescription.trim() || undefined,
        });
      } else {
        await electionsApi.addEligibilityRule(election.id, {
          unitId: selectedUnitId || undefined,
          includeDescendants,
          allowedPositionIds: selectedPositionIds.length > 0 ? selectedPositionIds : undefined,
          minTenureMonths: Number(minTenureMonths) || 0,
          description: ruleDescription.trim() || undefined,
        });
      }
      setShowAddRuleModal(false);
      // Reset form
      setSelectedUnitId('');
      setIncludeDescendants(true);
      setSelectedPositionIds([]);
      setMinTenureMonths(0);
      setTargetEmployeeId('');
      setRuleDescription('');
      setFeedbackMessage({ type: 'success', text: 'Eligibility rule added successfully.' });
      loadElectionData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add rule.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Remove Eligibility Rule
  const handleRemoveRule = async (ruleId: string) => {
    if (!election) return;
    try {
      setActionLoading(true);
      await electionsApi.removeEligibilityRule(election.id, ruleId);
      setFeedbackMessage({ type: 'success', text: 'Rule removed.' });
      loadElectionData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove rule.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Candidate Counts
  const candidateCounts = useMemo(() => {
    const c = {
      approved: 0,
      pending: 0,
      rejected: 0,
      withdrawn: 0,
    };
    for (const cand of candidates) {
      if (cand.status === CandidateStatus.APPROVED) c.approved += 1;
      else if (cand.status === CandidateStatus.PENDING) c.pending += 1;
      else if (cand.status === CandidateStatus.REJECTED) c.rejected += 1;
      else if (cand.status === CandidateStatus.WITHDRAWN) c.withdrawn += 1;
    }
    return c;
  }, [candidates]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    if (candidateFilter === 'ALL') return candidates;
    return candidates.filter((c) => c.status === candidateFilter);
  }, [candidates, candidateFilter]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (!isInitialized || (isLoading && !election)) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', gap: '1rem', color: 'var(--color-text-3)' }}>
          <Loader2 className={styles.spinner} size={36} color="var(--color-accent)" />
          <span>Loading election management workspace...</span>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2>Election Not Found</h2>
          <p>The requested election does not exist or you do not have permission to administer it.</p>
          <Link href="/my-elections" className={styles.advanceBtn}>
            Return to Managed Elections
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = LIFECYCLE_STEPS.findIndex((s) => s.status === election.status);
  const nextTransition = NEXT_STATUS_MAP[election.status];
  const canCancel = election.status !== ElectionStatus.ENDED && election.status !== ElectionStatus.CANCELLED;
  const isRulesEditable = election.status === ElectionStatus.DRAFT || election.status === ElectionStatus.REGISTRATION;

  return (
    <div className={styles.container}>
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--r-sm)',
            background:
              feedbackMessage.type === 'success'
                ? 'rgba(19, 122, 77, 0.12)'
                : 'rgba(217, 40, 40, 0.12)',
            border: `1px solid ${
              feedbackMessage.type === 'success'
                ? 'rgba(19, 122, 77, 0.3)'
                : 'rgba(217, 40, 40, 0.3)'
            }`,
            color:
              feedbackMessage.type === 'success'
                ? 'var(--color-success)'
                : 'var(--color-danger)',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumb}>
        <Link href="/my-elections" className={styles.backLink}>
          <ArrowLeft size={14} />
          <span>Managed Elections</span>
        </Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>{election.title}</span>
      </nav>

      {/* Header Card & Status Stepper */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.headerMeta}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{election.title}</h1>
            </div>
            {election.description && (
              <p className={styles.description}>{election.description}</p>
            )}
            <div className={styles.badgesRow}>
              <span className={`${styles.badge} ${styles.badgeType}`}>
                {election.electionType === ElectionType.UNIT_SCOPED
                  ? 'Unit-Scoped Ballot'
                  : 'Organization-Wide'}
              </span>
              <span className={`${styles.badge} ${styles.badgeType}`}>
                Max {election.maxCandidates} Candidates
              </span>
              {election.onChainElectionId ? (
                <span className={`${styles.badge} ${styles.badgeChainPublished}`}>
                  <ShieldCheck size={13} />
                  <span>Besu #{election.onChainElectionId}</span>
                </span>
              ) : (
                <span className={`${styles.badge} ${styles.badgeChainPending}`}>
                  <ShieldAlert size={13} />
                  <span>Not Deployed to Besu</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.headerActions}>
            {nextTransition && (
              <button
                type="button"
                className={styles.advanceBtn}
                onClick={() => setShowAdvanceModal(true)}
                disabled={actionLoading}
              >
                <span>{nextTransition.actionLabel}</span>
                <ChevronRight size={16} />
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Stepper Track */}
        <div className={styles.stepper}>
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div key={step.status} className={styles.stepItem}>
                <div
                  className={`${styles.stepNumber} ${
                    isCurrent
                      ? styles.stepNumberActive
                      : isCompleted
                      ? styles.stepNumberComplete
                      : ''
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={14} /> : step.number}
                </div>
                <span
                  className={`${styles.stepLabel} ${
                    isCurrent
                      ? styles.stepLabelActive
                      : isCompleted
                      ? styles.stepLabelComplete
                      : ''
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsContainer}>
        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === 'overview' ? styles.tabBtnActive : ''
          }`}
          onClick={() => setActiveTab('overview')}
        >
          <Layers size={16} />
          <span>Overview & Blockchain</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === 'candidates' ? styles.tabBtnActive : ''
          }`}
          onClick={() => setActiveTab('candidates')}
        >
          <Users size={16} />
          <span>Candidates</span>
          <span
            className={`${styles.tabBadge} ${
              activeTab === 'candidates' ? styles.tabBadgeActive : ''
            }`}
          >
            {candidates.length}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === 'rules' ? styles.tabBtnActive : ''
          }`}
          onClick={() => setActiveTab('rules')}
        >
          <UserCheck size={16} />
          <span>Voter Roll & Eligibility</span>
          <span
            className={`${styles.tabBadge} ${
              activeTab === 'rules' ? styles.tabBadgeActive : ''
            }`}
          >
            {rules.length}
          </span>
        </button>

        {(election.status === ElectionStatus.ACTIVE ||
          election.status === ElectionStatus.ENDED) && (
          <button
            type="button"
            className={`${styles.tabBtn} ${
              activeTab === 'results' ? styles.tabBtnActive : ''
            }`}
            onClick={() => setActiveTab('results')}
          >
            <Vote size={16} />
            <span>Live Results & Audit</span>
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW & BLOCKCHAIN */}
      {activeTab === 'overview' && (
        <div className={styles.panel}>
          {/* Blockchain Integration Panel */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <Shield size={18} />
                  <span>Hyperledger Besu On-Chain Ledger</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Cryptographic smart contract deployment on the INSA consortium network.
                </p>
              </div>
            </div>

            {election.onChainElectionId ? (
              <div className={`${styles.chainBanner} ${styles.chainBannerPublished}`}>
                <div className={styles.chainInfo}>
                  <div className={`${styles.chainIconWrap} ${styles.chainIconPublished}`}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className={styles.chainTitle}>
                      Synchronized on Blockchain (Election #{election.onChainElectionId})
                    </h3>
                    <p className={styles.chainDesc}>
                      The election smart contract has been initialized. All approved candidates deployed to this election slot will be verifiable by consortium audit nodes.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${styles.chainBanner} ${styles.chainBannerPending}`}>
                <div className={styles.chainInfo}>
                  <div className={`${styles.chainIconWrap} ${styles.chainIconPending}`}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className={styles.chainTitle}>
                      {election.status === ElectionStatus.ACTIVE
                        ? 'Blockchain Initialization Pending'
                        : 'Scheduled for Automatic On-Chain Deployment'}
                    </h3>
                    <p className={styles.chainDesc}>
                      {election.status === ElectionStatus.ACTIVE
                        ? 'Live voting is active, but on-chain smart contract registration is pending. Click below to publish this election and all approved candidates.'
                        : 'This election and all approved candidates will be automatically deployed to the blockchain when live voting starts (either by reaching the start date or via "Start Live Voting").'}
                    </p>
                  </div>
                </div>
                {election.status === ElectionStatus.ACTIVE && (
                  <button
                    type="button"
                    className={styles.chainPublishBtn}
                    onClick={() => setShowPublishModal(true)}
                    disabled={actionLoading}
                  >
                    <ShieldCheck size={16} />
                    <span>Publish to Blockchain Now</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Election Specifications Grid */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <Calendar size={18} />
                  <span>Election Schedule & Specifications</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Configured timeline parameters and candidate limits.
                </p>
              </div>
            </div>

            <div className={styles.specGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Voting Window</span>
                <span className={styles.specValue}>
                  {formatDate(election.startDate)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                  to {formatDate(election.endDate)}
                </span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>Nomination Deadline</span>
                <span className={styles.specValue}>
                  {formatDate(election.registrationDeadline)}
                </span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>Ballot Scope</span>
                <span className={styles.specValue}>
                  {election.electionType === ElectionType.UNIT_SCOPED
                    ? 'Unit Scoped'
                    : 'General Election'}
                </span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>Candidate Slots</span>
                <span className={styles.specValue}>
                  {candidateCounts.approved} / {election.maxCandidates} Filled
                </span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>Voter Roll Status</span>
                <span className={styles.specValue}>
                  {election.votersComputed ? (
                    <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle2 size={15} />
                      <span>{voterTotal} Eligible Voters</span>
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={15} />
                      <span>Pending Computation</span>
                    </span>
                  )}
                </span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>Created Date</span>
                <span className={styles.specValue}>{formatDate(election.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATES MANAGEMENT */}
      {activeTab === 'candidates' && (
        <div className={styles.panel}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <Users size={18} />
                  <span>Candidate Nominations</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Review candidate nominations, approve or reject applications, and deploy approved nominees to the blockchain.
                </p>
              </div>

              <button
                type="button"
                className={styles.advanceBtn}
                onClick={() => setShowNominateModal(true)}
                disabled={actionLoading || candidates.length >= election.maxCandidates}
              >
                <Plus size={16} />
                <span>Nominate Candidate</span>
              </button>
            </div>

            {/* Candidate Filters */}
            <div className={styles.candidateToolbar}>
              <div className={styles.candidateFilters}>
                <button
                  type="button"
                  className={`${styles.candidateFilterBtn} ${
                    candidateFilter === 'ALL' ? styles.candidateFilterBtnActive : ''
                  }`}
                  onClick={() => setCandidateFilter('ALL')}
                >
                  All ({candidates.length})
                </button>
                <button
                  type="button"
                  className={`${styles.candidateFilterBtn} ${
                    candidateFilter === CandidateStatus.PENDING
                      ? styles.candidateFilterBtnActive
                      : ''
                  }`}
                  onClick={() => setCandidateFilter(CandidateStatus.PENDING)}
                >
                  Pending ({candidateCounts.pending})
                </button>
                <button
                  type="button"
                  className={`${styles.candidateFilterBtn} ${
                    candidateFilter === CandidateStatus.APPROVED
                      ? styles.candidateFilterBtnActive
                      : ''
                  }`}
                  onClick={() => setCandidateFilter(CandidateStatus.APPROVED)}
                >
                  Approved ({candidateCounts.approved})
                </button>
                <button
                  type="button"
                  className={`${styles.candidateFilterBtn} ${
                    candidateFilter === CandidateStatus.REJECTED
                      ? styles.candidateFilterBtnActive
                      : ''
                  }`}
                  onClick={() => setCandidateFilter(CandidateStatus.REJECTED)}
                >
                  Rejected ({candidateCounts.rejected})
                </button>
              </div>
            </div>

            {/* Candidate Grid */}
            {filteredCandidates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--color-text-3)' }}>
                <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No candidates match the selected filter.</p>
              </div>
            ) : (
              <div className={styles.candidateGrid}>
                {filteredCandidates.map((cand) => {
                  const emp = cand.employee;
                  const fullName = emp
                    ? `${emp.firstName} ${emp.lastName}`
                    : 'Candidate';
                  const initials = emp
                    ? `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase()
                    : 'CD';
                  const isPending = cand.status === CandidateStatus.PENDING;
                  const isApproved = cand.status === CandidateStatus.APPROVED;
                  const isRejected = cand.status === CandidateStatus.REJECTED;
                  const isWithdrawn = cand.status === CandidateStatus.WITHDRAWN;
                  const hasOnChainSlot = cand.onChainCandidateIndex !== null && cand.onChainCandidateIndex !== undefined;

                  return (
                    <div key={cand.id} className={styles.candidateCard}>
                      <div className={styles.candidateTop}>
                        <div className={styles.candidateAvatar}>{initials}</div>
                        <div className={styles.candidateMeta}>
                          <h4 className={styles.candidateName}>{fullName}</h4>
                          <p className={styles.candidateRole}>
                            {emp?.position?.name || 'Employee'}
                            {emp?.organizationalUnit?.name ? ` · ${emp.organizationalUnit.name}` : ''}
                          </p>
                        </div>
                        <span
                          className={`${styles.candidateStatusBadge} ${
                            isPending
                              ? styles.statusPending
                              : isApproved
                              ? styles.statusApproved
                              : isRejected
                              ? styles.statusRejected
                              : styles.statusWithdrawn
                          }`}
                        >
                          {cand.status}
                        </span>
                      </div>

                      {cand.slogan && (
                        <p className={styles.candidateSlogan}>"{cand.slogan}"</p>
                      )}

                      {cand.statement && (
                        <p className={styles.candidateStatement}>{cand.statement}</p>
                      )}

                      {cand.rejectionReason && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', background: 'rgba(217,40,40,0.08)', padding: '0.5rem 0.65rem', borderRadius: 'var(--r-sm)' }}>
                          <strong>Reason:</strong> {cand.rejectionReason}
                        </div>
                      )}

                      {/* On-Chain Slot Indicator */}
                      {hasOnChainSlot && (
                        <div className={styles.candidateChainSlot}>
                          <ShieldCheck size={13} />
                          <span>On-Chain Slot #{cand.onChainCandidateIndex}</span>
                        </div>
                      )}
                      {isApproved && !hasOnChainSlot && !election.onChainElectionId && (
                        <div className={styles.candidateChainSlot} style={{ color: 'var(--color-accent)' }}>
                          <Clock size={13} />
                          <span>Will deploy on live voting start</span>
                        </div>
                      )}
                      {isApproved && !hasOnChainSlot && !!election.onChainElectionId && (
                        <div className={styles.candidateChainSlot} style={{ color: '#d97706' }}>
                          <AlertTriangle size={13} />
                          <span>Not yet deployed on-chain</span>
                        </div>
                      )}

                      {/* Candidate Actions */}
                      <div className={styles.candidateActions}>
                        {isPending && (
                          <>
                            <button
                              type="button"
                              className={styles.approveBtn}
                              onClick={() => handleReviewCandidate(cand.id, CandidateStatus.APPROVED)}
                              disabled={actionLoading}
                            >
                              <UserCheck size={14} />
                              <span>{election.onChainElectionId ? 'Approve & Publish to Chain' : 'Approve'}</span>
                            </button>
                            <button
                              type="button"
                              className={styles.rejectBtn}
                              onClick={() => setRejectingCandidate(cand)}
                              disabled={actionLoading}
                            >
                              <UserX size={14} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {isApproved && !hasOnChainSlot && !!election.onChainElectionId && (
                          <button
                            type="button"
                            className={styles.advanceBtn}
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', width: '100%', justifyContent: 'center' }}
                            onClick={() => handlePublishCandidateOnChain(cand.id)}
                            disabled={actionLoading}
                          >
                            <ShieldCheck size={14} />
                            <span>Publish to Chain Now</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ELIGIBILITY & VOTER ROLL */}
      {activeTab === 'rules' && (
        <div className={styles.panel}>
          {/* Rules Configuration */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <UserCheck size={18} />
                  <span>Configured Eligibility Rules</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Rules defining which employees are eligible to cast ballots in this election.
                </p>
              </div>

              {isRulesEditable && (
                <button
                  type="button"
                  className={styles.advanceBtn}
                  onClick={() => setShowAddRuleModal(true)}
                  disabled={actionLoading}
                >
                  <Plus size={16} />
                  <span>Add Rule</span>
                </button>
              )}
            </div>

            {rules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--color-text-3)' }}>
                <p>No specific eligibility rules attached. (By default, general elections without rules allow all active employees in the organization).</p>
              </div>
            ) : (
              <div className={styles.rulesList}>
                {rules.map((rule) => {
                  const targetUnit = orgUnits.find((u) => u.id === rule.unitId);
                  const allowedPosNames = rule.allowedPositionIds
                    ? positions
                        .filter((p) => rule.allowedPositionIds?.includes(p.id))
                        .map((p) => p.name)
                        .join(', ')
                    : null;

                  return (
                    <div key={rule.id} className={styles.ruleItem}>
                      <div className={styles.ruleItemDetails}>
                        <h4 className={styles.ruleTitle}>
                          {rule.employeeId ? (
                            <>
                              <Users size={16} color="var(--color-accent)" />
                              <span>Direct Employee Inclusion ({rule.employeeId})</span>
                            </>
                          ) : (
                            <>
                              <Building2 size={16} color="var(--color-accent)" />
                              <span>
                                Scope: {targetUnit ? targetUnit.name : 'All Units'}
                                {rule.includeDescendants ? ' (Including Sub-Units)' : ' (This Unit Only)'}
                              </span>
                            </>
                          )}
                        </h4>
                        <p className={styles.ruleSpecs}>
                          {rule.allowedPositionIds && rule.allowedPositionIds.length > 0 && (
                            <span>
                              Positions: <strong>{allowedPosNames || rule.allowedPositionIds.join(', ')}</strong> |{' '}
                            </span>
                          )}
                          {rule.minTenureMonths > 0 && (
                            <span>
                              Min Tenure: <strong>{rule.minTenureMonths} months</strong> |{' '}
                            </span>
                          )}
                          <span>
                            Status Required: <strong>{rule.requiredStatus}</strong>
                          </span>
                        </p>
                        {rule.description && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', margin: '0.2rem 0 0' }}>
                            {rule.description}
                          </p>
                        )}
                      </div>

                      {isRulesEditable && (
                        <button
                          type="button"
                          className={styles.deleteRuleBtn}
                          onClick={() => handleRemoveRule(rule.id)}
                          title="Remove Rule"
                          disabled={actionLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Voter Roll Computation & Audit */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <Users size={18} />
                  <span>Audited Voter Roll</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Evaluate configured rules against the employee directory to generate the immutable electoral roll.
                </p>
              </div>

              <button
                type="button"
                className={styles.computeRollBtn}
                onClick={handleComputeRoll}
                disabled={actionLoading}
              >
                <RefreshCw size={15} className={actionLoading ? styles.spinner : ''} />
                <span>Compute Voter Roll</span>
              </button>
            </div>

            {/* Voter Roll Summary Bar */}
            <div className={styles.voterRollSummary}>
              <div className={styles.voterCountBox}>
                <span className={styles.voterCountNumber}>{voterTotal}</span>
                <span className={styles.voterCountLabel}>Eligible Employees on Roll</span>
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-text-2)' }}>
                {election.votersComputed ? (
                  <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={15} />
                    <span>Roll Evaluated and Synchronized</span>
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertTriangle size={15} />
                    <span>Rules have changed or roll has not been computed yet.</span>
                  </span>
                )}
              </div>
            </div>

            {/* Voter Table */}
            {voters.length > 0 ? (
              <div className={styles.voterTableWrap}>
                <table className={styles.voterTable}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department / Unit</th>
                      <th>Position</th>
                      <th>Ballot Cast Status</th>
                      <th>Audited At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voters.map((v) => {
                      const emp = v.employee;
                      const empName = emp
                        ? `${emp.firstName} ${emp.lastName}`
                        : v.employeeId;

                      return (
                        <tr key={v.id}>
                          <td>
                            <strong>{empName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                              {emp?.employeeId || v.employeeId}
                            </div>
                          </td>
                          <td>{emp?.organizationalUnit?.name || '—'}</td>
                          <td>{emp?.position?.name || '—'}</td>
                          <td>
                            {v.hasVoted ? (
                              <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.8rem' }}>
                                ✓ Voted
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-text-3)', fontSize: '0.8rem' }}>
                                Not Voted
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                            {formatDate(v.checkedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--color-text-3)', margin: '1.5rem 0' }}>
                No voters found on roll. Click "Compute Voter Roll" to evaluate eligibility.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: LIVE RESULTS & AUDIT */}
      {activeTab === 'results' && (
        <div className={styles.panel}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <Vote size={18} />
                  <span>On-Chain Voting Ledger Tally</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Real-time ballot tallies recorded on Hyperledger Besu.
                </p>
              </div>

              <button
                type="button"
                className={styles.advanceBtn}
                onClick={loadElectionData}
                disabled={isLoading}
              >
                <RefreshCw size={15} />
                <span>Refresh Tallies</span>
              </button>
            </div>

            {/* Results Summary Tiles */}
            <div className={styles.resultsSummaryGrid}>
              <div className={styles.resultStatCard}>
                <span className={styles.resultStatVal}>
                  {results ? results.totalVotes : 0}
                </span>
                <span className={styles.resultStatLabel}>Total Votes Cast</span>
              </div>

              <div className={styles.resultStatCard}>
                <span className={styles.resultStatVal}>{voterTotal}</span>
                <span className={styles.resultStatLabel}>Registered Eligible Voters</span>
              </div>

              <div className={styles.resultStatCard}>
                <span className={styles.resultStatVal}>
                  {voterTotal > 0 && results
                    ? `${((results.totalVotes / voterTotal) * 100).toFixed(1)}%`
                    : '0.0%'}
                </span>
                <span className={styles.resultStatLabel}>Voter Turnout</span>
              </div>
            </div>

            {/* Candidate Results Breakdown */}
            {results && results.candidates && results.candidates.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {results.candidates
                  .sort((a, b) => b.voteCount - a.voteCount)
                  .map((cand, idx) => {
                    const voteCount = Number(cand.voteCount);
                    const total = Number(results.totalVotes);
                    const pct = total > 0 ? (voteCount / total) * 100 : 0;
                    const isLeading = idx === 0 && voteCount > 0;

                    return (
                      <div
                        key={cand.candidateId || idx}
                        style={{
                          background: 'var(--color-elevated)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--r-sm)',
                          padding: '1rem 1.25rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: isLeading ? 'var(--color-accent)' : 'var(--color-text)' }}>
                            {idx + 1}. {cand.name}
                            {isLeading && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: 'var(--color-accent-dim)', color: 'var(--color-accent)', padding: '0.15rem 0.45rem', borderRadius: 'var(--r-sm)' }}>
                                Leading
                              </span>
                            )}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {voteCount} votes ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: isLeading ? 'var(--color-accent)' : 'var(--color-text-3)',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--color-text-3)', padding: '2rem' }}>
                No votes recorded yet for this election.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── ADVANCE STATUS MODAL ────────────────────────────────────── */}
      {showAdvanceModal && nextTransition && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Confirm Lifecycle Transition</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowAdvanceModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-2)', lineHeight: 1.5 }}>
                Are you sure you want to transition this election to{' '}
                <strong style={{ color: 'var(--color-accent)' }}>
                  {nextTransition.next}
                </strong>
                ?
              </p>

              {nextTransition.next === ElectionStatus.REGISTRATION && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)' }}>
                  Opening registration will permit employees to submit self-nominations and permit administrators to add candidates.
                </p>
              )}

              {nextTransition.next === ElectionStatus.UPCOMING && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)' }}>
                  Closing registration freezes nominations. You can perform final candidate reviews and audit the voter roll before opening voting.
                </p>
              )}

              {nextTransition.next === ElectionStatus.ACTIVE && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)' }}>
                    Starting live voting will initialize the smart contract on the blockchain, deploy all approved candidates to on-chain ballot slots, and open voting for all eligible employees.
                  </p>
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: 'var(--r-sm)', background: 'rgba(56, 142, 60, 0.1)', border: '1px solid rgba(56, 142, 60, 0.3)', color: 'var(--color-success)', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <ShieldCheck size={18} />
                    <span>
                      <strong>Automatic Blockchain Sync:</strong> The election and all approved candidates will be published to the blockchain as part of this action.
                    </span>
                  </div>
                </div>
              )}

              {nextTransition.next === ElectionStatus.ENDED && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)' }}>
                  Concluding the election will permanently close voting. The cryptographic tally will be finalized.
                </p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setShowAdvanceModal(false)}
              >
                Back
              </button>
              <button
                type="button"
                className={styles.confirmModalBtn}
                onClick={handleAdvanceStatus}
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : `Confirm: ${nextTransition.actionLabel}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CANCEL ELECTION MODAL ───────────────────────────────────── */}
      {showCancelModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Cancel Election</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowCancelModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-danger)', lineHeight: 1.5 }}>
                Are you sure you want to cancel this election? This action permanently halts all voting and cannot be undone.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setShowCancelModal(false)}
              >
                Never mind
              </button>
              <button
                type="button"
                className={styles.confirmDangerBtn}
                onClick={handleCancelElection}
                disabled={actionLoading}
              >
                {actionLoading ? 'Cancelling...' : 'Yes, Cancel Election'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PUBLISH ON-CHAIN MODAL ──────────────────────────────────── */}
      {showPublishModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Publish Election to Blockchain</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowPublishModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-2)', lineHeight: 1.5 }}>
                This action deploys the election metadata to the Hyperledger Besu enterprise smart contract through the server relay wallet.
              </p>
              <div style={{ background: 'var(--color-elevated)', padding: '0.85rem', borderRadius: 'var(--r-sm)', fontSize: '0.8rem', color: 'var(--color-text-3)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div><strong>Election:</strong> {election.title}</div>
                <div><strong>Max Candidates:</strong> {election.maxCandidates}</div>
                <div><strong>Network:</strong> INSA Consortium (Besu EVM)</div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setShowPublishModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmModalBtn}
                onClick={handlePublishOnChain}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deploying...' : 'Deploy to Hyperledger Besu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECT CANDIDATE MODAL ─────────────────────────────────── */}
      {rejectingCandidate && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Reject Candidate Nomination</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setRejectingCandidate(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-2)' }}>
                Please provide an official rejection reason for{' '}
                <strong>
                  {rejectingCandidate.employee?.firstName}{' '}
                  {rejectingCandidate.employee?.lastName}
                </strong>
                .
              </p>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Rejection Reason</label>
                <textarea
                  className={styles.textareaField}
                  placeholder="e.g., Does not meet senior tenure requirement..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setRejectingCandidate(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmDangerBtn}
                onClick={() =>
                  handleReviewCandidate(
                    rejectingCandidate.id,
                    CandidateStatus.REJECTED,
                    rejectionReason.trim() || undefined
                  )
                }
                disabled={actionLoading}
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOMINATE CANDIDATE MODAL ───────────────────────────────── */}
      {showNominateModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Nominate Candidate</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => {
                  setShowNominateModal(false);
                  setSelectedNominee(null);
                  setNomineeSearch('');
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Employee Selection */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Search Employee</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                  <input
                    type="text"
                    className={styles.inputField}
                    style={{ paddingLeft: '2.25rem', width: '100%' }}
                    placeholder="Search by employee name or code..."
                    value={selectedNominee ? `${selectedNominee.firstName} ${selectedNominee.lastName} (${selectedNominee.employeeId})` : nomineeSearch}
                    onChange={(e) => {
                      setSelectedNominee(null);
                      setNomineeSearch(e.target.value);
                    }}
                  />
                  {selectedNominee && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNominee(null);
                        setNomineeSearch('');
                      }}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {nomineeResults.length > 0 && !selectedNominee && (
                  <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--r-sm)', background: 'var(--color-surface)', marginTop: '0.25rem' }}>
                    {nomineeResults.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => {
                          setSelectedNominee(emp);
                          setNomineeResults([]);
                        }}
                        style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                      >
                        <strong>{emp.firstName} {emp.lastName}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', marginLeft: '0.5rem' }}>
                          {emp.employeeId} · {emp.position?.name || 'Employee'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Campaign Slogan (Optional)</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g., Integrity, Security, Innovation"
                  value={nomineeSlogan}
                  onChange={(e) => setNomineeSlogan(e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Candidate Statement (Optional)</label>
                <textarea
                  className={styles.textareaField}
                  placeholder="Brief vision and objectives..."
                  value={nomineeStatement}
                  onChange={(e) => setNomineeStatement(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => {
                  setShowNominateModal(false);
                  setSelectedNominee(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmModalBtn}
                onClick={handleCreateNomination}
                disabled={!selectedNominee || actionLoading}
              >
                {actionLoading ? 'Nominating...' : 'Submit Nomination'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD ELIGIBILITY RULE MODAL ─────────────────────────────── */}
      {showAddRuleModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Eligibility Rule</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowAddRuleModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Rule Type Selector */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  className={`${styles.candidateFilterBtn} ${
                    ruleType === 'scope' ? styles.candidateFilterBtnActive : ''
                  }`}
                  onClick={() => setRuleType('scope')}
                  style={{ flex: 1, padding: '0.55rem' }}
                >
                  Unit & Position Scope
                </button>
                <button
                  type="button"
                  className={`${styles.candidateFilterBtn} ${
                    ruleType === 'employee' ? styles.candidateFilterBtnActive : ''
                  }`}
                  onClick={() => setRuleType('employee')}
                  style={{ flex: 1, padding: '0.55rem' }}
                >
                  Direct Employee Rule
                </button>
              </div>

              {ruleType === 'scope' ? (
                <>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Target Organizational Unit</label>
                    <select
                      className={styles.inputField}
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                    >
                      <option value="">All Units in Organization</option>
                      {orgUnits.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.unitType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="descendantsCheck"
                      checked={includeDescendants}
                      onChange={(e) => setIncludeDescendants(e.target.checked)}
                    />
                    <label htmlFor="descendantsCheck" style={{ fontSize: '0.85rem', color: 'var(--color-text-2)' }}>
                      Include Sub-units and Descendant Branches
                    </label>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Allowed Positions (Leave blank for all)</label>
                    <select
                      multiple
                      className={styles.inputField}
                      style={{ height: '90px' }}
                      value={selectedPositionIds}
                      onChange={(e) => {
                        const vals = Array.from(e.target.selectedOptions, (option) => option.value);
                        setSelectedPositionIds(vals);
                      }}
                    >
                      {positions.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.name}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.725rem', color: 'var(--color-text-3)' }}>
                      Hold Ctrl (or Cmd) to select multiple positions.
                    </span>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Minimum Tenure (Months)</label>
                    <input
                      type="number"
                      min={0}
                      className={styles.inputField}
                      value={minTenureMonths}
                      onChange={(e) => setMinTenureMonths(Number(e.target.value))}
                    />
                  </div>
                </>
              ) : (
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Employee ID (UUID or Directory ID)</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Enter Employee UUID..."
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                  />
                </div>
              )}

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Rule Description (Optional)</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g., Senior engineers in Cyber Defense division"
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setShowAddRuleModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmModalBtn}
                onClick={handleAddRule}
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving...' : 'Add Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

