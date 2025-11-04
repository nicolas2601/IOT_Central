import api from '@/lib/api';
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/types';

export const authService = {
  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },
  
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },
  
  async logout(): Promise<void> {
    await api.post('/auth/logout/');
  },
  
  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
  
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put('/auth/profile/', data);
    return response.data;
  },
};