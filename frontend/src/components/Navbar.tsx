"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useIsAdmin } from "@/lib/hooks/useContract";
import { useTheme } from "@/lib/context/ThemeContext";
import styles from "./Navbar.module.css";

export function Navbar() {
  const pathname = usePathname();
  const { address } = useAccount();
  const { data: isAdmin } = useIsAdmin(address);
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Overview", exact: true },
    { href: "/elections", label: "Elections", exact: false },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", exact: false }] : []),
  ];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={styles.chrome}>
      <aside
        id="app-sidebar"
        className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}
        aria-label="Primary"
      >
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          Voting Platform
        </Link>

        <nav className={styles.links}>
          {links.map(({ href, label, exact }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.link} ${isActive(href, exact) ? styles.linkActive : ""}`}
              onClick={closeMenu}
            >
              {label}
            </Link>
          ))}
        </nav>

        <button
          id="theme-toggle"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
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
        <button
          type="button"
          className={styles.menuBtn}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
        >
          Menu
        </button>

        <p className={styles.context}>Hyperledger Besu</p>

        <div className={styles.wallet}>
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="avatar"
          />
        </div>
      </header>
    </div>
  );
}
