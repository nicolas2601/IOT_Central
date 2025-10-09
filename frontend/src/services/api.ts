import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  LoginCredentials,
  RegisterData,
  LoginResponse,
  Device,
  DeviceCreateData,
  Telemetry,
  TelemetryStats,
  Command,
  CommandCreateData,
  Alert,
  AlertCreateData,
  DashboardStats,
  PaginatedResponse,
} from '@/types';

/**
 * Cliente API para la Plataforma IoT
 * 
 * Maneja todas las peticiones HTTP al backend Django
 * Incluye interceptores para autenticación JWT
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Crear instancia de Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para agregar token JWT a las peticiones
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si el error es 401 y no hemos intentado refrescar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Reintentar la petición original
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Si falla el refresh, limpiar tokens y redirigir al login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTENTICACIÓN
// ============================================

export const authApi = {
  /**
   * Registrar nuevo usuario
   */
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/register/', data);
    return response.data;
  },

  /**
   * Iniciar sesión
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    return response.data;
  },

  /**
   * Cerrar sesión
   */
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout/', { refresh: refreshToken });
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/profile/');
    return response.data;
  },

  /**
   * Actualizar perfil
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile/update/', data);
    return response.data;
  },
};

// ============================================
// DISPOSITIVOS
// ============================================

export const devicesApi = {
  /**
   * Listar dispositivos
   */
  list: async (params?: {
    device_type?: string;
    status?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<Device>> => {
    const response = await apiClient.get<PaginatedResponse<Device>>('/devices/', { params });
    return response.data;
  },

  /**
   * Obtener dispositivo por ID
   */
  get: async (id: string): Promise<Device> => {
    const response = await apiClient.get<Device>(`/devices/${id}/`);
    return response.data;
  },

  /**
   * Crear dispositivo
   */
  create: async (data: DeviceCreateData): Promise<Device> => {
    const response = await apiClient.post<Device>('/devices/', data);
    return response.data;
  },

  /**
   * Actualizar dispositivo
   */
  update: async (id: string, data: Partial<DeviceCreateData>): Promise<Device> => {
    const response = await apiClient.put<Device>(`/devices/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar dispositivo
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/devices/${id}/`);
  },

  /**
   * Obtener telemetría de un dispositivo
   */
  getTelemetry: async (id: string, params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<Telemetry[]> => {
    const response = await apiClient.get<Telemetry[]>(`/devices/${id}/telemetry/`, { params });
    return response.data;
  },

  /**
   * Enviar comando a un dispositivo
   */
  sendCommand: async (id: string, data: Omit<CommandCreateData, 'device'>): Promise<Command> => {
    const response = await apiClient.post<Command>(`/devices/${id}/send-command/`, data);
    return response.data;
  },

  /**
   * Obtener comandos de un dispositivo
   */
  getCommands: async (id: string): Promise<Command[]> => {
    const response = await apiClient.get<Command[]>(`/devices/${id}/commands/`);
    return response.data;
  },
};

// ============================================
// TELEMETRÍA
// ============================================

export const telemetryApi = {
  /**
   * Listar telemetría
   */
  list: async (params?: {
    device?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<PaginatedResponse<Telemetry>> => {
    const response = await apiClient.get<PaginatedResponse<Telemetry>>('/telemetry/', { params });
    return response.data;
  },

  /**
   * Obtener última telemetría de un dispositivo
   */
  getLatest: async (deviceId: string): Promise<Telemetry> => {
    const response = await apiClient.get<Telemetry>(`/telemetry/latest/${deviceId}/`);
    return response.data;
  },

  /**
   * Obtener estadísticas de telemetría
   */
  getStatistics: async (deviceId: string, params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<TelemetryStats> => {
    const response = await apiClient.get<TelemetryStats>(`/telemetry/statistics/${deviceId}/`, { params });
    return response.data;
  },
};

// ============================================
// COMANDOS
// ============================================

export const commandsApi = {
  /**
   * Listar comandos
   */
  list: async (params?: {
    device?: string;
    status?: string;
  }): Promise<PaginatedResponse<Command>> => {
    const response = await apiClient.get<PaginatedResponse<Command>>('/commands/', { params });
    return response.data;
  },

  /**
   * Obtener comando por ID
   */
  get: async (id: string): Promise<Command> => {
    const response = await apiClient.get<Command>(`/commands/${id}/`);
    return response.data;
  },

  /**
   * Crear comando
   */
  create: async (data: CommandCreateData): Promise<Command> => {
    const response = await apiClient.post<Command>('/commands/', data);
    return response.data;
  },
};

// ============================================
// ALERTAS
// ============================================

export const alertsApi = {
  /**
   * Listar alertas
   */
  list: async (params?: {
    device?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Alert>> => {
    const response = await apiClient.get<PaginatedResponse<Alert>>('/alerts/', { params });
    return response.data;
  },

  /**
   * Obtener alerta por ID
   */
  get: async (id: string): Promise<Alert> => {
    const response = await apiClient.get<Alert>(`/alerts/${id}/`);
    return response.data;
  },

  /**
   * Crear alerta
   */
  create: async (data: AlertCreateData): Promise<Alert> => {
    const response = await apiClient.post<Alert>('/alerts/', data);
    return response.data;
  },

  /**
   * Actualizar alerta
   */
  update: async (id: string, data: Partial<AlertCreateData>): Promise<Alert> => {
    const response = await apiClient.put<Alert>(`/alerts/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar alerta
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/alerts/${id}/`);
  },
};

// ============================================
// DASHBOARD
// ============================================

export const dashboardApi = {
  /**
   * Obtener estadísticas del dashboard
   */
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats/');
    return response.data;
  },
};

export default apiClient;
