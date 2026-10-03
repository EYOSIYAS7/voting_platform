import { create } from 'zustand';
import { authApi } from '../api/auth';
import { api } from '../api/client';
import {
  AuthenticatedUser,
  EmployeeWithDetails,
  LoginRequest,
  SystemRole,
  UserProfileResponse,
  UserRoleScope,
} from '../types/api';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  employee: EmployeeWithDetails | null;
  roles: UserRoleScope[];
  walletBinding: { address: string; verifiedAt: string } | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<UserProfileResponse | null>;
  initAuth: () => Promise<void>;
  bindWallet: (
    walletAddress: string,
    signFn: (args: { message: string }) => Promise<string>
  ) => Promise<void>;
  clearError: () => void;
  isAdmin: () => boolean;
  hasRole: (role: SystemRole) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isAuthenticated: false,
  user: null,
  employee: null,
  roles: [],
  walletBinding: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  isAdmin: () => {
    const { roles } = get();
    return roles.some(
      (r) =>
        r.role === SystemRole.SYSTEM_ADMIN ||
        r.role === SystemRole.ELECTION_ADMIN
    );
  },

  hasRole: (role: SystemRole) => {
    const { roles } = get();
    return roles.some((r) => r.role === role);
  },

  initAuth: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('insa_access_token');
    if (!token) {
      set({ isInitialized: true, isAuthenticated: false, isLoading: false });
      return;
    }

    set({ token, isLoading: true });
    try {
      await get().fetchProfile();
      set({ isInitialized: true, isAuthenticated: true, isLoading: false });
    } catch {
      // Token expired or invalid
      authApi.logout();
      set({
        token: null,
        isAuthenticated: false,
        user: null,
        employee: null,
        roles: [],
        walletBinding: null,
        isInitialized: true,
        isLoading: false,
      });
    }
  },

  fetchProfile: async () => {
    try {
      const data = await authApi.getMe();
      if (data) {
        set({
          employee: data.employee,
          roles: data.roles || [],
          walletBinding: data.walletBinding,
          user: {
            userId: data.account?.id || '',
            employeeId: data.employee?.id || '',
            email: data.employee?.email || '',
            roles: data.roles?.map((r) => r.role) || [],
            scopes: data.roles?.map((r) => ({ roleId: '', orgUnitId: r.orgUnitId })) || [],
            mustChangePassword: data.account?.mustChangePassword || false,
          },
        });
      }
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch user profile' });
      throw err;
    }
  },

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(credentials);
      set({ token: res.accessToken, isAuthenticated: true });
      await get().fetchProfile();
      set({ isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Login failed. Please check your credentials.',
      });
      throw err;
    }
  },

  logout: () => {
    authApi.logout();
    set({
      token: null,
      isAuthenticated: false,
      user: null,
      employee: null,
      roles: [],
      walletBinding: null,
      error: null,
    });
  },

  bindWallet: async (
    walletAddress: string,
    signFn: (args: { message: string }) => Promise<string>
  ) => {
    set({ isLoading: true, error: null });
    try {
      // Step 1: Request SIWE Challenge Nonce
      const challengeRes = await authApi.requestWalletChallenge(walletAddress);

      // Step 2: Sign message using connected web3 wallet
      const signature = await signFn({ message: challengeRes.challenge });

      // Step 3: Verify and complete binding
      const binding = await authApi.verifyWallet({
        walletAddress,
        challenge: challengeRes.challenge,
        signature,
      });

      // Step 4: Update state
      set({
        walletBinding: {
          address: binding.walletAddress,
          verifiedAt: binding.verifiedAt || new Date().toISOString(),
        },
        isLoading: false,
      });
    } catch (err: any) {
      const msg = err.message || 'Failed to bind wallet';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },
}));

// Setup listener for 401 unauthorized events
if (typeof window !== 'undefined') {
  window.addEventListener('insa:unauthorized', () => {
    useAuthStore.getState().logout();
  });
}
