'use client';

import Link from 'next/link';
import { useAllElectionIds } from '@/lib/hooks/useContract';
import { ElectionCardLoader } from '@/components/ElectionCardLoader';
import styles from './page.module.css';

export default function Home() {
  const { data: electionIdsRaw, isLoading, isError } = useAllElectionIds();
  const electionIds = electionIdsRaw as readonly bigint[] | undefined;

  const total = electionIds?.length ?? 0;
  const featuredIds = electionIds ? [...electionIds].reverse().slice(0, 6) : [];

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p>Open ballots, upcoming votes, and recorded results.</p>
        </div>
        <div className={styles.headActions}>
          <Link href="/elections" className="btn btn-primary">
            All elections
          </Link>
          <Link href="/admin" className="btn btn-outline">
            Admin
          </Link>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span>Elections on chain</span>
          <strong>{isLoading ? '—' : total}</strong>
        </div>
        <div className="stat">
          <span>Shown here</span>
          <strong>{isLoading ? '—' : featuredIds.length}</strong>
        </div>
        <div className="stat">
          <span>Network</span>
          <strong>Besu</strong>
        </div>
        <div className="stat">
          <span>Ballot rule</span>
          <strong>One vote</strong>
        </div>
      </div>

      <div className={styles.dash}>
        <section className={`panel ${styles.mainPanel}`}>
          <div className={styles.panelHead}>
            <h2>Current elections</h2>
            {featuredIds.length > 0 && (
              <Link href="/elections" className="btn btn-ghost btn-sm">
                View all
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className={styles.loaderContainer}>
              <div className="spinner" />
            </div>
          ) : isError || featuredIds.length === 0 ? (
            <div className="empty-state">
              <h3>No elections yet</h3>
              <p>Connect a wallet and return later, or create one as an administrator.</p>
              <Link href="/admin" className="btn btn-outline btn-sm">
                Go to admin
              </Link>
            </div>
          ) : (
            <div className={styles.electionsGrid}>
              {featuredIds.map((id) => (
                <ElectionCardLoader key={id.toString()} electionId={id} />
              ))}
            </div>
          )}
        </section>

        <aside className={`panel panel-pad ${styles.sidePanel}`}>
          <h2 className={styles.sideTitle}>How a vote is recorded</h2>
          <ol className={styles.steps}>
            <li>
              <strong>Signed transaction</strong>
              <p>A vote is written to the ledger. It cannot be edited after it is cast.</p>
            </li>
            <li>
              <strong>Reviewed ballot</strong>
              <p>Candidates register in a set window. Administrators approve who appears.</p>
            </li>
            <li>
              <strong>Tally from the chain</strong>
              <p>Counts update with new blocks. After you vote, you can read the tally.</p>
            </li>
          </ol>
        </aside>
      </div>
    </div>
  );
}
