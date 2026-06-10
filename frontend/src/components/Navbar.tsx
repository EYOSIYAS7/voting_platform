"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useIsAdmin } from "@/lib/hooks/useContract";
import { useTheme } from "@/lib/context/ThemeContext";
import { Vote, LayoutDashboard, List, Sun, Moon } from "lucide-react";
import styles from "./Navbar.module.css";

export function Navbar() {
  const pathname = usePathname();
  const { address } = useAccount();
  const { data: isAdmin } = useIsAdmin(address);
  const { theme, toggleTheme } = useTheme();

  const links = [
    { href: "/elections", label: "Elections", icon: List },
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin", icon: LayoutDashboard }]
      : []),
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>
            Voting<span className={styles.logoAccent}>Platform</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className={styles.links}>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.link} ${pathname.startsWith(href) ? styles.linkActive : ""}`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {/* Right side: theme toggle + wallet */}
        <div className={styles.rightGroup}>
          {/* Theme toggle */}
          <button
            id="theme-toggle"
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            <span
              className={`${styles.themeTrack} ${theme === "light" ? styles.themeTrackLight : ""}`}
            >
              <span
                className={`${styles.themeThumb} ${theme === "light" ? styles.themeThumbLight : ""}`}
              >
                {theme === "dark" ? (
                  <Moon size={12} strokeWidth={2.5} />
                ) : (
                  <Sun size={12} strokeWidth={2.5} />
                )}
              </span>
            </span>
          </button>

          {/* Wallet connect */}
          <div className={styles.wallet}>
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="avatar"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
