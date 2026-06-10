'use client';

import { useState, useEffect } from 'react';
import styles from './CountdownTimer.module.css';

interface Props {
  targetTimestamp: number; // Unix seconds
  compact?: boolean;
  onExpire?: () => void;
}

interface TimeLeft {
  days:    number;
  hours:   number;
  minutes: number;
  seconds: number;
  total:   number;
}

function calc(target: number): TimeLeft {
  const total = Math.max(0, target - Math.floor(Date.now() / 1000));
  return {
    days:    Math.floor(total / 86400),
    hours:   Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    total,
  };
}

export function CountdownTimer({ targetTimestamp, compact, onExpire }: Props) {
  const [tl, setTl] = useState<TimeLeft>(() => calc(targetTimestamp));

  useEffect(() => {
    if (tl.total === 0) { onExpire?.(); return; }
    const id = setInterval(() => {
      const next = calc(targetTimestamp);
      setTl(next);
      if (next.total === 0) { onExpire?.(); clearInterval(id); }
    }, 1000);
    return () => clearInterval(id);
  }, [targetTimestamp, onExpire]);

  if (tl.total === 0) return <span className={styles.expired}>Ended</span>;

  if (compact) {
    const parts = [];
    if (tl.days > 0) parts.push(`${tl.days}d`);
    parts.push(`${String(tl.hours).padStart(2,'0')}h`);
    parts.push(`${String(tl.minutes).padStart(2,'0')}m`);
    parts.push(`${String(tl.seconds).padStart(2,'0')}s`);
    return <span className={styles.compact}>{parts.join(' ')}</span>;
  }

  const units = [
    { label: 'Days',    val: tl.days    },
    { label: 'Hours',   val: tl.hours   },
    { label: 'Mins',    val: tl.minutes },
    { label: 'Secs',    val: tl.seconds },
  ];

  return (
    <div className={styles.timer}>
      {units.map(({ label, val }) => (
        <div key={label} className={styles.unit}>
          <span className={styles.value}>{String(val).padStart(2, '0')}</span>
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
}
