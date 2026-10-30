'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { electionsApi } from '@/lib/api/elections';
import {
  Election,
  ElectionStatus,
  Candidate,
  CandidateStatus,
  EligibilityCheckResponse,
  VotingResultsResponse,
  VoteProofResponse,
  SelfNominateDto,
} from '@/lib/types/api';
import { CandidateCard } from '@/components/CandidateCard';
import { ResultsChart } from '@/components/ResultsChart';
import { CountdownTimer } from '@/components/CountdownTimer';
import { CheckCircle, AlertTriangle, Info, ExternalLink, Copy, Check } from 'lucide-react';
import styles from './election-detail.module.css';

const STATUS_LABEL: Record<ElectionStatus, string> = {
  [ElectionStatus.DRAFT]: 'Draft',
  [ElectionStatus.REGISTRATION]: 'Registration open',
  [ElectionStatus.UPCOMING]: 'Voting soon',
  [ElectionStatus.ACTIVE]: 'Voting open',
  [ElectionStatus.ENDED]: 'Closed',
  [ElectionStatus.CANCELLED]: 'Cancelled',
};

const STATUS_CLS: Record<ElectionStatus, string> = {
  [ElectionStatus.DRAFT]: 'status-pending',
  [ElectionStatus.REGISTRATION]: 'status-registration',
  [ElectionStatus.UPCOMING]: 'status-upcoming',
  [ElectionStatus.ACTIVE]: 'status-active',
  [ElectionStatus.ENDED]: 'status-ended',
  [ElectionStatus.CANCELLED]: 'status-ended',
};

