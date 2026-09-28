import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/context/ThemeContext';
import { Providers } from './providers';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title:       'Voting Platform',
  description: 'Cast and record votes on Hyperledger Besu.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('voting-platform-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}else{var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',d?'dark':'light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <Providers>
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
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
