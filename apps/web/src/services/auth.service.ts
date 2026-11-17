import { api } from '../api/client';
import { User } from '../types';

export interface LoginResponse {
  success: boolean;
  user: User;
  message?: string;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>('/auth/login', { username, password });
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
