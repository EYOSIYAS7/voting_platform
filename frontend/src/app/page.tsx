'use client';

import Link from 'next/link';
import { useAllElectionIds } from '@/lib/hooks/useContract';
import { ElectionCardLoader } from '@/components/ElectionCardLoader';
import { Shield, Award, Activity, ArrowRight, ArrowUpRight } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const { data: electionIdsRaw, isLoading, isError } = useAllElectionIds();
  const electionIds = electionIdsRaw as readonly bigint[] | undefined;

  const featuredIds = electionIds ? [...electionIds].reverse().slice(0, 3) : [];

  return (
    <div className="container">
      {/* ─── Hero Section ────────────────────────────────────────────────── */}
      <section className={`${styles.hero} animate-fade-in-up`}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgePulse} />
            Live on Hyperledger Besu
          </div>
          <h1 className={styles.title}>
            Governance that's<br />
            <span className="gradient-text">verifiable by design.</span>
          </h1>
          <p className={styles.subtitle}>
            Voting Platform is a tamper-proof, on-chain voting platform. Every vote is cryptographically recorded — no intermediaries, no manipulation.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/elections" className="btn btn-primary btn-lg">
              View Elections
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
            <Link href="/admin" className="btn btn-outline btn-lg">
              Admin Portal
              <ArrowUpRight size={16} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Features Section ────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Built for absolute transparency</h2>
          <p className={styles.sectionSubtitle}>
            Proof-of-authority consensus ensures quick, gasless, and tamper-proof elections.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Shield size={18} strokeWidth={2} />
            </div>
            <h3 className={styles.featureTitle}>Tamper-Proof Ledger</h3>
            <p className={styles.featureDesc}>
              Every vote is cryptographically signed and stored as an immutable block. Double voting is prevented on-chain.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Award size={18} strokeWidth={2} />
            </div>
            <h3 className={styles.featureTitle}>Candidate Verification</h3>
            <p className={styles.featureDesc}>
              Open registration windows followed by admin review ensure only verified candidates appear on the ballot.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Activity size={18} strokeWidth={2} />
            </div>
            <h3 className={styles.featureTitle}>Real-Time Tracking</h3>
            <p className={styles.featureDesc}>
              Watch election progress live. Results synchronize with the blockchain on every new block.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Featured Elections Section ──────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured elections</h2>
          <p className={styles.sectionSubtitle}>
            Participate in active decisions or inspect recent historical results.
          </p>
        </div>

        {isLoading ? (
          <div className={styles.loaderContainer}>
            <div className="spinner" />
          </div>
        ) : isError || featuredIds.length === 0 ? (
          <div className="card empty-state">
            <Shield size={40} strokeWidth={1.5} />
            <h3>No elections found</h3>
            <p>Connect your wallet and check back soon, or set up a new election as an administrator.</p>
            <Link href="/admin" className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem' }}>
              Go to Admin Panel
            </Link>
          </div>
        ) : (
          <div className={styles.electionsGrid}>
            {featuredIds.map((id) => (
              <ElectionCardLoader key={id.toString()} electionId={id} />
            ))}
          </div>
        )}

        {featuredIds.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '2rem' }}>
            <Link href="/elections" className="btn btn-ghost">
              View all elections
              <ArrowRight size={15} strokeWidth={2} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
