'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { SystemRole } from '@/lib/types/api';
import { AdminNavbar } from '@/components/AdminNavbar';
import styles from './admin-app.module.css';

export default function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, hasRole } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated || !hasRole(SystemRole.SYSTEM_ADMIN)) {
      router.replace('/admin');
    } else {
      setAuthorized(true);
    }
  }, [isInitialized, isAuthenticated, hasRole, router]);

  if (!isInitialized || !authorized) {
    return (
      <div className={styles.loadingContainer}>
        <div className="spinner" />
        <span className={styles.loadingText}>Verifying Administrator Security Clearance...</span>
      </div>
    );
  }

  return (
    <div className={styles.adminShell}>
      <AdminNavbar />
      <div className={styles.adminWorkspace}>
        <a href="#main-admin" className="skip-link">
          Skip to admin content
        </a>
        <main id="main-admin" className={styles.adminMain}>
          {children}
        </main>
        <footer className={styles.adminFooter}>
          <strong>INSA Sovereign E-Voting Platform · Security Command</strong>
          <span>Hyperledger Besu Enterprise Private Ledger · Level 1 Admin Mode</span>
        </footer>
      </div>
    </div>
  );
}

