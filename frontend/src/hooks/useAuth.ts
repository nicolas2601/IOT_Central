import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Custom Hook para Autenticación
 * 
 * Proporciona acceso al estado de autenticación y funciones relacionadas.
 * Carga automáticamente el usuario al montar el componente.
 */
export const useAuth = () => {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadUser,
    clearError,
  } = useAuthStore();

  // Cargar usuario al montar el hook
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loadUser();
    }
  }, [isAuthenticated, isLoading, loadUser]);

  /**
   * Función de login con redirección
   */
  const handleLogin = async (username: string, password: string) => {
    try {
      await login({ username, password });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  /**
   * Función de registro con redirección
   */
  const handleRegister = async (data: any) => {
    try {
      await register(data);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  };

  /**
   * Función de logout con redirección
   */
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError,
  };
};
