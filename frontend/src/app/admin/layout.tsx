import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Console | INSA Sovereign Vote',
  description: 'System Administration Console for INSA E-Voting Platform',
};

export default function AdminLandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

