import api from '@/lib/api';
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/types';

export const authService = {
  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },
  
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post('/auth/login/', credentials);
    const data = response.data as any;
    const tokens: AuthTokens = data.tokens ?? { access: data.access, refresh: data.refresh };
    return { user: data.user, tokens };
  },
  
  async logout(refresh?: string): Promise<void> {
    try {
      // El backend espera { refresh: <token> } para invalidar
      await api.post('/auth/logout/', refresh ? { refresh } : {});
    } catch (e) {
      // Silenciar errores de logout: el cliente limpiará sesión igualmente
      throw e;
    }
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