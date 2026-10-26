'use client';

import Link from 'next/link';
import { Election, ElectionStatus } from '@/lib/types/api';
import { CountdownTimer } from './CountdownTimer';
import styles from './ElectionCard.module.css';

interface Props {
  election: Election;
  candidateCount?: number;
}

const STATUS_CONFIG: Record<ElectionStatus, { label: string; cls: string }> = {
  [ElectionStatus.DRAFT]:        { label: 'Draft',           cls: 'status-pending' },
  [ElectionStatus.REGISTRATION]: { label: 'Registration',    cls: 'status-registration' },
  [ElectionStatus.UPCOMING]:     { label: 'Voting soon',     cls: 'status-upcoming' },
  [ElectionStatus.ACTIVE]:       { label: 'Voting open',     cls: 'status-active' },
  [ElectionStatus.ENDED]:        { label: 'Closed',          cls: 'status-ended' },
  [ElectionStatus.CANCELLED]:    { label: 'Cancelled',       cls: 'status-ended' },
};

export function ElectionCard({ election, candidateCount }: Props) {
  const cfg = STATUS_CONFIG[election.status] ?? STATUS_CONFIG[ElectionStatus.ENDED];

  const isActive = election.status === ElectionStatus.ACTIVE;
  const isEnded  = election.status === ElectionStatus.ENDED;

  const voteStart = new Date(election.startDate).getTime() / 1000;
  const voteEnd   = new Date(election.endDate).getTime()   / 1000;
  const regEnd    = election.registrationDeadline
    ? new Date(election.registrationDeadline).getTime() / 1000
    : null;

  const countdownTarget =
    election.status === ElectionStatus.REGISTRATION && regEnd ? regEnd :
    election.status === ElectionStatus.UPCOMING               ? voteStart :
    election.status === ElectionStatus.ACTIVE                 ? voteEnd :
    null;

  const countdownLabel =
    election.status === ElectionStatus.REGISTRATION ? 'Registration closes in' :
    election.status === ElectionStatus.UPCOMING     ? 'Voting starts in'       :
    election.status === ElectionStatus.ACTIVE       ? 'Voting ends in'         :
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
