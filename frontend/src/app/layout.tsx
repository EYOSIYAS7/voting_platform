import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/context/ThemeContext';
import { Providers } from './providers';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title:       'Voting Platform — Blockchain Governance',
  description: 'A transparent, tamper-proof voting platform powered by Hyperledger Besu.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Runs synchronously before first paint — prevents flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('voting-platform-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}else{var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',d?'dark':'light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <Providers>
            <div className="page-wrapper">
              <Navbar />
              <main style={{ flex: 1, position: 'relative' }}>
                {children}
              </main>
              <footer style={{
                padding: '1.5rem',
                color: 'var(--color-text-3)',
                fontSize: '0.75rem',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}>
                <span style={{ fontFamily: "'DM Mono', monospace", letterSpacing: '0.02em' }}>
                  Voting Platform
                </span>
                <span>
                  Powered by Hyperledger Besu · {new Date().getFullYear()}
                </span>
              </footer>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
