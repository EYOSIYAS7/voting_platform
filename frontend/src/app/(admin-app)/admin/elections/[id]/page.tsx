'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { electionsApi } from '@/lib/api/elections';
import {
  Election,
  ElectionStatus,
  Candidate,
  CandidateStatus,
  EligibilityRule,
  VotingResultsResponse,
} from '@/lib/types/api';
import {
  Vote,
  ShieldAlert,
  CheckCircle,
  Clock,
  ArrowLeft,
  Users,
  Layers,
  Award,
  Calendar,
} from 'lucide-react';
import styles from '../admin-elections.module.css';

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

export default function AdminElectionInspectPage() {
  const params = useParams();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [rules, setRules] = useState<EligibilityRule[]>([]);
  const [results, setResults] = useState<VotingResultsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [elec, cands, ruleList] = await Promise.all([
        electionsApi.getElection(electionId),
        electionsApi.getCandidates(electionId),
        electionsApi.getEligibilityRules(electionId).catch(() => []),
      ]);
      setElection(elec);
      setCandidates(cands);
      setRules(ruleList);

      if (elec.status === ElectionStatus.ACTIVE || elec.status === ElectionStatus.ENDED) {
        const res = await electionsApi.getResults(electionId).catch(() => null);
        setResults(res);
      }
    } catch {
      // Handle error gracefully
    } finally {
      setIsLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading || !election) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const approvedCandidates = candidates.filter((c) => c.status === CandidateStatus.APPROVED);

  return (
    <div className={styles.container}>
      <Link href="/admin/elections" className="btn btn-ghost btn-sm" style={{ marginBottom: '1.25rem', display: 'inline-flex', gap: '0.4rem' }}>
        <ArrowLeft size={14} />
        <span>Back to Elections Audit</span>
      </Link>

      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <span className={`status ${STATUS_CLASSES[election.status]}`}>
            {STATUS_LABELS[election.status]}
          </span>
          <span className={styles.typeBadge}>
            {election.electionType.replace('_', ' ')}
          </span>
        </div>
        <h1 className={styles.title}>{election.title}</h1>
        {election.description && <p className={styles.subtitle}>{election.description}</p>}
      </header>

      {/* System Admin Notice */}
      <div className={styles.notice}>
        <ShieldAlert size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
        <span>
          <strong>System Administrator Inspection Mode:</strong> This view is strictly read-only.
          Lifecycle transitions, voter calculation, and candidate approvals are governed directly by the election creator.
        </span>
      </div>

      <div className={styles.detailGrid}>
        {/* Left Column: Candidates & Eligibility Rules */}
        <div>
          {/* Candidates */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                Approved Ballot Candidates ({approvedCandidates.length})
              </h2>
            </div>

            {approvedCandidates.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-3)', fontSize: '0.85rem' }}>
                No approved candidates on the ballot yet.
              </div>
            ) : (
              <div className={styles.candidateList}>
                {approvedCandidates.map((c) => {
                  const candResult = results?.candidates.find((r) => r.candidateId === c.id);
                  const name = c.employee
                    ? `${c.employee.firstName} ${c.employee.lastName}`
                    : 'Candidate';

                  return (
                    <div key={c.id} className={styles.candidateItem}>
                      <div>
                        <span className={styles.candName}>{name}</span>
                        {c.slogan && <span className={styles.candSub}> &ldquo;{c.slogan}&rdquo;</span>}
                        {c.onChainCandidateIndex !== null && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
                            ✓ On-Chain Candidate Index: {c.onChainCandidateIndex}
                          </span>
                        )}
                      </div>

                      {results && (
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '1rem', color: 'var(--color-text)' }}>
                            {candResult?.voteCount ?? 0} votes
                          </strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                            {candResult?.percentage ?? '0.0%'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Eligibility Rules */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                Eligibility Rules ({rules.length})
              </h2>
            </div>

            {rules.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-3)', fontSize: '0.85rem' }}>
                No custom eligibility rules defined. Default: All active organizational employees.
              </div>
            ) : (
              <div className={styles.candidateList}>
                {rules.map((rule, idx) => (
                  <div key={rule.id || idx} className={styles.candidateItem}>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
                        Rule #{idx + 1}
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-2)' }}>
                        {rule.description || 'Scoped organizational criteria'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                      Min Tenure: {rule.minTenureMonths} mo
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Ledger & Schedule Specs */}
        <aside>
          <div className={styles.card}>
            <h3 className={styles.cardTitle} style={{ marginBottom: '1rem' }}>
              Ledger Specifications
            </h3>

            <div className={styles.specRow}>
              <span className={styles.specLabel}>Blockchain Engine</span>
              <span className={styles.specVal}>Hyperledger Besu</span>
            </div>

            <div className={styles.specRow}>
              <span className={styles.specLabel}>On-Chain ID</span>
              <span className={styles.specVal}>
                {election.onChainElectionId ? (
                  <span style={{ color: 'var(--color-success)' }}>
                    #{election.onChainElectionId}
                  </span>
                ) : (
                  'Not Published'
                )}
              </span>
            </div>

            <div className={styles.specRow}>
              <span className={styles.specLabel}>Voter Computation</span>
              <span className={styles.specVal}>
                {election.votersComputed ? '✓ Pre-Computed' : 'Pending'}
              </span>
            </div>

            <div className={styles.specRow}>
              <span className={styles.specLabel}>Max Ballot Capacity</span>
              <span className={styles.specVal}>{election.maxCandidates} candidates</span>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle} style={{ marginBottom: '1rem' }}>
              Timeline & Schedule
            </h3>

            <div className={styles.specRow}>
              <span className={styles.specLabel}>Registration Closes</span>
              <span className={styles.specVal}>
                {election.registrationDeadline
                  ? new Date(election.registrationDeadline).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>

            <div className={styles.specRow}>
              <span className={styles.specLabel}>Voting Opens</span>
              <span className={styles.specVal}>
                {new Date(election.startDate).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className={styles.specRow}>
              <span className={styles.specLabel}>Voting Closes</span>
              <span className={styles.specVal}>
                {new Date(election.endDate).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
