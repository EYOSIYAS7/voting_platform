'use client';

import { Check } from 'lucide-react';
import styles from './CandidateCard.module.css';

// Minimal shape the card needs — works with both ABI type and our mapped API type
export interface CandidateCardItem {
  id: bigint;
  dbId: string;
  name: string;
  description: string;
  imageUrl: string;
  voteCount: bigint;
  approved: boolean;
  exists: boolean;
}

interface Props {
  candidate: CandidateCardItem;
  isVotingActive: boolean;
  hasVoted: boolean;
  isVotedFor: boolean;
  onVote?: (candidateDbId: string) => void;
  isLoadingVote?: boolean;
  totalVotes?: bigint;
  showResults?: boolean;
}

export function CandidateCard({
  candidate,
  isVotingActive,
  hasVoted,
  isVotedFor,
  onVote,
  isLoadingVote = false,
  totalVotes = 0n,
  showResults = false,
}: Props) {
  const voteCount = Number(candidate.voteCount);
  const total = Number(totalVotes);
  const percentage = total > 0 ? (voteCount / total) * 100 : 0;

  return (
    <article
      className={`${styles.option} ${isVotedFor ? styles.selected : ''}`}
      aria-current={isVotedFor ? 'true' : undefined}
    >
      <div className={styles.mark} aria-hidden="true">
        {isVotedFor ? <Check size={14} strokeWidth={2.5} /> : null}
      </div>

      <div className={styles.body}>
        <div className={styles.header}>
          <h3 className={styles.name}>{candidate.name}</h3>
        </div>

        {candidate.description && (
          <p className={styles.desc}>{candidate.description}</p>
        )}

        {showResults && (
          <div className={styles.results}>
            <div className={styles.resultsLabel}>
              <span>{voteCount.toLocaleString()} {voteCount === 1 ? 'vote' : 'votes'}</span>
              <span>{percentage.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        )}

        {isVotingActive && (
          <div className={styles.actions}>
            {isVotedFor ? (
              <p className={styles.votedNote}>Your ballot is recorded for this choice.</p>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                disabled={hasVoted || isLoadingVote || !candidate.approved}
                onClick={() => onVote?.(candidate.dbId)}
              >
                {isLoadingVote ? 'Submitting…' : hasVoted ? 'Vote recorded' : 'Select this candidate'}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
