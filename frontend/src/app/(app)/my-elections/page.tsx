'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { electionsApi } from '@/lib/api/elections';
import { Election, ElectionStatus, SystemRole } from '@/lib/types/api';
import {
  Vote,
  Plus,
  Search,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  Sparkles,
  Loader2,
  FileQuestion,
} from 'lucide-react';
import styles from './my-elections.module.css';

const STATUS_CONFIG: Record<
  ElectionStatus,
  { label: string; class: string; dotColor: string }
> = {
  [ElectionStatus.DRAFT]: {
    label: 'Draft',
    class: 'status-pending',
    dotColor: '#B5651D',
  },
  [ElectionStatus.REGISTRATION]: {
    label: 'Registration Open',
    class: 'status-registration',
    dotColor: '#6B4A78',
  },
  [ElectionStatus.UPCOMING]: {
    label: 'Upcoming / Review',
    class: 'status-upcoming',
    dotColor: '#2D57A8',
  },
  [ElectionStatus.ACTIVE]: {
    label: 'Active Voting',
    class: 'status-active',
    dotColor: '#137A4D',
  },
  [ElectionStatus.ENDED]: {
    label: 'Concluded',
    class: 'status-ended',
    dotColor: '#667A9E',
  },
  [ElectionStatus.CANCELLED]: {
    label: 'Cancelled',
    class: 'status-ended',
    dotColor: '#D92828',
  },
};

type StatusFilter = 'ALL' | ElectionStatus;