export default function ElectionDetailPage() {
  const params = useParams();
  const electionDbId = params.id as string;
  const { isAuthenticated } = useAuthStore();

  // ── Data state ─────────────────────────────────────────────────────────────
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityCheckResponse | null>(null);
  const [results, setResults] = useState<VotingResultsResponse | null>(null);
  const [voteProof, setVoteProof] = useState<VoteProofResponse | null>(null);
  const [votedForCandidateId, setVotedForCandidateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedTx, setCopiedTx] = useState(false);

  // ── Nomination form state ───────────────────────────────────────────────────
  const [statement, setStatement] = useState('');
  const [slogan, setSlogan] = useState('');
  const [isSubmittingNomination, setIsSubmittingNomination] = useState(false);

  // ── Vote state ─────────────────────────────────────────────────────────────
  const [isVoting, setIsVoting] = useState(false);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
    txHash?: string;
  }>({ show: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info', txHash?: string) => {
    setToast({ show: true, message, type, txHash });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast((t) => ({ ...t, show: false })), 7000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [electionData, candidatesData] = await Promise.all([
        electionsApi.getElection(electionDbId),
        electionsApi.getCandidates(electionDbId, CandidateStatus.APPROVED),
      ]);
      setElection(electionData);
      setCandidates(candidatesData);

      // Only fetch eligibility & results for authenticated users
      if (isAuthenticated) {
        const eligData = await electionsApi.checkMyEligibility(electionDbId).catch(() => null);
        setEligibility(eligData);

        if (eligData?.hasVoted) {
          const proof = await electionsApi.verifyMyVote(electionDbId).catch(() => null);
          setVoteProof(proof);
        }

        // Fetch live results if active or ended
        if (
          electionData.status === ElectionStatus.ACTIVE ||
          electionData.status === ElectionStatus.ENDED
        ) {
          const resultsData = await electionsApi.getResults(electionDbId).catch(() => null);
          setResults(resultsData);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load election', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [electionDbId, isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleVote = async (candidateId: string) => {
    if (!isAuthenticated) {
      showToast('Please sign in to vote', 'error');
      return;
    }
    setIsVoting(true);
    try {
      const res = await electionsApi.castVote(electionDbId, { candidateId });
      setVotedForCandidateId(candidateId);
      showToast('Your vote has been recorded on the blockchain!', 'success', res.txHash);
      // Refresh eligibility, receipt proof, and results
      await loadData();
    } catch (err: any) {
      const msg = err.message || 'Failed to cast vote';
      showToast(msg, 'error');
    } finally {
      setIsVoting(false);
    }
  };

  const handleCopyTx = (txHash: string) => {
    navigator.clipboard.writeText(txHash);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  const handleSelfNominate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to register', 'error');
      return;
    }
    setIsSubmittingNomination(true);
    try {
      const dto: SelfNominateDto = {
        statement: statement.trim() || undefined,
        slogan: slogan.trim() || undefined,
      };
      await electionsApi.selfNominate(electionDbId, dto);
      showToast('Candidacy submitted! Awaiting admin approval.', 'success');
      setStatement('');
      setSlogan('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit candidacy', 'error');
    } finally {
      setIsSubmittingNomination(false);
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  if (isLoading || !election) {
    return (
      <div className={styles.loaderContainer}>
        <div className="spinner" />
      </div>
    );
  }

  const status = election.status;
  const cfg = { label: STATUS_LABEL[status], cls: STATUS_CLS[status] };

  const hasVoted = eligibility?.hasVoted ?? false;
  const isEligible = eligibility?.isEligible ?? false;
  const canVote = isAuthenticated && isEligible && !hasVoted && status === ElectionStatus.ACTIVE;
  const showLiveResults =
    status === ElectionStatus.ENDED || (status === ElectionStatus.ACTIVE && hasVoted);

  const voteStart = new Date(election.startDate).getTime() / 1000;
  const voteEnd = new Date(election.endDate).getTime() / 1000;
  const regEnd = election.registrationDeadline
    ? new Date(election.registrationDeadline).getTime() / 1000
    : null;

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const countdownTarget =
    status === ElectionStatus.REGISTRATION && regEnd
      ? regEnd
      : status === ElectionStatus.UPCOMING
      ? voteStart
      : status === ElectionStatus.ACTIVE
      ? voteEnd
      : null;

  const countdownLabel =
    status === ElectionStatus.REGISTRATION
      ? 'Registration closes in'
      : status === ElectionStatus.UPCOMING
      ? 'Voting starts in'
      : status === ElectionStatus.ACTIVE
      ? 'Voting ends in'
      : null;

  // Map API Candidate to card-compatible shape
  const mappedCandidates = candidates.map((c) => ({
    id: BigInt(c.onChainCandidateIndex ?? 0),
    electionId: BigInt(0),
    name: `${c.employee?.firstName ?? ''} ${c.employee?.lastName ?? ''}`.trim() || 'Unknown',
    description: c.statement || '',
    imageUrl: c.photoUrl || '',
    walletAddress: '' as `0x${string}`,
    voteCount: BigInt(
      results?.candidates.find((r) => r.candidateId === c.id)?.voteCount ?? 0
    ),
    approved: true,
    exists: true,
    dbId: c.id,
  }));

  const totalVotes = BigInt(results?.totalVotes ?? 0);

  return (
    <div className={`container ${styles.page}`}>
      <Link href="/elections" className={styles.backLink}>
        ← Back to Elections
      </Link>

      <header className={`panel panel-pad ${styles.header}`}>
        <div className={styles.headerContent}>
          <p className={`status ${cfg.cls}`}>{cfg.label}</p>
          <h1 className={styles.title}>{election.title}</h1>
          {election.description && <p className={styles.desc}>{election.description}</p>}
        </div>

        <div className={styles.asideContent}>
          {countdownTarget && countdownLabel && (
            <>
              <span className={styles.asideLabel}>{countdownLabel}</span>
              <CountdownTimer
                targetTimestamp={countdownTarget}
                onExpire={() => loadData()}
              />
            </>
          )}
          {status === ElectionStatus.ENDED && (
            <p className={styles.asideLabel}>This election is closed.</p>
          )}
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className={`panel panel-pad ${styles.ballotPanel}`}>
            <h2 className={styles.sectionTitle}>Candidates</h2>

            {candidates.length === 0 ? (
              <div className="empty-state">
                <h3>No candidates on the ballot yet</h3>
                <p>
                  {status === ElectionStatus.REGISTRATION
                    ? 'Registration is open. Approved candidates will appear here after review.'
                    : 'Candidates appear here after an administrator approves them.'}
                </p>
              </div>
            ) : (
              <div className={styles.candidatesList}>
                {mappedCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.dbId}
                    candidate={candidate}
                    isVotingActive={status === ElectionStatus.ACTIVE}
                    hasVoted={hasVoted}
                    isVotedFor={candidate.dbId === votedForCandidateId}
                    onVote={() => handleVote(candidate.dbId)}
                    isLoadingVote={isVoting}
                    totalVotes={totalVotes}
                    showResults={showLiveResults}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Self-nomination form (Registration phase) */}
          {status === ElectionStatus.REGISTRATION && isAuthenticated && (
            <div className={`panel panel-pad ${styles.regCard}`}>
              <div className={styles.regHeader}>
                <h3 className={styles.regTitle}>Register as a candidate</h3>
                <p className={styles.regDesc}>
                  Submit your candidacy. An administrator must approve you before you appear on the ballot.
                </p>
              </div>

              <form onSubmit={handleSelfNominate} className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label" htmlFor="cand-statement">
                    Statement
                  </label>
                  <textarea
                    id="cand-statement"
                    className="form-input"
                    placeholder="Your background and what you stand for"
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cand-slogan">
                    Slogan (optional)
                  </label>
                  <input
                    id="cand-slogan"
                    type="text"
                    className="form-input"
                    placeholder="A short campaign slogan"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingNomination}
                >
                  {isSubmittingNomination ? 'Submitting…' : 'Submit registration'}
                </button>
              </form>
            </div>
          )}
        </div>

        <aside className={styles.rightCol}>
          {showLiveResults && results && (
            <div className={`panel panel-pad ${styles.sideCard}`}>
              <ResultsChart candidates={mappedCandidates} totalVotes={totalVotes} />
            </div>
          )}

          {/* Voting / eligibility callout */}
          {!isAuthenticated && (
            <p className={`panel panel-pad ${styles.note}`}>
              Sign in to vote or register as a candidate.
            </p>
          )}

          {isAuthenticated && status === ElectionStatus.ACTIVE && !isEligible && (
            <p className={`panel panel-pad ${styles.note}`}>
              You are not eligible to vote in this election.
            </p>
          )}

          {canVote && (
            <p className={`panel panel-pad ${styles.note}`}>
              Choose one candidate. You can vote once. Results appear after your ballot is recorded.
            </p>
          )}

          {/* On-Chain Ballot Receipt Panel */}
          {isAuthenticated && hasVoted && voteProof?.txHash && (
            <div className={`panel panel-pad ${styles.receiptPanel}`}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--color-success)',
                  marginBottom: '0.4rem',
                }}
              >
                <CheckCircle size={18} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                  Ballot Recorded
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', margin: '0 0 0.85rem' }}>
                Your ballot was cryptographically verified and recorded on Hyperledger Besu.
              </p>
              <dl className={styles.receiptList}>
                <dt>Transaction Hash</dt>
                <dd>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <code
                      style={{
                        fontSize: '0.72rem',
                        wordBreak: 'break-all',
                        background: 'var(--color-elevated)',
                        padding: '0.15rem 0.35rem',
                        borderRadius: 4,
                      }}
                    >
                      {voteProof.txHash}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyTx(voteProof.txHash!)}
                      className={styles.copyBtn}
                      title="Copy transaction hash"
                    >
                      {copiedTx ? (
                        <Check size={13} style={{ color: 'var(--color-success)' }} />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </dd>
                {voteProof.votedAt && (
                  <>
                    <dt>Timestamp</dt>
                    <dd>{formatTime(voteProof.votedAt)}</dd>
                  </>
                )}
                <dt>Consensus Engine</dt>
                <dd>Hyperledger Besu (QBFT Private Ledger)</dd>
                <dt>Ballot Secrecy</dt>
                <dd>Preserved (Zero-Knowledge Hash)</dd>
              </dl>
            </div>
          )}

          {isAuthenticated && hasVoted && !voteProof?.txHash && status === ElectionStatus.ACTIVE && (
            <p className={`panel panel-pad ${styles.votedNotice}`}>
              <CheckCircle size={16} style={{ display: 'inline', marginRight: 6 }} />
              Your vote has been recorded on-chain.
            </p>
          )}

          <dl className={`panel panel-pad ${styles.timeline}`}>
            {election.registrationDeadline && (
              <div>
                <dt>Registration deadline</dt>
                <dd>{formatTime(election.registrationDeadline)}</dd>
              </div>
            )}
            <div>
              <dt>Voting window</dt>
              <dd>
                {formatTime(election.startDate)} – {formatTime(election.endDate)}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && (
              <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
            )}
            {toast.type === 'error' && (
              <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
            )}
            {toast.type === 'info' && <Info size={18} style={{ color: 'var(--color-accent)' }} />}
            <span>{toast.message}</span>
            {toast.txHash && (
              <a
                href={`#tx-${toast.txHash}`}
                title={`Transaction: ${toast.txHash}`}
                style={{ marginLeft: 8, color: 'inherit', opacity: 0.8 }}
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
