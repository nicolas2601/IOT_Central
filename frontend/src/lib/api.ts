import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { openErrorModal } from '@/store/errorStore';

const API_URL = (process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor request: agregar token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor response: refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Evitar confundir cancelaciones (navegación, cambio de ruta) con errores de red reales
    const code = error.code as string | undefined;
    const msg = (error.message || '').toLowerCase();
    const isCanceled = code === 'ERR_CANCELED' || code === 'ERR_ABORTED' || msg.includes('cancel') || msg.includes('abort');
    // Modal solo para fallos de red reales: ERR_NETWORK
    const isNetworkError = code === 'ERR_NETWORK' && !isCanceled;

    // Errores de red (backend caído, conexión rechazada, DNS, CORS)
    if (isNetworkError) {
      const fallbackEnabled = ((process.env.NEXT_PUBLIC_API_FALLBACK ?? '1') === '1');
      if (!fallbackEnabled) {
        const message = `No se pudo conectar con el servidor API (${API_URL}). Verifica que esté en ejecución o configura NEXT_PUBLIC_API_URL.`;
        try {
          openErrorModal('Conexión rechazada', message);
        } catch (_) {}
      }
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (typeof window !== 'undefined') {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) throw new Error('No refresh token');
          
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          // Mantener sincronizado el token en el store para que WebSocket use el actualizado
          try {
            useAuthStore.setState({ accessToken: access, isAuthenticated: true });
          } catch (_) {}
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    // Solo mostrar el modal para errores NO de red y distintos de 401
    // (los de red no tienen response, 401 ya se maneja con refresh/redirect)
    if (typeof window !== 'undefined' && error.response && error.response.status !== 401) {
      const status = error.response.status;
      const data: any = error.response.data || {};
      const titleMap: Record<number, string> = {
        400: 'Solicitud incorrecta',
        403: 'Acceso denegado',
        404: 'Recurso no encontrado',
        500: 'Error del servidor',
      };
      const title = titleMap[status] || 'Error';
      const message = data?.message || data?.detail || error.message || 'Ocurrió un error';
      const details = typeof data === 'string' ? data : undefined;
      try {
        openErrorModal(title, message, details);
      } catch (_) {
        // evitar romper el flujo si el modal falla por cualquier razón
      }
    }
    return Promise.reject(error);
  }
);

export default api;