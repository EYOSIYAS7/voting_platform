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
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import styles from './election-detail.module.css';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  Active:       { label: 'Voting open',   cls: 'status-active' },
  Upcoming:     { label: 'Voting soon',   cls: 'status-upcoming' },
  Registration: { label: 'Registration',  cls: 'status-registration' },
  Pending:      { label: 'Not yet open',  cls: 'status-pending' },
  Ended:        { label: 'Closed',        cls: 'status-ended' },
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
    <div className={`container ${styles.page}`}>
      <Link href="/elections" className={styles.backLink}>
        Elections
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
                onExpire={() => {
                  refetchStatus();
                  refetchElection();
                }}
              />
            </>
          )}
          {status === 'Ended' && (
            <p className={styles.asideLabel}>This election is closed.</p>
          )}
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className={`panel panel-pad ${styles.ballotPanel}`}>
            <h2 className={styles.sectionTitle}>Candidates</h2>

            {isCandidatesLoading ? (
              <div className="spinner" />
            ) : candidates.length === 0 ? (
              <div className="empty-state">
                <h3>No candidates on the ballot yet</h3>
                <p>
                  {status === 'Registration'
                    ? 'Registration is open. Approved candidates will appear here after review.'
                    : 'Candidates appear here after an administrator approves them.'}
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

          {status === 'Registration' && (
            <div className={`panel panel-pad ${styles.regCard}`}>
              <div className={styles.regHeader}>
                <h3 className={styles.regTitle}>Register as a candidate</h3>
                <p className={styles.regDesc}>
                  Submit your name. An administrator must approve you before you appear on the ballot.
                </p>
              </div>

              <form onSubmit={handleRegister} className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label" htmlFor="cand-name">Full name</label>
                  <input
                    id="cand-name"
                    type="text"
                    className="form-input"
                    placeholder="Your name"
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cand-desc">Description</label>
                  <textarea
                    id="cand-desc"
                    className="form-input"
                    placeholder="Background and what you stand for"
                    value={candDesc}
                    onChange={(e) => setCandDesc(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cand-img">Photo URL (optional)</label>
                  <input
                    id="cand-img"
                    type="url"
                    className="form-input"
                    placeholder="https://"
                    value={candImg}
                    onChange={(e) => setCandImg(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isRegisterPending}
                >
                  {isRegisterPending ? 'Submitting…' : 'Submit registration'}
                </button>
              </form>
            </div>
          )}
        </div>

        <aside className={styles.rightCol}>
          {showLiveResults && (
            <div className={`panel panel-pad ${styles.sideCard}`}>
              <ResultsChart candidates={candidates} totalVotes={election.totalVotes} />
            </div>
          )}

          {!isConnected && (
            <p className={`panel panel-pad ${styles.note}`}>
              Connect a wallet in the header to register or vote.
            </p>
          )}

          {isConnected && status === 'Active' && !hasVoted && (
            <p className={`panel panel-pad ${styles.note}`}>
              Choose one candidate. You can vote once. Results appear after your ballot is recorded.
            </p>
          )}

          {isConnected && hasVoted && status === 'Active' && (
            <p className={`panel panel-pad ${styles.votedNotice}`}>
              Your vote has been recorded.
            </p>
          )}

          <dl className={`panel panel-pad ${styles.timeline}`}>
            <div>
              <dt>Registration</dt>
              <dd>{formatTime(regStart)} – {formatTime(regEnd)}</dd>
            </div>
            <div>
              <dt>Voting</dt>
              <dd>{formatTime(voteStart)} – {formatTime(voteEnd)}</dd>
            </div>
          </dl>
        </aside>
      </div>

      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />}
            {toast.type === 'error' && <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />}
            {toast.type === 'info' && <Info size={18} style={{ color: 'var(--color-accent)' }} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
