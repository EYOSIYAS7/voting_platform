'use client';

import { useState } from 'react';
import { Candidate } from '@/lib/abi/votingPlatform';
import { Check, Copy, User, HelpCircle } from 'lucide-react';
import styles from './CandidateCard.module.css';

interface Props {
  candidate: Candidate;
  isVotingActive: boolean;
  hasVoted: boolean;
  isVotedFor: boolean;
  onVote?: (candidateId: bigint) => void;
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
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(candidate.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const voteCount = Number(candidate.voteCount);
  const total = Number(totalVotes);
  const percentage = total > 0 ? (voteCount / total) * 100 : 0;

  const displayAddress = `${candidate.walletAddress.substring(0, 6)}...${candidate.walletAddress.substring(candidate.walletAddress.length - 4)}`;

  return (
    <div className={`card ${styles.card} ${isVotedFor ? styles.votedCard : ''}`}>
      {/* Candidate Avatar / Image */}
      <div className={styles.avatarContainer}>
        {candidate.imageUrl ? (
          <img src={candidate.imageUrl} alt={candidate.name} className={styles.avatarImg} />
        ) : (
          <div className={styles.avatarPlaceholder}>
            <User size={36} className={styles.avatarIcon} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.name}>{candidate.name}</h3>
          <button
            onClick={handleCopyAddress}
            className={styles.addressBtn}
            title="Copy wallet address"
          >
            {copied ? <Check size={12} className={styles.copySuccess} /> : <Copy size={12} />}
            <span>{displayAddress}</span>
          </button>
        </div>

        {candidate.description && (
          <p className={styles.desc}>{candidate.description}</p>
        )}

        {/* Results Progression Bar */}
        {showResults && (
          <div className={styles.results}>
            <div className={styles.resultsLabel}>
              <span>{voteCount.toLocaleString()} vote{voteCount !== 1 ? 's' : ''}</span>
              <span className={styles.percentage}>{percentage.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Vote Actions */}
        {isVotingActive && (
          <div className={styles.actions}>
            {isVotedFor ? (
              <div className={styles.votedBadge}>
                <Check size={14} />
                <span>You voted for this candidate</span>
              </div>
            ) : (
              <button
                className={`btn btn-primary ${styles.voteBtn}`}
                disabled={hasVoted || isLoadingVote || !candidate.approved}
                onClick={() => onVote?.(candidate.id)}
              >
                {isLoadingVote ? 'Casting Vote...' : hasVoted ? 'Vote Cast' : 'Vote'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
