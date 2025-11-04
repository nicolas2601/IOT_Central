"use client";

import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { LoginCredentials, RegisterData } from '@/types';
import { toast } from 'sonner';

export const useAuth = () => {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      toast.success('¡Bienvenido!');
      router.push('/dashboard');
    },
    onError: () => {
      toast.error('Credenciales incorrectas');
    },
  });
  
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      toast.success('¡Cuenta creada!');
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const backend = error?.response?.data;
      let description = 'Intenta nuevamente';
      if (backend && typeof backend === 'object') {
        const parts: string[] = [];
        for (const [key, val] of Object.entries(backend)) {
          const msgs = Array.isArray(val) ? val.join(', ') : String(val);
          parts.push(`${key}: ${msgs}`);
        }
        if (parts.length > 0) description = parts.join(' | ');
      }
      toast.error('Error al crear cuenta', { description });
    },
  });
  
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth();
      router.push('/login');
      toast.success('Sesión cerrada');
    },
  });
  
  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
};