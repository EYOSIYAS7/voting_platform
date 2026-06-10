'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import {
  useElection,
  useElectionStatus,
  useResults,
  useHasVoted,
  useVoterChoice,
  useVote,
  useRegisterAsCandidate,
  useContractAddress
} from '@/lib/hooks/useContract';
import { VOTING_PLATFORM_ABI, Election, Candidate } from '@/lib/abi/votingPlatform';
import { CandidateCard } from '@/components/CandidateCard';
import { ResultsChart } from '@/components/ResultsChart';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ArrowLeft, Users, Calendar, Award, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import styles from './election-detail.module.css';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  Active:       { label: 'Voting Live',  cls: 'badge-active'       },
  Upcoming:     { label: 'Upcoming',     cls: 'badge-upcoming'     },
  Registration: { label: 'Open Reg.',    cls: 'badge-registration' },
  Pending:      { label: 'Pending',      cls: 'badge-pending'      },
  Ended:        { label: 'Ended',        cls: 'badge-ended'        },
};

export default function ElectionDetailPage() {
  const params = useParams();
  const electionId = BigInt(params.id as string);

  const { address, isConnected } = useAccount();
  const contractAddress = useContractAddress();

  // Queries
  const { data: electionRaw, isLoading: isElectionLoading, refetch: refetchElection } = useElection(electionId);
  const { data: statusRaw, refetch: refetchStatus } = useElectionStatus(electionId);
  const { data: candidatesRaw, isLoading: isCandidatesLoading, refetch: refetchCandidates } = useResults(electionId);
  
  const { data: hasVotedRaw, refetch: refetchVoted } = useHasVoted(electionId, address || '');
  const { data: choiceRaw, refetch: refetchChoice } = useVoterChoice(electionId, address || '');

  // Mutations
  const { writeContract: vote, isPending: isVotingPending } = useVote();
  const { writeContract: register, isPending: isRegisterPending } = useRegisterAsCandidate();

  // Local state for candidate registration form
  const [candName, setCandName] = useState('');
  const [candDesc, setCandDesc] = useState('');
  const [candImg, setCandImg] = useState('');

  // Local state for toast notification
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show:    false,
    message: '',
    type:    'info',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  if (isElectionLoading || !electionRaw) {
    return (
      <div className={styles.loaderContainer}>
        <div className="spinner" />
      </div>
    );
  }

  const election = electionRaw as unknown as Election;
  const candidates = (candidatesRaw || []) as unknown as Candidate[];
  const status = (statusRaw || 'Ended') as string;
  
  const hasVoted = !!hasVotedRaw;
  const voterChoiceId = choiceRaw ? BigInt(choiceRaw.toString()) : 0n;

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Ended'];

  // Timestamps
  const regStart  = Number(election.registrationStart);
  const regEnd    = Number(election.registrationEnd);
  const voteStart = Number(election.votingStart);
  const voteEnd   = Number(election.votingEnd);

  const formatTime = (ts: number) => {
    return new Date(ts * 1000).toLocaleString(undefined, {
      month: 'short',
      day:   'numeric',
      hour:  '2-digit',
      minute:'2-digit',
    });
  };

  // Determine target for countdown
  const countdownTarget =
    status === 'Pending'      ? regStart  :
    status === 'Registration' ? regEnd    :
    status === 'Upcoming'     ? voteStart :
    status === 'Active'       ? voteEnd   :
    null;

  const countdownLabel =
    status === 'Pending'      ? 'Registration opens in' :
    status === 'Registration' ? 'Registration closes in' :
    status === 'Upcoming'     ? 'Voting starts in'      :
    status === 'Active'       ? 'Voting ends in'        :
    null;

  // Handlers
  const handleVote = (candidateId: bigint) => {
    if (!isConnected) {
      showToast('Please connect your wallet to vote', 'error');
      return;
    }

    vote(
      {
        address:      contractAddress,
        abi:          VOTING_PLATFORM_ABI,
        functionName: 'vote',
        args:         [electionId, candidateId],
      },
      {
        onSuccess: () => {
          showToast('Vote cast successfully!', 'success');
          // Refetch state
          refetchElection();
          refetchCandidates();
          refetchVoted();
          refetchChoice();
        },
        onError: (err: any) => {
          console.error(err);
          const msg = err.shortMessage || err.message || 'Failed to cast vote';
          showToast(msg, 'error');
        },
      }
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      showToast('Please connect your wallet to register', 'error');
      return;
    }
    if (!candName.trim()) {
      showToast('Candidate name is required', 'error');
      return;
    }

    register(
      {
        address:      contractAddress,
        abi:          VOTING_PLATFORM_ABI,
        functionName: 'registerAsCandidate',
        args:         [electionId, candName, candDesc, candImg],
      },
      {
        onSuccess: () => {
          showToast('Candidacy submitted successfully! Awaiting admin approval.', 'success');
          setCandName('');
          setCandDesc('');
          setCandImg('');
          refetchCandidates();
        },
        onError: (err: any) => {
          console.error(err);
          const msg = err.shortMessage || err.message || 'Failed to register candidacy';
          showToast(msg, 'error');
        },
      }
    );
  };

  const showLiveResults = status === 'Ended' || (status === 'Active' && hasVoted);

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <Link href="/elections" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to elections
      </Link>

      {/* ─── Election Header Banner ────────────────────────────────────── */}
      <div className={`card ${styles.headerCard}`}>
        {election.imageUrl && (
          <div className={styles.headerBg} style={{ backgroundImage: `url(${election.imageUrl})` }} />
        )}
        <div className={styles.headerContent}>
          <div className={styles.metaRow}>
            <span className={`badge ${cfg.cls} ${status === 'Active' || status === 'Registration' ? 'badge-dot' : ''}`}>
              {cfg.label}
            </span>
          </div>
          <h1 className={styles.title}>{election.title}</h1>
          <p className={styles.desc}>{election.description}</p>
        </div>

        <div className={styles.asideContent}>
          {countdownTarget && countdownLabel && (
            <>
              <span className={styles.asideLabel}>{countdownLabel}</span>
              <CountdownTimer
                targetTimestamp={countdownTarget}
                onExpire={() => {
                  refetchStatus();
                  refetchElection();
                }}
              />
            </>
          )}
          {status === 'Ended' && (
            <div className={styles.votedNotice} style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <Award size={16} style={{ color: 'var(--color-primary)' }} />
              <span style={{ color: 'var(--color-text)' }}>Election Concluded</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Two-column layout ─────────────────────────────────────────── */}
      <div className={styles.layout}>
        {/* Left column: Candidates or Registration */}
        <div className={styles.leftCol}>
          <div>
            <h2 className={styles.sectionTitle}>
              <Users size={14} />
              Approved Candidates
            </h2>

            {isCandidatesLoading ? (
              <div className="spinner" />
            ) : candidates.length === 0 ? (
              <div className="card empty-state" style={{ padding: '3rem 1.5rem' }}>
                <Users size={32} />
                <h3>No candidates approved yet</h3>
                <p>
                  {status === 'Registration'
                    ? 'Candidates are currently self-registering. Check back once registration ends and admins approve them.'
                    : 'Candidates will appear here once approved by the administrators.'}
                </p>
              </div>
            ) : (
              <div className={styles.candidatesList}>
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id.toString()}
                    candidate={candidate}
                    isVotingActive={status === 'Active'}
                    hasVoted={hasVoted}
                    isVotedFor={voterChoiceId === candidate.id}
                    onVote={handleVote}
                    isLoadingVote={isVotingPending}
                    totalVotes={election.totalVotes}
                    showResults={showLiveResults}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Registration form if registration window is active */}
          {status === 'Registration' && (
            <div className={`card ${styles.regCard}`}>
              <div className={styles.regHeader}>
                <h3 className={styles.regTitle}>Register as a Candidate</h3>
                <p className={styles.regDesc}>
                  Submit your profile to self-register. The admin must review and approve your submission before voters can cast ballots for you.
                </p>
              </div>

              <form onSubmit={handleRegister} className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your name"
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Profile Description</label>
                  <textarea
                    className="form-input"
                    placeholder="Describe your background and objectives..."
                    value={candDesc}
                    onChange={(e) => setCandDesc(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Avatar Image URL (Optional)</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/avatar.jpg"
                    value={candImg}
                    onChange={(e) => setCandImg(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isRegisterPending}
                  style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}
                >
                  {isRegisterPending ? 'Submitting...' : 'Submit Candidacy'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right column: Results & Info */}
        <div className={styles.rightCol}>
          {/* Results chart */}
          {showLiveResults && (
            <ResultsChart candidates={candidates} totalVotes={election.totalVotes} />
          )}

          {/* Wallet prompt / Info card */}
          {!isConnected && (
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '0.15rem' }} />
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Wallet disconnected</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', marginTop: '0.2rem' }}>
                    Connect a Web3 wallet in the navigation bar to register or vote on-chain.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isConnected && status === 'Active' && !hasVoted && (
            <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', borderLeft: '2px solid var(--color-primary)' }}>
              <Info size={16} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '0.15rem' }} />
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Voting is open</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', marginTop: '0.2rem' }}>
                  Select a candidate below. You can only vote once — live results unlock after your ballot is cast.
                </p>
              </div>
            </div>
          )}

          {isConnected && hasVoted && status === 'Active' && (
            <div className={styles.votedNotice}>
              <CheckCircle size={16} />
              <span>Ballot verified. Your vote has been recorded on the blockchain.</span>
            </div>
          )}

          {/* Lifecycle timeline */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={12} />
              Timeline
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Registration</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', fontFamily: "'DM Mono', monospace" }}>
                  {formatTime(regStart)} – {formatTime(regEnd)}
                </span>
              </div>

              <div style={{ height: '1px', background: 'var(--color-border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Voting</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', fontFamily: "'DM Mono', monospace" }}>
                  {formatTime(voteStart)} – {formatTime(voteEnd)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Toast Container ────────────────────────────────────────────── */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast animate-fade-in toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />}
            {toast.type === 'error' && <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />}
            {toast.type === 'info' && <Info size={18} style={{ color: 'var(--color-primary)' }} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
