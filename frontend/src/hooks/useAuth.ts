"use client";

import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { LoginCredentials, RegisterData } from '@/types';

export const useAuth = () => {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, clearAuth, refreshToken } = useAuthStore();
  
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      // Establecer autenticación; la UI controla navegación y mensajes
      setAuth(data.user, data.tokens);
    },
  });
  
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (data) => {
      // Establecer autenticación; la UI controla navegación y mensajes
      setAuth(data.user, data.tokens);
    },
  });
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = typeof refreshToken === 'string' ? refreshToken : null;
      await authService.logout(token ?? undefined);
    },
    onSuccess: () => {
      clearAuth();
      router.push('/login');
    },
    onError: () => {
      // Si falla el logout en servidor, igual limpiar sesión local y redirigir
      clearAuth();
      router.push('/login');
    },
    onSettled: () => {
      // Garantizar limpieza en cualquier caso
      clearAuth();
    }
  });
  
  return {
    user,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
};