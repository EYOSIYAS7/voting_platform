'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { SystemRole } from '@/lib/types/api';
import { LoginModal } from '@/components/LoginModal';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Building2,
  Users,
  Vote,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  Server,
} from 'lucide-react';
import styles from './admin-landing.module.css';

export default function AdminLandingPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, hasRole, user, logout } = useAuthStore();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // If already logged in as SYSTEM_ADMIN, redirect to /admin/dashboard
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      if (hasRole(SystemRole.SYSTEM_ADMIN)) {
        router.replace('/admin/dashboard');
      }
    }
  }, [isInitialized, isAuthenticated, hasRole, router]);

  const handleLoginSuccess = () => {
    // Check if the freshly authenticated user has SYSTEM_ADMIN role
    const currentRoles = useAuthStore.getState().roles;
    const isSysAdmin = currentRoles.some((r) => r.role === SystemRole.SYSTEM_ADMIN);

    if (isSysAdmin) {
      router.push('/admin/dashboard');
    } else {
      // User is authenticated but NOT a System Admin
      logout();
      setAuthError(
        'Access Denied: Your account does not have System Administrator privileges. Employee accounts must use the Voter Portal.'
      );
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.ambientGrid} />
      <div className={styles.ambientGlow} />

      {/* Top Bar */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4D81EC"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>INSA Sovereign Vote</span>
          <span className={styles.brandBadge}>System Admin</span>
        </div>

        <Link href="/" className={styles.backLink}>
          <span>Voter Portal</span>
          <ExternalLink size={14} />
        </Link>
      </header>

      {/* Main Content Area */}
      <main className={styles.main}>
        <div className={styles.badgeRow}>
          <div className={styles.securityBadge}>
            <ShieldAlert size={14} />
            <span>Restricted Access Console</span>
          </div>
          <div className={styles.nodeBadge}>
            <span className={styles.statusDot} />
            <span>Besu Node Online</span>
          </div>
        </div>

        <h1 className={styles.title}>
          Institutional Identity &<br />
          <span className={styles.titleHighlight}>Electoral Governance</span>
        </h1>

        <p className={styles.subtitle}>
          Administrative command center for the Information Network Security Administration (INSA).
          Configure organizational hierarchies, provision employee registries, and audit blockchain consensus.
        </p>

        {/* Access Denied Warning */}
        {authError && (
          <div className={styles.errorAlert} role="alert">
            <AlertTriangle size={20} style={{ color: '#FF5A5A', flexShrink: 0 }} />
            <div>
              <strong className={styles.errorTitle}>Authentication Restricted</strong>
              <span>{authError}</span>
            </div>
          </div>
        )}

        {/* Login Action */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.loginBtn}
            onClick={() => {
              setAuthError(null);
              setIsLoginOpen(true);
            }}
          >
            <Lock size={16} />
            <span>Sign In to Admin Console</span>
            <ArrowRight size={16} />
          </button>
          <p className={styles.loginHint}>
            Authentication requires an authorized SYSTEM_ADMIN credential.
          </p>
        </div>

        {/* 3 Core Responsibilities Cards */}
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <Building2 size={20} />
            </div>
            <h2 className={styles.cardTitle}>Structure Management</h2>
            <p className={styles.cardDesc}>
              Define organizations, directorates, divisions, and hierarchical levels governing voting scopes.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <Users size={20} />
            </div>
            <h2 className={styles.cardTitle}>Identity & Provisioning</h2>
            <p className={styles.cardDesc}>
              Register personnel, issue temporary credentials, assign role scopes, and maintain employment status.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <Vote size={20} />
            </div>
            <h2 className={styles.cardTitle}>Electoral Transparency</h2>
            <p className={styles.cardDesc}>
              Audit election records across all units with cryptographic immutability on Hyperledger Besu.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <Server size={14} />
          <span>INSA Cyber Security Infrastructure · Enterprise Private Ledger</span>
        </div>
        <span className={styles.footerWarning}>
          Notice: All administrative actions are cryptographically signed and logged.
        </span>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

