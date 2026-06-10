'use client';

import Link from 'next/link';
import { Election, ElectionStatus } from '@/lib/abi/votingPlatform';
import { useElectionStatus } from '@/lib/hooks/useContract';
import { CountdownTimer } from './CountdownTimer';
import { Users, Clock, ArrowRight, Image as ImageIcon } from 'lucide-react';
import styles from './ElectionCard.module.css';

interface Props {
  election: Election;
  candidateCount?: number;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: boolean }> = {
  Active:       { label: 'Live',         cls: 'badge-active',       dot: true  },
  Upcoming:     { label: 'Upcoming',     cls: 'badge-upcoming',     dot: false },
  Registration: { label: 'Open Reg.',    cls: 'badge-registration', dot: true  },
  Pending:      { label: 'Pending',      cls: 'badge-pending',      dot: false },
  Ended:        { label: 'Ended',        cls: 'badge-ended',        dot: false },
};

export function ElectionCard({ election, candidateCount }: Props) {
  const { data: status } = useElectionStatus(election.id);
  const cfg = STATUS_CONFIG[status as string] ?? STATUS_CONFIG['Ended'];

  const now   = BigInt(Math.floor(Date.now() / 1000));
  const isActive  = status === 'Active';
  const isEnded   = status === 'Ended';

  // Decide what the countdown is counting toward
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

  return (
    <Link href={`/elections/${election.id}`} className={`card card-glow ${styles.card}`}>
      {/* Cover Image / Placeholder */}
      <div className={styles.cover}>
        {election.imageUrl ? (
          <img src={election.imageUrl} alt={election.title} className={styles.coverImg} />
        ) : (
          <div className={styles.coverPlaceholder}>
            <ImageIcon size={32} strokeWidth={1} style={{ opacity: 0.2 }} />
          </div>
        )}
        <span className={`badge ${cfg.cls} ${cfg.dot ? 'badge-dot' : ''} ${styles.badge}`}>
          {cfg.label}
        </span>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.title}>{election.title}</h3>
        {election.description && (
          <p className={styles.desc}>{election.description}</p>
        )}

        <div className={styles.meta}>
          {candidateCount !== undefined && (
            <span className={styles.metaItem}>
              <Users size={13} />
              {candidateCount} candidate{candidateCount !== 1 ? 's' : ''}
            </span>
          )}
          {isEnded && (
            <span className={styles.metaItem}>
              <Clock size={13} />
              {Number(election.totalVotes).toLocaleString()} votes cast
            </span>
          )}
        </div>

        {countdownTarget && countdownLabel && (
          <div className={styles.countdown}>
            <span className={styles.countdownLabel}>{countdownLabel}</span>
            <CountdownTimer targetTimestamp={countdownTarget} compact />
          </div>
        )}

        <div className={styles.cta}>
          <span>{isEnded ? 'View Results' : isActive ? 'Vote Now' : 'View Details'}</span>
          <ArrowRight size={15} />
        </div>
      </div>
    </Link>
  );
}
