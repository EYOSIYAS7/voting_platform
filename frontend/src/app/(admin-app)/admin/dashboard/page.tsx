'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { organizationsApi } from '@/lib/api/organizations';
import { employeesApi } from '@/lib/api/employees';
import { electionsApi } from '@/lib/api/elections';
import {
  Organization,
  Employee,
  Election,
  ElectionStatus,
  EmployeeStatus,
} from '@/lib/types/api';
import {
  Building2,
  Users,
  Vote,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import styles from './dashboard.module.css';

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

export default function AdminDashboardPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [orgs, emps, elecs] = await Promise.all([
          organizationsApi.getOrganizations().catch(() => []),
          employeesApi.getEmployees().catch(() => []),
          electionsApi.getElections().catch(() => []),
        ]);
        setOrganizations(orgs);
        setEmployees(emps);
        setElections(elecs);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const activeEmployees = employees.filter((e) => e.status === EmployeeStatus.ACTIVE).length;
  const activeElections = elections.filter((e) => e.status === ElectionStatus.ACTIVE).length;
  const recentElections = elections.slice(0, 5);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>System Overview</h1>
        <p className={styles.subtitle}>
          Administrative command & sovereign ledger telemetry for INSA e-voting infrastructure.
        </p>
      </header>

      {/* Stats Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap}>
            <Building2 size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Organizations</span>
            <strong className={styles.statValue}>{organizations.length}</strong>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap}>
            <Users size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Active Employees</span>
            <strong className={styles.statValue}>{activeEmployees}</strong>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap}>
            <Vote size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Elections</span>
            <strong className={styles.statValue}>{elections.length}</strong>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(19, 122, 77, 0.12)', color: 'var(--color-success)' }}>
            <Activity size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Open Now</span>
            <strong className={styles.statValue}>{activeElections}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.layoutGrid}>
        <div>
          {/* Quick Nav Cards */}
          <section className={styles.quickLinksSection}>
            <h2 className={styles.sectionHeading}>Management Domains</h2>
            <div className={styles.quickCardsGrid}>
              <Link href="/admin/organization" className={styles.quickCard}>
                <div className={styles.quickCardHeader}>
                  <Building2 size={20} />
                  <ArrowRight size={16} />
                </div>
                <h3 className={styles.quickCardTitle}>Structure & Units</h3>
                <p className={styles.quickCardDesc}>
                  Configure organizational entities, hierarchical unit trees, and rank levels.
                </p>
              </Link>

              <Link href="/admin/employees" className={styles.quickCard}>
                <div className={styles.quickCardHeader}>
                  <Users size={20} />
                  <ArrowRight size={16} />
                </div>
                <h3 className={styles.quickCardTitle}>Employees & Accounts</h3>
                <p className={styles.quickCardDesc}>
                  Register personnel, issue login credentials, and assign role scopes.
                </p>
              </Link>

              <Link href="/admin/elections" className={styles.quickCard}>
                <div className={styles.quickCardHeader}>
                  <Vote size={20} />
                  <ArrowRight size={16} />
                </div>
                <h3 className={styles.quickCardTitle}>Elections Audit</h3>
                <p className={styles.quickCardDesc}>
                  Monitor lifecycle statuses and inspect blockchain state across all elections.
                </p>
              </Link>
            </div>
          </section>

          {/* Recent Elections Table */}
          <section className={styles.recentPanel}>
            <div className={styles.sectionHeading}>
              <span>Recent Elections</span>
              <Link href="/admin/elections" className="btn btn-ghost btn-sm">
                View all
              </Link>
            </div>

            {recentElections.length === 0 ? (
              <div className={styles.emptyNotice}>
                No elections created in the system yet.
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Voting Window</th>
                      <th>On-Chain</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentElections.map((election) => (
                      <tr key={election.id}>
                        <td>
                          <span className={styles.electionTitle}>{election.title}</span>
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
                            <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.8rem' }}>
                              ✓ #{election.onChainElectionId}
                            </span>
                          ) : (
                            <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Off-chain</span>
                          )}
                        </td>
                        <td>
                          <Link href={`/admin/elections/${election.id}`} className="btn btn-ghost btn-sm">
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* System Ledger Status Panel */}
        <aside className={styles.systemPanel}>
          <div className={styles.sectionHeading} style={{ margin: 0 }}>
            <span>System Telemetry</span>
            <div className={styles.statusIndicator}>
              <span className={styles.liveDot} />
              <span>Operational</span>
            </div>
          </div>

          <dl className={styles.specList}>
            <div className={styles.specItem}>
              <dt className={styles.specLabel}>Blockchain Engine</dt>
              <dd className={styles.specValue}>Hyperledger Besu (Private)</dd>
            </div>

            <div className={styles.specItem}>
              <dt className={styles.specLabel}>Chain ID</dt>
              <dd className={styles.specValue}>1337 (INSA Local Cluster)</dd>
            </div>

            <div className={styles.specItem}>
              <dt className={styles.specLabel}>Consensus Algorithm</dt>
              <dd className={styles.specValue}>IBFT 2.0 Proof of Authority</dd>
            </div>

            <div className={styles.specItem}>
              <dt className={styles.specLabel}>Relay Architecture</dt>
              <dd className={styles.specValue}>Server-Signed Zero-Gas Relay</dd>
            </div>

            <div className={styles.specItem}>
              <dt className={styles.specLabel}>Voter Anonymity</dt>
              <dd className={styles.specValue}>keccak256 Pseudonymous voterRef</dd>
            </div>
          </dl>

          <div className={styles.noticeBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              <ShieldCheck size={15} style={{ color: 'var(--color-accent)' }} />
              <span>Architectural Model</span>
            </div>
            System Administrators govern off-chain organizational hierarchies and registries.
            Election ballot management and candidacy reviews are executed by election creators.
          </div>
        </aside>
      </div>
    </div>
  );
}

