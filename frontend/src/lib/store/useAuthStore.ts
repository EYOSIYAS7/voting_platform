import { create } from 'zustand';
import { authApi } from '../api/auth';
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
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<UserProfileResponse | null>;
  initAuth: () => Promise<void>;
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
      error: null,
    });
  },
}));

// Setup listener for 401 unauthorized events
if (typeof window !== 'undefined') {
  window.addEventListener('insa:unauthorized', () => {
    useAuthStore.getState().logout();
  });
}
