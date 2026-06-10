'use client';

import { Candidate } from '@/lib/abi/votingPlatform';
import { Award, User } from 'lucide-react';
import styles from './ResultsChart.module.css';

interface Props {
  candidates: Candidate[];
  totalVotes: bigint;
}

export function ResultsChart({ candidates, totalVotes }: Props) {
  const total = Number(totalVotes);

  // Sort candidates by vote count descending
  const sortedCandidates = [...candidates].sort((a, b) => {
    return Number(b.voteCount) - Number(a.voteCount);
  });

  const maxVotes = sortedCandidates.length > 0 ? Number(sortedCandidates[0].voteCount) : 0;

  return (
    <div className={`card ${styles.container}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Live Election Results</h3>
        <span className={styles.totalBadge}>
          {total.toLocaleString()} total vote{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className={styles.list}>
        {sortedCandidates.length === 0 ? (
          <div className={styles.empty}>No candidates approved for this election.</div>
        ) : (
          sortedCandidates.map((candidate, index) => {
            const voteCount = Number(candidate.voteCount);
            const percentage = total > 0 ? (voteCount / total) * 100 : 0;
            const isWinner = index === 0 && voteCount > 0;

            return (
              <div key={candidate.id.toString()} className={styles.row}>
                {/* Avatar */}
                <div className={styles.avatarCol}>
                  {candidate.imageUrl ? (
                    <img src={candidate.imageUrl} alt={candidate.name} className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      <User size={16} />
                    </div>
                  )}
                  {isWinner && (
                    <div className={styles.winnerCrown} title="Leading candidate">
                      <Award size={12} />
                    </div>
                  )}
                </div>

                {/* Info & Bar */}
                <div className={styles.detailsCol}>
                  <div className={styles.infoRow}>
                    <span className={`${styles.name} ${isWinner ? styles.leadingName : ''}`}>
                      {candidate.name}
                    </span>
                    <span className={styles.voteStats}>
                      <span className={styles.voteCount}>{voteCount.toLocaleString()}</span>
                      <span className={styles.percentage}>({percentage.toFixed(1)}%)</span>
                    </span>
                  </div>

                  <div className={styles.track}>
                    <div
                      className={`${styles.bar} ${isWinner ? styles.winnerBar : ''}`}
                      style={{ width: `${percentage > 0 ? percentage : 1}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
