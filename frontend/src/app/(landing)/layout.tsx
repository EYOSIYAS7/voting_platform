import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voting Platform — Transparent Elections on Blockchain',
  description:
    'A secure, transparent, on-chain voting platform built on Hyperledger Besu. Cast, track, and verify votes with full cryptographic integrity.',
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
