'use client';

import { Candidate } from '@/lib/abi/votingPlatform';
import styles from './ResultsChart.module.css';

interface Props {
  candidates: Candidate[];
  totalVotes: bigint;
}

export function ResultsChart({ candidates, totalVotes }: Props) {
  const total = Number(totalVotes);

  const sortedCandidates = [...candidates].sort((a, b) => {
    return Number(b.voteCount) - Number(a.voteCount);
  });

  return (
    <section className={styles.container} aria-labelledby="results-heading">
      <div className={styles.header}>
        <h3 id="results-heading" className={styles.title}>Results</h3>
        <p className={styles.total}>
          {total.toLocaleString()} {total === 1 ? 'vote' : 'votes'}
        </p>
      </div>

      <div className={styles.list}>
        {sortedCandidates.length === 0 ? (
          <p className={styles.empty}>No approved candidates.</p>
        ) : (
          sortedCandidates.map((candidate, index) => {
            const voteCount = Number(candidate.voteCount);
            const percentage = total > 0 ? (voteCount / total) * 100 : 0;
            const isLeading = index === 0 && voteCount > 0;

            return (
              <div key={candidate.id.toString()} className={styles.row}>
                <div className={styles.infoRow}>
                  <span className={`${styles.name} ${isLeading ? styles.leading : ''}`}>
                    {candidate.name}
                  </span>
                  <span className={styles.voteStats}>
                    <span>{voteCount.toLocaleString()}</span>
                    <span className={styles.percentage}>{percentage.toFixed(1)}%</span>
                  </span>
                </div>
                <div className={styles.track}>
                  <div
                    className={`${styles.bar} ${isLeading ? styles.leadBar : ''}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
