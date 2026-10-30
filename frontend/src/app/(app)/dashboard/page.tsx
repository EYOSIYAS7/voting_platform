'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { electionsApi } from '@/lib/api/elections';
import { Election, ElectionStatus } from '@/lib/types/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { ElectionCard } from '@/components/ElectionCard';
import { Vote, ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

export default function DashboardPage() {
  const { isAuthenticated, employee } = useAuthStore();
  const [elections, setElections] = useState<Election[]>([]);
  const [myEligibleElections, setMyEligibleElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Fetch system-wide elections for overview
    const p1 = electionsApi
      .getElections()
      .then((data) => {
        setElections(data.slice(0, 6));
      })
      .catch(() => setIsError(true));

    // Fetch personal eligible elections if authenticated
    const p2 = isAuthenticated
      ? electionsApi
          .getMyElections()
          .then((data) => setMyEligibleElections(data))
          .catch(() => {})
      : Promise.resolve();

    Promise.all([p1, p2]).finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const allActiveCount = elections.filter((e) => e.status === ElectionStatus.ACTIVE).length;
  const myOpenBallots = myEligibleElections.filter((e) => e.status === ElectionStatus.ACTIVE);

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>
            {isAuthenticated && employee?.firstName
              ? `Welcome, ${employee.firstName}`
              : 'Elections Overview'}
          </h1>
          <p>Institutional ballots, eligible participation, and immutable blockchain records.</p>
        </div>
        <div className={styles.headActions}>
          <Link href="/elections" className="btn btn-primary">
            Eligible Elections
          </Link>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span>Total Ballots</span>
          <strong>{isLoading ? '—' : elections.length}</strong>
        </div>
        <div className="stat">
          <span>Open in System</span>
          <strong>{isLoading ? '—' : allActiveCount}</strong>
        </div>
        <div className="stat">
          <span>Your Eligible</span>
          <strong>{isLoading ? '—' : isAuthenticated ? myEligibleElections.length : '—'}</strong>
        </div>
        <div className="stat">
          <span>Your Open Ballots</span>
          <strong style={{ color: myOpenBallots.length > 0 ? 'var(--color-primary)' : 'inherit' }}>
            {isLoading ? '—' : isAuthenticated ? myOpenBallots.length : '—'}
          </strong>
        </div>
      </div>

      <div className={styles.dash}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
          {/* ── Your Open Ballots (Personalized Priority Section) ── */}
          {isAuthenticated && myOpenBallots.length > 0 && (
            <section
              className={`panel ${styles.mainPanel}`}
              style={{
                borderLeft: '3px solid var(--color-primary)',
                background: 'var(--color-elevated)',
              }}
            >
              <div className={styles.panelHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Vote size={18} style={{ color: 'var(--color-primary)' }} />
                  <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Your Open Ballots</h2>
                  <span
                    style={{
                      background: 'var(--color-primary)',
                      color: '#FFFFFF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '12px',
                    }}
                  >
                    {myOpenBallots.length} Ready
                  </span>
                </div>
                <Link
                  href="/elections"
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <span>View all eligible</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              <div className={styles.electionsGrid}>
                {myOpenBallots.map((election) => (
                  <ElectionCard key={`my-${election.id}`} election={election} />
                ))}
              </div>
            </section>
          )}

          {/* ── System Elections Overview ── */}
          <section className={`panel ${styles.mainPanel}`}>
            <div className={styles.panelHead}>
              <h2 style={{ fontSize: '1.05rem', margin: 0 }}>All Elections</h2>
              {elections.length > 0 && (
                <Link href="/elections" className="btn btn-ghost btn-sm">
                  View eligible
                </Link>
              )}
            </div>

            {isLoading ? (
              <div className={styles.loaderContainer}>
                <div className="spinner" />
              </div>
            ) : isError || elections.length === 0 ? (
              <div className="empty-state">
                <h3>No elections found</h3>
                <p>There are currently no active or scheduled institutional ballots.</p>
              </div>
            ) : (
              <div className={styles.electionsGrid}>
                {elections.map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className={`panel panel-pad ${styles.sidePanel}`}>
          <h2 className={styles.sideTitle}>How your vote is recorded</h2>
          <ol className={styles.steps}>
            <li>
              <strong>1. Cryptographic Ballot Receipt</strong>
              <p>Your vote is committed to Hyperledger Besu with a verifiable transaction hash.</p>
            </li>
            <li>
              <strong>2. Absolute Ballot Secrecy</strong>
              <p>Zero-knowledge cryptographic hashing guarantees your choice remains confidential.</p>
            </li>
            <li>
              <strong>3. Real-Time Distributed Tally</strong>
              <p>Results synchronize continuously with every block. Audit the ledger anytime.</p>
            </li>
          </ol>
        </aside>
      </div>
    </div>
  );
}
