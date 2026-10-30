'use client';

import { useState, useMemo, useEffect } from 'react';
import { electionsApi } from '@/lib/api/elections';
import { Election, ElectionStatus } from '@/lib/types/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { ElectionCard } from '@/components/ElectionCard';
import { LoginModal } from '@/components/LoginModal';
import { Vote, LogIn, AlertCircle } from 'lucide-react';
import styles from './elections.module.css';

type StatusFilter = 'All' | 'ACTIVE' | 'UPCOMING' | 'REGISTRATION' | 'ENDED';

export default function ElectionsPage() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [elections, setElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    electionsApi
      .getMyElections()
      .then(setElections)
      .catch((err) => setError(err.message || 'Failed to load your eligible elections'))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, isInitialized]);

  const filteredElections = useMemo(() => {
    return elections.filter((election) => {
      const matchesSearch =
        election.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (election.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        activeFilter === 'All' || election.status === (activeFilter as ElectionStatus);
      return matchesSearch && matchesFilter;
    });
  }, [elections, searchQuery, activeFilter]);

  const counts = useMemo(() => {
    const byStatus = { ACTIVE: 0, UPCOMING: 0, REGISTRATION: 0, ENDED: 0 };
    elections.forEach(({ status }) => {
      if (status in byStatus) byStatus[status as keyof typeof byStatus] += 1;
    });
    return byStatus;
  }, [elections]);

  const FILTERS: { value: StatusFilter; label: string }[] = [
    { value: 'All', label: 'All' },
    { value: 'ACTIVE', label: 'Open' },
    { value: 'REGISTRATION', label: 'Registration' },
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'ENDED', label: 'Closed' },
  ];

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Eligible Elections</h1>
          <p>Elections you are verified and eligible to participate in.</p>
        </div>
      </div>

      {!isAuthenticated && isInitialized ? (
        <div className="empty-state" style={{ maxWidth: 460, margin: '3rem auto', textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>
            <Vote size={48} />
          </div>
          <h3>Authentication Required</h3>
          <p>Sign in with your employee credentials to see the ballots you are eligible to vote in.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setLoginModalOpen(true)}
            style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <LogIn size={16} /> Sign In
          </button>
        </div>
      ) : (
        <>
          <div className="stat-row">
            <div className="stat">
              <span>Total Eligible</span>
              <strong>{isLoading ? '—' : elections.length}</strong>
            </div>
            <div className="stat">
              <span>Open Ballots</span>
              <strong>{isLoading ? '—' : counts.ACTIVE}</strong>
            </div>
            <div className="stat">
              <span>Registration</span>
              <strong>{isLoading ? '—' : counts.REGISTRATION}</strong>
            </div>
            <div className="stat">
              <span>Closed</span>
              <strong>{isLoading ? '—' : counts.ENDED}</strong>
            </div>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.filters} role="tablist" aria-label="Filter elections">
              {FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.filterBtn} ${activeFilter === value ? styles.filterBtnActive : ''}`}
                  onClick={() => setActiveFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.searchWrapper}>
              <label
                htmlFor="election-search"
                className="sr-only"
                style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
              >
                Search elections
              </label>
              <input
                id="election-search"
                type="search"
                placeholder="Search eligible ballots..."
                className={`form-input ${styles.searchInput}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className={styles.loaderContainer}>
              <div className="spinner" />
            </div>
          ) : error ? (
            <div className="empty-state">
              <AlertCircle size={32} style={{ color: 'var(--color-danger)', marginBottom: '0.5rem' }} />
              <h3>Failed to load elections</h3>
              <p>{error}</p>
            </div>
          ) : filteredElections.length === 0 ? (
            <div className="empty-state">
              {elections.length === 0 ? (
                <>
                  <h3>No eligible elections</h3>
                  <p>You have not been assigned to any elections yet. Contact your administrator or check back soon.</p>
                </>
              ) : (
                <>
                  <h3>No matching elections</h3>
                  <p>Try clearing your search query or choosing a different status filter.</p>
                </>
              )}
            </div>
          ) : (
            <div className={styles.list}>
              {filteredElections.map((election) => (
                <ElectionCard key={election.id} election={election} />
              ))}
            </div>
          )}
        </>
      )}

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
}
