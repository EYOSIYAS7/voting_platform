'use client';

import { getDefaultConfig, RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { BESU_CHAIN } from '@/lib/config';
import { useTheme } from '@/lib/context/ThemeContext';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName:   'Voting Platform',
  projectId: 'votechain-besu',
  chains:    [BESU_CHAIN as any],
  ssr:       true,
});

const darkRainbowTheme = darkTheme({
  accentColor:           '#4D81EC',
  accentColorForeground: '#00081C',
  borderRadius:          'small',
  fontStack:             'system',
  overlayBlur:           'none',
});

const lightRainbowTheme = lightTheme({
  accentColor:           '#2D57A8',
  accentColorForeground: '#FFFFFF',
  borderRadius:          'small',
  fontStack:             'system',
  overlayBlur:           'none',
});

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';

function AuthInitializer() {
  const initAuth = useAuthStore((s) => s.initAuth);
  useEffect(() => {
    initAuth();
  }, [initAuth]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme === 'light' ? lightRainbowTheme : darkRainbowTheme}>
          <AuthInitializer />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

