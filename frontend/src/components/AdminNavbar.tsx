'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/lib/context/ThemeContext';
import { useAuthStore } from '@/lib/store/useAuthStore';
import {
  LayoutDashboard,
  Building2,
  Users,
  Vote,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
  ShieldAlert,
} from 'lucide-react';
import styles from './AdminNavbar.module.css';

export function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { employee, user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/organization', label: 'Organization & Units', icon: Building2, exact: false },
    { href: '/admin/employees', label: 'Employees & Access', icon: Users, exact: false },
    { href: '/admin/elections', label: 'Elections (Audit)', icon: Vote, exact: false },
  ];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const closeMenu = () => setMenuOpen(false);

  const handleSignOut = () => {
    logout();
    router.push('/admin');
  };

  const initials = employee
    ? `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase()
    : 'SA';

  return (
    <>
      <div className={styles.chrome}>
        {/* Sidebar */}
        <aside
          id="admin-sidebar"
          className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}
          aria-label="Admin Navigation"
        >
          <Link href="/admin/dashboard" className={styles.logo} onClick={closeMenu}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D92828"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>INSA Admin</span>
            <span className={styles.logoBadge}>Console</span>
          </Link>

          {/* User Profile Card */}
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {employee ? `${employee.firstName} ${employee.lastName}` : (user?.email || 'Administrator')}
              </span>
              <span className={styles.userRole}>System Administrator</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className={styles.links}>
            {links.map(({ href, label, icon: Icon, exact }) => (
              <Link
                key={href}
                href={href}
                className={`${styles.link} ${isActive(href, exact) ? styles.linkActive : ''}`}
                onClick={closeMenu}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className={styles.sidebarFooter}>
            <Link href="/dashboard" className={styles.switchViewLink} title="Switch to employee voter dashboard">
              <span>Voter Portal View</span>
              <ExternalLink size={13} />
            </Link>

            <button
              type="button"
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === 'dark' ? 'Light Interface' : 'Dark Interface'}</span>
            </button>

            <button
              type="button"
              className={styles.logoutBtn}
              onClick={handleSignOut}
              title="Sign out of System Administration"
            >
              <LogOut size={14} />
              <span>Sign Out Admin</span>
            </button>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {menuOpen && (
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close menu"
            onClick={closeMenu}
          />
        )}

        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.menuBtn}
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="admin-sidebar"
            >
              Menu
            </button>

            <div className={styles.context}>
              <span className={styles.networkDot} />
              <span>Hyperledger Besu (Chain 1337) · Command Node</span>
            </div>
          </div>

          <div className={styles.topbarActions}>
            <span className={styles.adminTag}>Security Clearance: Level 1</span>
          </div>
        </header>
      </div>
    </>
  );
}

