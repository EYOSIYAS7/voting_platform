'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useIsAdmin } from '@/lib/hooks/useContract';
import { useTheme } from '@/lib/context/ThemeContext';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { LoginModal } from './LoginModal';
import { WalletBindingModal } from './WalletBindingModal';
import {
  ShieldCheck,
  Link2,
  LogIn,
  LogOut,
  User,
  ShieldAlert,
} from 'lucide-react';
import styles from './Navbar.module.css';

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { data: isContractAdmin } = useIsAdmin(address);
  const { theme, toggleTheme } = useTheme();

  // Auth store
  const { isAuthenticated, employee, user, walletBinding, isAdmin, logout } =
    useAuthStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // User is admin if either backend role is admin OR smart contract admin
  const hasAdminAccess = isAdmin() || !!isContractAdmin;

  const links = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/elections', label: 'Elections', exact: false },
    ...(hasAdminAccess
      ? [{ href: '/admin', label: 'Admin Command', exact: false, isAdmin: true }]
      : []),
  ];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const closeMenu = () => setMenuOpen(false);

  // Compute initials
  const initials = employee
    ? `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase()
    : 'IN';

  const userRoleLabel = user?.roles?.[0]
    ? user.roles[0].replace('_', ' ')
    : 'EMPLOYEE';

  const truncate = (str: string) => `${str.slice(0, 6)}...${str.slice(-4)}`;

  return (
    <>
      <div className={styles.chrome}>
        <aside
          id="app-sidebar"
          className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}
          aria-label="Primary"
        >
          <Link
            href="/"
            className={styles.logo}
            onClick={closeMenu}
            title="Back to landing page"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B64AF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>INSA Sovereign Vote</span>
          </Link>

          {/* User profile widget if authenticated */}
          {isAuthenticated && employee ? (
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>{initials}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {employee.firstName} {employee.lastName}
                </span>
                <span
                  className={`${styles.userRole} ${
                    hasAdminAccess ? styles.userRoleAdmin : ''
                  }`}
                >
                  {userRoleLabel}
                </span>
              </div>
            </div>
          ) : null}

          <nav className={styles.links}>
            {links.map(({ href, label, exact, isAdmin: linkIsAdmin }) => (
              <Link
                key={href}
                href={href}
                className={`${styles.link} ${
                  isActive(href, exact) ? styles.linkActive : ''
                }`}
                onClick={closeMenu}
              >
                <span>{label}</span>
                {linkIsAdmin && <span className={styles.adminTag}>Admin</span>}
              </Link>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <button
              id="theme-toggle"
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label={
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
              }
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>

            {isAuthenticated ? (
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={logout}
                title="Sign out of INSA account"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            ) : null}
          </div>
        </aside>

        {menuOpen && (
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close menu"
            onClick={closeMenu}
          />
        )}

        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.menuBtn}
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="app-sidebar"
            >
              Menu
            </button>

            <div className={styles.context}>
              <span className={styles.networkDot} />
              <span>Hyperledger Besu (Chain ID 1337)</span>
            </div>
          </div>

          <div className={styles.topbarActions}>
            {/* Wallet binding pill if authenticated */}
            {isAuthenticated ? (
              walletBinding ? (
                <button
                  type="button"
                  className={`${styles.bindingPill} ${styles.bindingPillBound}`}
                  onClick={() => setWalletModalOpen(true)}
                  title={`Bound to ${walletBinding.address}. Click to view details.`}
                >
                  <ShieldCheck size={14} />
                  <span>Bound: {truncate(walletBinding.address)}</span>
                </button>
              ) : isConnected && address ? (
                <button
                  type="button"
                  className={`${styles.bindingPill} ${styles.bindingPillUnbound}`}
                  onClick={() => setWalletModalOpen(true)}
                  title="Your connected wallet is not bound to your employee account. Click to link via SIWE."
                >
                  <Link2 size={14} />
                  <span>Bind Wallet</span>
                </button>
              ) : null
            ) : null}

            {/* Sign in button if unauthenticated */}
            {!isAuthenticated ? (
              <button
                type="button"
                className={styles.signInBtn}
                onClick={() => setLoginModalOpen(true)}
              >
                <LogIn size={15} />
                <span>INSA Sign-In</span>
              </button>
            ) : null}

            {/* RainbowKit Wallet connect */}
            <div className={styles.wallet}>
              <ConnectButton
                showBalance={false}
                chainStatus="icon"
                accountStatus="avatar"
              />
            </div>
          </div>
        </header>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      <WalletBindingModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </>
  );
}