export default function MyElectionsPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, hasRole } = useAuthStore();

  const canManage =
    hasRole(SystemRole.ELECTION_ADMIN) || hasRole(SystemRole.SYSTEM_ADMIN);

  const [elections, setElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL');

  // Guard access
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !canManage) {
        router.replace('/dashboard');
      }
    }
  }, [isInitialized, isAuthenticated, canManage, router]);

  // Load elections created by authenticated employee
  useEffect(() => {
    async function loadData() {
      if (!isAuthenticated || !canManage) return;
      try {
        setIsLoading(true);
        const data = await electionsApi.getMyCreatedElections();
        setElections(data);
      } catch (err) {
        console.error('Failed to load created elections:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (isInitialized && isAuthenticated && canManage) {
      loadData();
    }
  }, [isInitialized, isAuthenticated, canManage]);

  // Counts and filtered items
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      ALL: elections.length,
      [ElectionStatus.DRAFT]: 0,
      [ElectionStatus.REGISTRATION]: 0,
      [ElectionStatus.UPCOMING]: 0,
      [ElectionStatus.ACTIVE]: 0,
      [ElectionStatus.ENDED]: 0,
      [ElectionStatus.CANCELLED]: 0,
      onChain: 0,
    };
    for (const e of elections) {
      c[e.status] = (c[e.status] || 0) + 1;
      if (e.onChainElectionId) {
        c.onChain += 1;
      }
    }
    return c;
  }, [elections]);

  const filteredElections = useMemo(() => {
    return elections.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        e.id.toLowerCase().includes(q) ||
        (e.onChainElectionId && e.onChainElectionId.includes(q));

      const matchesFilter =
        activeFilter === 'ALL' || e.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [elections, searchQuery, activeFilter]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (!isInitialized || (isLoading && elections.length === 0)) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Loader2 className={styles.spinner} size={36} />
          <span>Loading your managed elections...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Managed Elections</h1>
          <p className={styles.subtitle}>
            Workspace for election creators to configure ballots, review nominations, compute voter eligibility rolls, and publish to Hyperledger Besu.
          </p>
        </div>
        <Link href="/create-election" className={styles.createBtn}>
          <Plus size={16} strokeWidth={2.5} />
          <span>Create Election</span>
        </Link>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap}>
            <Vote size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{counts.ALL}</span>
            <span className={styles.statLabel}>Total Created</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.draft}`}>
            <Clock size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>
              {counts[ElectionStatus.DRAFT] + counts[ElectionStatus.REGISTRATION]}
            </span>
            <span className={styles.statLabel}>Draft & Nomination</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.active}`}>
            <Sparkles size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{counts[ElectionStatus.ACTIVE]}</span>
            <span className={styles.statLabel}>Active Voting</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.chain}`}>
            <ShieldCheck size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{counts.onChain}</span>
            <span className={styles.statLabel}>On-Chain Published</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.filterBtn} ${
              activeFilter === 'ALL' ? styles.filterBtnActive : ''
            }`}
            onClick={() => setActiveFilter('ALL')}
          >
            All ({counts.ALL})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${
              activeFilter === ElectionStatus.DRAFT ? styles.filterBtnActive : ''
            }`}
            onClick={() => setActiveFilter(ElectionStatus.DRAFT)}
          >
            Draft ({counts[ElectionStatus.DRAFT]})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${
              activeFilter === ElectionStatus.REGISTRATION
                ? styles.filterBtnActive
                : ''
            }`}
            onClick={() => setActiveFilter(ElectionStatus.REGISTRATION)}
          >
            Registration ({counts[ElectionStatus.REGISTRATION]})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${
              activeFilter === ElectionStatus.UPCOMING
                ? styles.filterBtnActive
                : ''
            }`}
            onClick={() => setActiveFilter(ElectionStatus.UPCOMING)}
          >
            Upcoming ({counts[ElectionStatus.UPCOMING]})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${
              activeFilter === ElectionStatus.ACTIVE ? styles.filterBtnActive : ''
            }`}
            onClick={() => setActiveFilter(ElectionStatus.ACTIVE)}
          >
            Active ({counts[ElectionStatus.ACTIVE]})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${
              activeFilter === ElectionStatus.ENDED ? styles.filterBtnActive : ''
            }`}
            onClick={() => setActiveFilter(ElectionStatus.ENDED)}
          >
            Concluded ({counts[ElectionStatus.ENDED]})
          </button>
        </div>

        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search elections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table Panel */}
      <div className={styles.tablePanel}>
        {filteredElections.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FileQuestion size={28} />
            </div>
            <h3 className={styles.emptyTitle}>No managed elections found</h3>
            <p className={styles.emptyDesc}>
              {searchQuery
                ? `No elections matched the query "${searchQuery}".`
                : activeFilter !== 'ALL'
                ? `You have no elections currently in ${STATUS_CONFIG[activeFilter]?.label || activeFilter} status.`
                : 'You have not authored any elections yet. Start by creating your first organizational ballot.'}
            </p>
            {activeFilter === 'ALL' && !searchQuery && (
              <Link href="/create-election" className={styles.createBtn}>
                <Plus size={16} strokeWidth={2.5} />
                <span>Create First Election</span>
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Election Details</th>
                  <th>Status</th>
                  <th>Blockchain Ledger</th>
                  <th>Timeline</th>
                  <th>Voter Roll</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredElections.map((election) => {
                  const cfg =
                    STATUS_CONFIG[election.status] ||
                    STATUS_CONFIG[ElectionStatus.DRAFT];

                  return (
                    <tr key={election.id}>
                      {/* Election Details */}
                      <td>
                        <div className={styles.electionInfo}>
                          <Link
                            href={`/my-elections/${election.id}`}
                            className={styles.electionTitle}
                          >
                            <span>{election.title}</span>
                          </Link>
                          {election.description && (
                            <span className={styles.electionDesc}>
                              {election.description}
                            </span>
                          )}
                          <div className={styles.electionMetaTags}>
                            <span className={styles.typeBadge}>
                              {election.electionType === 'UNIT_SCOPED'
                                ? 'Unit-Scoped'
                                : 'General'}
                            </span>
                            <span className={styles.typeBadge}>
                              Max {election.maxCandidates} Candidates
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`${styles.statusBadge} ${cfg.class}`}
                        >
                          <span
                            className={styles.statusDot}
                            style={{ backgroundColor: cfg.dotColor }}
                          />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Blockchain Ledger */}
                      <td>
                        {election.onChainElectionId ? (
                          <span
                            className={`${styles.chainBadge} ${styles.chainBadgePublished}`}
                            title={`On-Chain Election ID: ${election.onChainElectionId}`}
                          >
                            <ShieldCheck size={14} />
                            <span>Besu #{election.onChainElectionId}</span>
                          </span>
                        ) : (
                          <span
                            className={`${styles.chainBadge} ${styles.chainBadgePending}`}
                            title="Not published to blockchain yet"
                          >
                            <ShieldAlert size={14} />
                            <span>Not Deployed</span>
                          </span>
                        )}
                      </td>

                      {/* Timeline */}
                      <td>
                        <div className={styles.dateInfo}>
                          <span className={styles.dateWindow}>
                            {formatDate(election.startDate)} –{' '}
                            {formatDate(election.endDate)}
                          </span>
                          {election.registrationDeadline && (
                            <span className={styles.dateSub}>
                              Nomination cutoff:{' '}
                              {formatDate(election.registrationDeadline)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Voter Roll */}
                      <td>
                        {election.votersComputed ? (
                          <span
                            className={`${styles.voterStatus} ${styles.voterAudited}`}
                          >
                            <CheckCircle2 size={14} />
                            <span>Roll Audited</span>
                          </span>
                        ) : (
                          <span
                            className={`${styles.voterStatus} ${styles.voterPending}`}
                          >
                            <Clock size={14} />
                            <span>Pending Compute</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/my-elections/${election.id}`}
                          className={styles.manageBtn}
                        >
                          <span>Manage Workspace</span>
                          <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

