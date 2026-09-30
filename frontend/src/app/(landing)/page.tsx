"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./landing.module.css";

const FEATURES = [
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Immutable Ballots",
    body: "Every vote is a signed transaction written to the ledger. Once cast, it cannot be altered or deleted.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Real-time Tallying",
    body: "Results update with every new block. No waiting period — the tally is always live and verifiable.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Admin Controls",
    body: "Administrators approve candidates, manage election windows, and maintain organizational integrity.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "Transparent Audit",
    body: "Full on-chain history. Any participant can audit the complete record of all submitted votes at any time.",
  },
];

const STEPS = [
  {
    num: "01",
    label: "Connect your wallet",
    desc: "Use MetaMask or any Web3 wallet to authenticate your identity on the Besu network.",
  },
  {
    num: "02",
    label: "Browse open elections",
    desc: "View upcoming and active elections for your organization — all pulled directly from the chain.",
  },
  {
    num: "03",
    label: "Cast your ballot",
    desc: "Submit a signed transaction. Your vote is recorded permanently and counted immediately.",
  },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={styles.root}>
      {/* ── Ambient background ── */}
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.grid} />
      </div>

      {/* ── Top bar ── */}
      <header className={styles.topbar}>
        <span className={styles.wordmark}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Voting Platform
        </span>
        <nav className={styles.topNav} aria-label="Quick access">
          <Link href="/dashboard" className={styles.topLink}>
            Dashboard
          </Link>
          <Link href="/admin" className={styles.topLink}>
            Admin
          </Link>
          <Link href="/elections" className={styles.topLink}>
            Elections
          </Link>
        </nav>
      </header>

      <main id="main">
        {/* ── Hero ── */}
        <section
          className={`${styles.hero} ${mounted ? styles.heroVisible : ""}`}
          aria-labelledby="hero-heading"
        >
          <div className={styles.heroChip}>
            <span className={styles.chipDot} aria-hidden="true" />
            Live on Hyperledger Besu
          </div>

          <h1 id="hero-heading" className={styles.heroTitle}>
            Votes that cannot
            <br />
            <em>be questioned.</em>
          </h1>

          <p className={styles.heroSub}>
            A cryptographically-secured, on-chain voting system for
            organisations that demand absolute transparency in every election
            they run.
          </p>

          <div className={styles.heroCtas}>
            <Link
              href="/dashboard"
              id="cta-dashboard"
              className={styles.ctaPrimary}
            >
              Go to Dashboard
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/admin" id="cta-admin" className={styles.ctaSecondary}>
              Admin Panel
            </Link>
          </div>

          <div
            className={styles.heroStats}
            role="list"
            aria-label="Platform statistics"
          >
            {[
              { val: "Besu", label: "Network" },
              { val: "1 vote", label: "Per wallet rule" },
              { val: "100%", label: "On-chain storage" },
              { val: "Live", label: "Tally updates" },
            ].map(({ val, label }) => (
              <div key={label} className={styles.heroStat} role="listitem">
                <strong>{val}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features grid ── */}
        <section className={styles.features} aria-labelledby="features-heading">
          <div className={styles.sectionHeader}>
            <h2 id="features-heading">Built for integrity</h2>
            <p>
              Every design decision was made with one goal: elections that
              anyone can verify and no one can manipulate.
            </p>
          </div>

          <div className={styles.featureGrid} role="list">
            {FEATURES.map((f, i) => (
              <article
                key={f.title}
                className={styles.featureCard}
                role="listitem"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={styles.featureIcon} aria-hidden="true">
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className={styles.howItWorks} aria-labelledby="how-heading">
          <div className={styles.howInner}>
            <div className={styles.howText}>
              <h2 id="how-heading">
                From wallet to
                <br />
                verified ballot
              </h2>
              <p>
                Participation takes three steps. Your identity stays with your
                wallet no accounts, no passwords, no data stored outside the
                chain.
              </p>
              <Link
                href="/dashboard"
                className={styles.ctaPrimary}
                style={{ marginTop: "1.5rem", display: "inline-flex" }}
              >
                Start voting
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <ol className={styles.stepsList} aria-label="How voting works">
              {STEPS.map((s) => (
                <li key={s.num} className={styles.stepItem}>
                  <span className={styles.stepNum} aria-hidden="true">
                    {s.num}
                  </span>
                  <div>
                    <strong>{s.label}</strong>
                    <p>{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Dual CTA ── */}
        <section className={styles.dualCta} aria-labelledby="dual-cta-heading">
          <h2 id="dual-cta-heading" className="sr-only">
            Choose your role
          </h2>
          <div className={styles.dualGrid}>
            <div className={styles.dualCard} id="voter-portal">
              <div className={styles.dualCardIcon} aria-hidden="true">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Voter Dashboard</h3>
              <p>
                Browse open elections, review candidates, and cast your vote.
                Your ballot is permanent and publicly verifiable.
              </p>
              <Link
                href="/dashboard"
                id="link-voter-dashboard"
                className={styles.dualLink}
              >
                Enter Dashboard
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div
              className={`${styles.dualCard} ${styles.dualCardAccent}`}
              id="admin-portal"
            >
              <div className={styles.dualCardIcon} aria-hidden="true">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                </svg>
              </div>
              <h3>Admin Panel</h3>
              <p>
                Create elections, approve candidates, manage organizational
                units, and monitor all on-chain activity in real time.
              </p>
              <Link
                href="/admin"
                id="link-admin-panel"
                className={`${styles.dualLink} ${styles.dualLinkAccent}`}
              >
                Open Admin Panel
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span>
          <strong>Voting Platform</strong>
        </span>
        <span>Hyperledger Besu · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
