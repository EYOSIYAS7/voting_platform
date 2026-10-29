'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { electionsApi } from '@/lib/api/elections';
import { Election, ElectionStatus } from '@/lib/types/api';
import {
  Vote,
  Search,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import styles from './admin-elections.module.css';

const STATUS_LABELS: Record<ElectionStatus, string> = {
  [ElectionStatus.DRAFT]: 'Draft',
  [ElectionStatus.REGISTRATION]: 'Registration',
  [ElectionStatus.UPCOMING]: 'Upcoming',
  [ElectionStatus.ACTIVE]: 'Open',
  [ElectionStatus.ENDED]: 'Closed',
  [ElectionStatus.CANCELLED]: 'Cancelled',
};

const STATUS_CLASSES: Record<ElectionStatus, string> = {
  [ElectionStatus.DRAFT]: 'status-pending',
  [ElectionStatus.REGISTRATION]: 'status-registration',
  [ElectionStatus.UPCOMING]: 'status-upcoming',
  [ElectionStatus.ACTIVE]: 'status-active',
  [ElectionStatus.ENDED]: 'status-ended',
  [ElectionStatus.CANCELLED]: 'status-ended',
};

type StatusFilter = 'All' | ElectionStatus;

export default function AdminElectionsAuditPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');

  useEffect(() => {
    async function loadElections() {
      try {
        setIsLoading(true);
        const data = await electionsApi.getElections();
        setElections(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadElections();
  }, []);

  const filteredElections = useMemo(() => {
    return elections.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'All' || e.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [elections, searchQuery, activeFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: elections.length };
    Object.values(ElectionStatus).forEach((st) => {
      c[st] = elections.filter((e) => e.status === st).length;
    });
    return c;
  }, [elections]);

  const FILTERS: { value: StatusFilter; label: string }[] = [
    { value: 'All', label: `All (${counts.All || 0})` },
    { value: ElectionStatus.ACTIVE, label: `Open (${counts[ElectionStatus.ACTIVE] || 0})` },
    { value: ElectionStatus.REGISTRATION, label: `Registration (${counts[ElectionStatus.REGISTRATION] || 0})` },
    { value: ElectionStatus.UPCOMING, label: `Upcoming (${counts[ElectionStatus.UPCOMING] || 0})` },
    { value: ElectionStatus.ENDED, label: `Closed (${counts[ElectionStatus.ENDED] || 0})` },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Electoral Ledger Audit</h1>
        <p className={styles.subtitle}>
          System-wide immutable ledger observation. Ballot management is governed by election creators.
        </p>
      </header>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterTabs}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`${styles.filterBtn} ${activeFilter === f.value ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="search"
            className={`form-input ${styles.searchInput}`}
            placeholder="Search by title, description or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table Panel */}
      <div className={styles.tablePanel}>
        <div className={styles.tableWrapper}>
          {isLoading ? (
            <div style={{ padding: '3.5rem', display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          ) : filteredElections.length === 0 ? (
            <div className={styles.emptyState}>
              <Vote size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p>No elections found matching the selected filters.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Election Title</th>
                  <th>Scope Type</th>
                  <th>Lifecycle Status</th>
                  <th>Voting Window</th>
                  <th>Ledger Record</th>
                  <th style={{ textAlign: 'right' }}>Audit</th>
                </tr>
              </thead>
              <tbody>
                {filteredElections.map((election) => (
                  <tr key={election.id}>
                    <td>
                      <span className={styles.electionTitle}>{election.title}</span>
                      {election.description && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', display: 'block' }}>
                          {election.description.slice(0, 65)}...
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={styles.typeBadge}>
                        {election.electionType.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${STATUS_CLASSES[election.status]}`}>
                        {STATUS_LABELS[election.status]}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {new Date(election.startDate).toLocaleDateString()} –{' '}
                      {new Date(election.endDate).toLocaleDateString()}
                    </td>
                    <td>
                      {election.onChainElectionId ? (
                        <span className={styles.onChainBadge}>
                          <CheckCircle size={14} />
                          <span>On-Chain #{election.onChainElectionId}</span>
                        </span>
                      ) : (
                        <span className={styles.offChainBadge}>Off-Chain (Draft/Unpublished)</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/admin/elections/${election.id}`}
                        className="btn btn-ghost btn-sm"
                        title="Inspect election audit trail"
                      >
                        <span>Inspect</span>
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

