import { Navbar } from '@/components/Navbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="workspace">
        <a href="#main" className="skip-link">Skip to content</a>
        <main id="main" style={{ flex: 1 }}>
          {children}
        </main>
        <footer className="site-footer">
          <strong>Voting Platform</strong>
          <span>Hyperledger Besu · {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
