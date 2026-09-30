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
    body: "Every vote is a signed transaction written to the ledger. Once cast, it cannot be altered, forged, or deleted.",
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
    body: "Results update with every new block. No waiting period — the tally is continuously synchronized and verifiable.",
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
    title: "Organizational Hierarchy",
    body: "Dynamic database-driven directorates, divisions, and positions govern scoped voter and candidate eligibility.",
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
    body: "Full on-chain history. Any auditor can mathematically verify the complete cryptoledger trail at any time.",
  },
];

const STEPS = [
  {
    num: "01",
    label: "Authenticate Employee Identity",
    desc: "Sign in with your verified institutional account. The system evaluates your organizational scope and eligibility.",
  },
  {
    num: "02",
    label: "Sign with Bound Web3 Wallet",
    desc: "Connect your MetaMask or institutional wallet verified through cryptographic SIWE challenge-response.",
  },
  {
    num: "03",
    label: "Cast Immutable On-Chain Vote",
    desc: "Submit an EVM-signed transaction to the Hyperledger Besu smart contract. Your ballot is sealed forever.",
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
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          INSA E-Voting
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
        {/* ── Hero Section (with layered visual stage) ── */}
        <section
          className={`${styles.hero} ${mounted ? styles.heroVisible : ""}`}
          aria-labelledby="hero-heading"
        >
          <div className={styles.heroContentGrid}>
            {/* Left Column: Text & Actions */}
            <div className={styles.heroTextCol}>
              <h1 id="hero-heading" className={styles.heroTitle}>
                Votes that cannot
                <br />
                <em>be questioned.</em>
              </h1>

              <p className={styles.heroSub}>
                A cryptographically secured, institutional voting platform for
                the Information Network Security Administration (INSA),
                engineered for absolute integrity, tamper-proof verification,
                and democratic transparency.
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
                <Link
                  href="/admin"
                  id="cta-admin"
                  className={styles.ctaSecondary}
                >
                  Admin Panel
                </Link>
              </div>

              <div
                className={styles.heroStats}
                role="list"
                aria-label="Platform statistics"
              >
                {[
                  { val: "Besu", label: "Private Ledger" },
                  { val: "1-Vote", label: "Cryptographic Rule" },
                  { val: "100%", label: "On-Chain Audit" },
                  { val: "Instant", label: "Live Tally" },
                ].map(({ val, label }) => (
                  <div key={label} className={styles.heroStat} role="listitem">
                    <strong>{val}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Layered Holographic Ballot Stage (voting.png & voting2.jpg) */}
            <div className={styles.heroVisualStage} aria-hidden="true">
              {/* Primary Digital Ballot Card (voting2.jpg) */}
              <div className={styles.stageCardPrimary}>
                <div className={styles.stageCardHeader}>
                  <div className={styles.stageLedgerBadge}>
                    <span className={styles.stageLedgerDot} />
                    Besu Ledger Verified
                  </div>
                </div>

                <div className={styles.stageImageWrap}>
                  <img
                    src="/voting2.jpg"
                    alt="Cryptographic ballot submission on the Besu blockchain"
                    className={styles.stageImage}
                  />
                  <div className={styles.stageImageOverlay} />
                </div>

                <div className={styles.stageCardFooter}>
                  <div className={styles.stageMeta}>
                    <span className={styles.stageMetaTitle}>
                      E-Ballot Block Stream
                    </span>
                    <span className={styles.stageMetaHash}>
                      0x71...88c4 · Block #519,420
                    </span>
                  </div>
                  <div className={styles.stageVerifyIcon}>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Sealed
                  </div>
                </div>
              </div>

              {/* Secondary Floating Democratic Card (voting.png) */}
              <div className={styles.stageCardSecondary}>
                <div className={styles.stageThumbWrap}>
                  <img
                    src="/voting.png"
                    alt="Collective institutional voting consensus"
                    className={styles.stageThumb}
                  />
                </div>
                <div className={styles.stageThumbBanner}>
                  <span className={styles.stageThumbText}>
                    Collective Mandate
                  </span>
                  <span className={styles.stageThumbSub}>INSA Scoped Vote</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features grid ── */}
        <section className={styles.features} aria-labelledby="features-heading">
          <div className={styles.sectionHeader}>
            <h2 id="features-heading">Built for Sovereign Integrity</h2>
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
                Participation takes three secure steps. Your identity stays
                protected through role-based organizational scoping and
                cryptographically signed transactions.
              </p>
              <Link
                href="/dashboard"
                className={styles.ctaPrimary}
                style={{ marginTop: "1.75rem", display: "inline-flex" }}
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

        {/* ── Dual CTA with image backdrops ── */}
        <section className={styles.dualCta} aria-labelledby="dual-cta-heading">
          <h2 id="dual-cta-heading" className="sr-only">
            Choose your role
          </h2>
          <div className={styles.dualGrid}>
            {/* Voter Portal Card (with voting2.jpg ambient backdrop) */}
            <div className={styles.dualCard} id="voter-portal">
              <div
                className={styles.dualCardBackdrop}
                style={{ backgroundImage: "url('/voting2.jpg')" }}
                aria-hidden="true"
              />
              <div className={styles.dualCardContent}>
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
                  Browse open elections, review approved candidates, and cast
                  your signed on-chain ballot. Your vote is permanent,
                  tamper-evident, and publicly verifiable.
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
            </div>

            {/* Admin Console Card (with voting.png ambient backdrop) */}
            <div
              className={`${styles.dualCard} ${styles.dualCardAccent}`}
              id="admin-portal"
            >
              <div
                className={styles.dualCardBackdrop}
                style={{ backgroundImage: "url('/voting.png')" }}
                aria-hidden="true"
              />
              <div className={styles.dualCardContent}>
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
                <h3>Admin Console</h3>
                <p>
                  Provision elections, configure organizational eligibility,
                  approve candidates, and monitor blockchain consensus in real
                  time with complete cryptographic auditing.
                </p>
                <Link
                  href="/admin"
                  id="link-admin-panel"
                  className={`${styles.dualLink} ${styles.dualLinkAccent}`}
                >
                  Open Admin Console
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
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span>
          <strong>Information Network Security Administration (INSA)</strong> ·
          Sovereign E-Voting Platform
        </span>
        <span>Hyperledger Besu Enterprise · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
