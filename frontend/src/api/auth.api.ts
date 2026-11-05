import { http } from './http';
import type { AuthResponse, User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await http.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await http.get<User>('/auth/me');
    return response.data;
  },
};
