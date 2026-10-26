import { api } from './client';
import {
  LoginRequest,
  TokenResponse,
  UserProfileResponse,
  ChangePasswordRequest,
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

  /** Fetch authenticated employee profile and assigned roles */
  getMe(): Promise<UserProfileResponse> {
    return api.get<UserProfileResponse>('/auth/me');
  },

  /** Change own password */
  changePassword(dto: ChangePasswordRequest): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/change-password', dto);
  },
};
