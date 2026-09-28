'use client';

import Link from 'next/link';
import { Election } from '@/lib/abi/votingPlatform';
import { useElectionStatus } from '@/lib/hooks/useContract';
import { CountdownTimer } from './CountdownTimer';
import styles from './ElectionCard.module.css';

interface Props {
  election: Election;
  candidateCount?: number;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  Active:       { label: 'Voting open',     cls: 'status-active' },
  Upcoming:     { label: 'Voting soon',     cls: 'status-upcoming' },
  Registration: { label: 'Registration',    cls: 'status-registration' },
  Pending:      { label: 'Not yet open',    cls: 'status-pending' },
  Ended:        { label: 'Closed',          cls: 'status-ended' },
};

export function ElectionCard({ election, candidateCount }: Props) {
  const { data: status } = useElectionStatus(election.id);
  const cfg = STATUS_CONFIG[status as string] ?? STATUS_CONFIG['Ended'];

  const isActive = status === 'Active';
  const isEnded  = status === 'Ended';

  const countdownTarget =
    status === 'Pending'      ? Number(election.registrationStart) :
    status === 'Registration' ? Number(election.registrationEnd)   :
    status === 'Upcoming'     ? Number(election.votingStart)       :
    status === 'Active'       ? Number(election.votingEnd)         :
    null;

  const countdownLabel =
    status === 'Pending'      ? 'Registration opens in' :
    status === 'Registration' ? 'Registration closes in' :
    status === 'Upcoming'     ? 'Voting starts in'      :
    status === 'Active'       ? 'Voting ends in'        :
    null;

  const action = isEnded ? 'Results' : isActive ? 'Vote' : 'Details';

  return (
    <Link href={`/elections/${election.id}`} className={styles.row}>
      <div className={styles.main}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{election.title}</h3>
          <span className={`status ${cfg.cls}`}>{cfg.label}</span>
        </div>
        {election.description && (
          <p className={styles.desc}>{election.description}</p>
        )}
      </div>
      <div className={styles.footer}>
        <div className={styles.meta}>
          {candidateCount !== undefined && (
            <span>
              {candidateCount} candidate{candidateCount !== 1 ? 's' : ''}
            </span>
          )}
          {isEnded && (
            <span>{Number(election.totalVotes).toLocaleString()} votes</span>
          )}
          {countdownTarget && countdownLabel && (
            <span>
              {countdownLabel}{' '}
              <CountdownTimer targetTimestamp={countdownTarget} compact />
            </span>
          )}
        </div>
        <span className={styles.action}>{action}</span>
      </div>
    </Link>
  );
}
