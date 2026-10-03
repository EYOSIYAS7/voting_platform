import { api } from './client';
import {
  LoginRequest,
  TokenResponse,
  UserProfileResponse,
  ChangePasswordRequest,
  WalletChallengeResponse,
  WalletVerifyRequest,
  WalletBinding,
} from '../types/api';

export const authApi = {
  /** Login with email and password */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const res = await api.post<TokenResponse>('/auth/login', credentials, { skipAuth: true });
    if (res?.accessToken) {
      api.setToken(res.accessToken);
    }
    return res;
  },

  /** Log out and clean stored credentials */
  logout() {
    api.setToken(null);
  },

  /** Fetch authenticated employee profile, assigned roles, and active wallet binding */
  getMe(): Promise<UserProfileResponse> {
    return api.get<UserProfileResponse>('/auth/me');
  },

  /** Change own password */
  changePassword(dto: ChangePasswordRequest): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/change-password', dto);
  },

  /** Request a SIWE challenge nonce to sign with connected wallet */
  requestWalletChallenge(walletAddress: string): Promise<WalletChallengeResponse> {
    return api.post<WalletChallengeResponse>('/auth/wallet/challenge', { walletAddress });
  },

  /** Submit signed challenge to verify wallet ownership and bind to employee identity */
  verifyWallet(dto: WalletVerifyRequest): Promise<WalletBinding> {
    return api.post<WalletBinding>('/auth/wallet/verify', dto);
  },

  /** Get active verified wallet binding */
  getActiveWallet(): Promise<WalletBinding | null> {
    return api.get<WalletBinding | null>('/auth/wallet');
  },

  /** Revoke an existing wallet binding */
  revokeWallet(bindingId: string): Promise<void> {
    return api.delete<void>(`/auth/wallet/${bindingId}`);
  },
};
