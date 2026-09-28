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
  accentColor:           '#6B9E96',
  accentColorForeground: '#161513',
  borderRadius:          'small',
  fontStack:             'system',
  overlayBlur:           'none',
});

const lightRainbowTheme = lightTheme({
  accentColor:           '#1F5C57',
  accentColorForeground: '#F7F6F2',
  borderRadius:          'small',
  fontStack:             'system',
  overlayBlur:           'none',
});

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme === 'light' ? lightRainbowTheme : darkRainbowTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
