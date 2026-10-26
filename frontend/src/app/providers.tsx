'use client';

import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';

const queryClient = new QueryClient();

function AuthInitializer() {
  const initAuth = useAuthStore((s) => s.initAuth);
  useEffect(() => {
    initAuth();
  }, [initAuth]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      {children}
    </QueryClientProvider>
  );
}
