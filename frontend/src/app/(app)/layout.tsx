'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Navbar } from '@/components/Navbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, user } = useAuthStore();

  useEffect(() => {
    if (isInitialized && isAuthenticated && user?.mustChangePassword) {
      if (pathname !== '/change-password') {
        router.replace('/change-password');
      }
    }
  }, [isInitialized, isAuthenticated, user?.mustChangePassword, pathname, router]);

  return (
    <div className="app-shell">
      <Navbar />
      <div className="workspace">
        <a href="#main" className="skip-link">Skip to content</a>
        <main id="main" style={{ flex: 1 }}>
          {children}
        </main>
        <footer className="site-footer">
          <strong>INSA Sovereign E-Voting Platform</strong>
          <span>Hyperledger Besu Enterprise · {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
