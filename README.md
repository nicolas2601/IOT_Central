# 👥 WORKFLOW FRONTEND - GABRIELA & MIGUEL
## Plataforma IoT Open Source - División de Trabajo

---
## 📦 SETUP INICIAL (JUNTOS - 30 minutos)

### Paso 1: Clonar y configurar proyecto
```bash
# Ambos
cd frontend
pnpm install
cp .env.example .env.local
```

### Paso 2: Verificar que corre
```bash
pnpm dev
# Debe abrir en http://localhost:3000
```

### Paso 3: Instalar dependencias adicionales
```bash
# ShadCN UI
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card label dropdown-menu dialog select badge table toast tabs

# Adicionales
pnpm add recharts sonner date-fns
```

---

## 🏗️ ARQUITECTURA DEL PROYECTO

```
frontend/src/
├── app/                        # Next.js pages (ambos)
├── components/                 
│   ├── ui/                    # 👩 GABRIELA - ShadCN components
│   ├── auth/                  # 👩 GABRIELA - Login/Register forms
│   ├── dashboard/             # 👩 GABRIELA - Dashboard cards, charts
│   ├── devices/               # 👩 GABRIELA - Device cards, modals
│   ├── telemetry/             # 👩 GABRIELA - Charts, visualizations
│   └── layout/                # 👩 GABRIELA - Sidebar, Header
├── lib/                       # 👨 MIGUEL - Utilities
│   ├── api.ts                 # 👨 MIGUEL - Axios config
│   ├── websocket.ts           # 👨 MIGUEL - WebSocket client
│   └── utils.ts               # Ambos
├── services/                  # 👨 MIGUEL - API calls
│   ├── authService.ts
│   ├── deviceService.ts
│   ├── telemetryService.ts
│   └── commandService.ts
├── store/                     # 👨 MIGUEL - Global state
│   ├── authStore.ts
│   ├── deviceStore.ts
│   └── telemetryStore.ts
├── hooks/                     # 👨 MIGUEL - Custom hooks
│   ├── useAuth.ts
│   ├── useDevices.ts
│   ├── useTelemetry.ts
│   └── useWebSocket.ts
└── types/                     # 👨 MIGUEL - TypeScript types
    └── index.ts
```

---

## 📅 PLAN DE TRABAJO (5 DÍAS)

### 🧭 Resumen – Miguel (Día 2 al Día 4)

- Día 2:
  - Implementó la gestión de dispositivos, creando componentes para listar y administrar dispositivos.
  - Añadió las rutas y navegación necesarias en el Sidebar.
- Día 3:
  - Desarrolló la lógica para WebSocket y telemetría en tiempo real, con validación de datos.
  - Implementó un componente de prueba para recibir telemetría.
- Día 4:
  - Configuró el sistema de comandos IoT: envío, monitoreo y listado de comandos.

> Estado: Integraciones funcionales en servicios, hooks y componentes base para dispositivos, telemetría y comandos.

### 🗓️ DÍA 5: PULIDO Y UI – GABRIELA

**Objetivo:** Consolidar la experiencia de usuario en el Dashboard y vistas principales, añadiendo visuales y micro-interacciones (React Bits), mejorar accesibilidad y responsividad, y finalizar las páginas faltantes.

**Tareas:**
- Integrar panel de gráficas en tiempo real en `/dashboard` con selector de dispositivo y estado de conexión.
- Aplicar animaciones sutiles y fondos dinámicos (Aurora/Galaxy) en dashboard y layouts.
- Añadir micro-interacciones (hover spotlight, fade/slide) y skeletons de carga en listas.
- Completar UI de dispositivos: grid responsivo, modales (crear/editar), diálogo de borrado, y filtros básicos.
- Unificar estilos de componentes (ShadCN) y ajustar Sidebar/Header con estados activos/hover.
- Mejorar accesibilidad: roles ARIA, focus-visible, contraste y navegación por teclado.
- Pruebas de UX: revisar onboarding y flujo login → dashboard → devices.
- Revisión de performance: evitar renders innecesarios y memoizar componentes críticos.

**Entregables:**
- Dashboard final con gráficas en tiempo real y animaciones.
- Vistas y componentes de dispositivos pulidos y coherentes.
- Interacciones fluidas y accesibilidad mejorada.

### 🗓️ DÍA 1: FUNDAMENTOS Y AUTENTICACIÓN

#### MIGUEL 
**Tarea:** Crear toda la capa de servicios y estado

**Archivos a crear:**

1. **src/types/index.ts** - Tipos TypeScript completos
```typescript
export interface User {
  id: number;
  email: string;
  username: string;
  company_name: string;
  role: 'admin' | 'user';
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Device {
  id: string;
  name: string;
  device_type: 'sensor' | 'actuator' | 'gateway';
  description: string;
  is_active: boolean;
  last_connection: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Telemetry {
  id: number;
  device: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface Command {
  id: string;
  device: string;
  command_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'sent' | 'executed' | 'failed';
  sent_at: string;
  executed_at: string | null;
    response: Record<string, any> | null;
}
```

2. **src/lib/api.ts** - Cliente Axios con interceptores
```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (typeof window !== 'undefined') {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) throw new Error('No refresh token');
          
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

3. **src/services/authService.ts**
```typescript
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
```

---

## 🔌 WebSockets y Entorno

Para la gráfica de telemetría en tiempo real, el frontend se conecta vía WebSocket al backend (Django Channels).

- Variable de entorno frontend: configura `NEXT_PUBLIC_WS_URL` con la base del endpoint de WebSockets.
  - Desarrollo local: `NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws`
  - Producción (ejemplo): `NEXT_PUBLIC_WS_URL=wss://localhost:8000/ws`
- Autenticación: el cliente envía el JWT de acceso en la query del WebSocket (`?token=<ACCESS_TOKEN>`).
  - Debes iniciar sesión para obtener `access` y guardarlo en `localStorage`.

Ejemplo de URL:

```
ws://localhost:8000/ws/telemetry/<device_uuid>/?token=<ACCESS_TOKEN>
```

Backend: Channels está habilitado en `backend/config/asgi.py` y usa un middleware que valida el token JWT de la query y adjunta el usuario en `scope['user']`.

4. **src/store/authStore.ts** - Zustand store
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthTokens } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      
      setAuth: (user, tokens) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
        }
        set({
          user,
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
          isAuthenticated: true,
        });
      },
      
      setUser: (user) => set({ user }),
      
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.clear();
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => 
        typeof window !== 'undefined' ? localStorage : ({} as any)
      ),
    }
  )
);
```

5. **src/hooks/useAuth.ts**
```typescript
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
    onError: () => {
      toast.error('Error al crear cuenta');
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
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
};
```

**Entregable:** Toda la lógica de autenticación funcionando

---

#### GABRIELA 
**Tarea:** Crear componentes de autenticación y layout base

**Archivos a crear:**

1. **src/components/auth/LoginForm.tsx**
```typescript
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoggingIn } = useAuth();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>
          Accede a tu cuenta de IoT Platform
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoggingIn}>
            {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
          
          <p className="text-sm text-center text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};
```

2. **src/components/auth/RegisterForm.tsx** (similar al login, con más campos)

3. **src/app/login/page.tsx**
```typescript
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">IoT Platform</h1>
          <p className="text-gray-600">Gestiona tus dispositivos en tiempo real</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
```

4. **src/components/layout/Sidebar.tsx** - Menú lateral
5. **src/components/layout/Header.tsx** - Header con user menu

**Entregable:** UI de login/register completamente funcional

---

#### INTEGRACIÓN
- Miguel conecta el hook useAuth con los componentes de Gabriela
- Probar login completo end-to-end
- Commit conjunto

---

### 🗓️ DÍA 2: GESTIÓN DE DISPOSITIVOS

#### MIGUEL 
**Tarea:** Servicios, hooks y stores para dispositivos

**Archivos:**

1. **src/services/deviceService.ts**
```typescript
import api from '@/lib/api';
import { Device } from '@/types';

export const deviceService = {
  async getDevices(): Promise<Device[]> {
    const response = await api.get('/devices/');
    return response.data.results || response.data;
  },
  
  async getDevice(id: string): Promise<Device> {
    const response = await api.get(`/devices/${id}/`);
    return response.data;
  },
  
  async createDevice(data: Partial<Device>): Promise<Device> {
    const response = await api.post('/devices/', data);
    return response.data;
  },
  
  async updateDevice(id: string, data: Partial<Device>): Promise<Device> {
    const response = await api.put(`/devices/${id}/`, data);
    return response.data;
  },
  
  async deleteDevice(id: string): Promise<void> {
    await api.delete(`/devices/${id}/`);
  },
  
  async getDeviceTelemetry(id: string, params?: any): Promise<any> {
    const response = await api.get(`/devices/${id}/telemetry/`, { params });
    return response.data;
  },
  
  async sendCommand(id: string, command: any): Promise<any> {
    const response = await api.post(`/devices/${id}/send_command/`, command);
    return response.data;
  },
};
```

2. **src/hooks/useDevices.ts**
```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceService } from '@/services/deviceService';
import { Device } from '@/types';
import { toast } from 'sonner';

export const useDevices = () => {
  const queryClient = useQueryClient();
  
  const devicesQuery = useQuery({
    queryKey: ['devices'],
    queryFn: deviceService.getDevices,
  });
  
  const createMutation = useMutation({
    mutationFn: (data: Partial<Device>) => deviceService.createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Dispositivo creado');
    },
    onError: () => {
      toast.error('Error al crear dispositivo');
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Device> }) =>
      deviceService.updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Dispositivo actualizado');
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deviceService.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Dispositivo eliminado');
    },
  });
  
  return {
    devices: devicesQuery.data || [],
    isLoading: devicesQuery.isLoading,
    error: devicesQuery.error,
    createDevice: createMutation.mutate,
    updateDevice: updateMutation.mutate,
    deleteDevice: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useDevice = (id: string) => {
  return useQuery({
    queryKey: ['device', id],
    queryFn: () => deviceService.getDevice(id),
    enabled: !!id,
  });
};
```

3. **src/store/deviceStore.ts** - Store para dispositivo seleccionado

**Entregable:** Toda la lógica de dispositivos lista para usar

---

#### GABRIELA 
**Tarea:** UI completa de gestión de dispositivos

**Archivos:**

1. **src/components/devices/DeviceCard.tsx** - Tarjeta de dispositivo
2. **src/components/devices/DeviceList.tsx** - Lista/grid de dispositivos
3. **src/components/devices/CreateDeviceModal.tsx** - Modal para crear
4. **src/components/devices/EditDeviceModal.tsx** - Modal para editar
5. **src/components/devices/DeleteDeviceDialog.tsx** - Confirmación de borrado
6. **src/app/dashboard/devices/page.tsx** - Página principal

**Ejemplo - DeviceCard.tsx:**
```typescript
"use client";

import { Device } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cpu, Edit, Trash2, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DeviceCardProps {
  device: Device;
  onEdit: (device: Device) => void;
  onDelete: (device: Device) => void;
  onView: (device: Device) => void;
}

export const DeviceCard = ({ device, onEdit, onDelete, onView }: DeviceCardProps) => {
  const getDeviceIcon = () => {
    switch (device.device_type) {
      case 'sensor':
        return <Activity className="h-6 w-6" />;
      case 'actuator':
        return <Cpu className="h-6 w-6" />;
      default:
        return <Cpu className="h-6 w-6" />;
    }
  };
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getDeviceIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">{device.name}</CardTitle>
              <CardDescription>{device.device_type}</CardDescription>
            </div>
          </div>
          
          <Badge variant={device.is_active ? 'default' : 'secondary'}>
            {device.is_active ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {device.description || 'Sin descripción'}
        </p>
        
        {device.last_connection && (
          <p className="text-xs text-muted-foreground mt-2">
            Última conexión:{' '}
            {formatDistanceToNow(new Date(device.last_connection), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onView(device)} className="flex-1">
          Ver Detalles
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(device)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(device)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardFooter>
    </Card>
  );
};
```

**Entregable:** Interfaz completa de dispositivos

---

### 🗓️ DÍA 3: TELEMETRÍA Y GRÁFICAS

#### MIGUEL 
**Tarea:** WebSocket client y servicios de telemetría

1. **src/lib/websocket.ts** - Cliente WebSocket
```typescript
class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, Set<Function>> = new Map();
  
  constructor(baseUrl: string) {
    this.url = baseUrl;
  }
  
  connect(deviceId: string, token: string) {
    const wsUrl = `${this.url}/telemetry/${deviceId}/?token=${token}`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit('telemetry', data);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      // Reconectar después de 3 segundos
      setTimeout(() => this.connect(deviceId, token), 3000);
    };
  }
  
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }
  
  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }
  
  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
  
  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export default WebSocketClient;
```

2. **src/hooks/useWebSocket.ts**
3. **src/services/telemetryService.ts**

**Entregable:** Sistema de WebSocket funcionando

---

#### GABRIELA - Todo el día (6-8 horas)
**Tarea:** Dashboard con gráficas en tiempo real

1. **src/components/dashboard/StatsCard.tsx** - Tarjetas de estadísticas
2. **src/components/dashboard/TelemetryChart.tsx** - Gráfica con Recharts
3. **src/components/telemetry/RealtimeChart.tsx** - Gráfica en tiempo real
4. **src/app/dashboard/page.tsx** - Dashboard completo

**Ejemplo - TelemetryChart.tsx:**
```typescript
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface TelemetryChartProps {
  data: any[];
  title: string;
  dataKey: string;
}

export const TelemetryChart = ({ data, title, dataKey }: TelemetryChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
```

**Entregable:** Dashboard con gráficas en tiempo real

---

### 🗓️ DÍA 4: COMANDOS Y EXTRAS

#### MIGUEL 
**Tarea:** Sistema de comandos

1. **src/services/commandService.ts**
2. **src/hooks/useCommands.ts**

---

#### GABRIELA 
**Tarea:** UI de comandos y polish general

1. **src/components/devices/CommandPanel.tsx**
2. **src/app/dashboard/commands/page.tsx**
3. **Mejorar estilos generales**
4. **Responsive design**

---

### 🗓️ DÍA 5: TESTING Y REFINAMIENTO

#### AMBOS 
- Testing end-to-end
- Corregir bugs
- Optimizar performance
- Documentación
- Preparar presentación

---

## 🔄 FLUJO DE TRABAJO DIARIO

### Protocolo Git

```bash
# Al inicio del día (ambos)
git pull origin main

# Crear rama personal
git checkout -b miguel/auth-services
git checkout -b gabriela/auth-ui

# Commits frecuentes
git add .
git commit -m "feat: add login service"
git push origin miguel/auth-services

# Al final del día: crear Pull Request
# El otro revisa y aprueba
# Merge a main
```

### Comunicación

**Daily Stand-up (10 min cada mañana):**
- ¿Qué hice ayer?
- ¿Qué haré hoy?
- ¿Tengo algún blocker?

**Sync de integración (tarde):**
- Revisar PRs del otro
- Probar integración juntos
- Resolver conflictos

---

## 📋 CHECKLIST DE ENTREGABLES

### Semana 1 - MVP
- [ ] ✅ Login/Registro funcional
- [ ] ✅ Dashboard con estadísticas básicas
- [ ] ✅ CRUD de dispositivos completo
- [ ] ✅ Visualización de telemetría
- [ ] ✅ Gráficas en tiempo real
- [ ] ✅ Envío de comandos
- [ ] ✅ Responsive design

### Extras (si hay tiempo)
- [ ] 🎨 Animaciones con Framer Motion
- [ ] 🔔 Sistema de notificaciones
- [ ] 📊 Dashboard personalizable
- [ ] 🌙 Modo oscuro
- [ ] 📱 PWA (instalable)

---

## 🛠️ HERRAMIENTAS RECOMENDADAS

### Para Miguel
- **Thunder Client** (VS Code) - Probar APIs
- **React DevTools** - Debug hooks y estado
- **Redux DevTools** - Ver Zustand store

### Para Gabriela
- **Figma** - Diseños rápidos
- **ColorHunt** - Paletas de colores
- **Lucide Icons** - Explorar iconos
- **TailwindCSS IntelliSense** - Autocompletado
- react-bits - componentes animados

### Para Ambos
- **GitHub Desktop** - Gestión visual de Git
- **Prettier** - Formateo automático
- **ESLint** - Detectar errores

---

## 💡 TIPS PARA TRABAJAR EN EQUIPO

### Para Miguel
- ✅ Documenta bien los tipos TypeScript
- ✅ Haz funciones reutilizables
- ✅ Incluye ejemplos de uso en comentarios
- ✅ Avisa cuando termines una tarea para que Gabriela la integre

### Para Gabriela
- ✅ Mantén componentes pequeños y reutilizables
- ✅ Usa Storybook para documentar componentes (opcional)
- ✅ Sigue convenciones de naming: PascalCase para componentes
- ✅ Pide a Miguel los tipos cuando necesites saber qué props recibe algo

### Para Ambos
- 💬 Comuniquen cambios importantes antes de hacerlos
- 🔄 Hagan commits pequeños y frecuentes
- 📝 Describan bien los commits: "feat: add device service", "fix: login button"
- 🤝 Revisen el código del otro con respeto
- ☕ Tomen breaks cada 2 horas

---

## 🎯 ESTRATEGIAS DE INTEGRACIÓN

### Patrón de Trabajo Ideal

**Miguel termina un servicio → Gabriela lo consume**

Ejemplo:
```
1. Miguel crea useDevices hook 
2. Miguel hace commit y avisa a Gabriela
3. Gabriela hace pull y usa el hook en DeviceList
4. Si algo no funciona, se comunican y ajustan
```

### Evitar Bloqueos

Si Gabriela necesita algo que Miguel aún no termina:
```typescript
// Gabriela crea un mock temporal
const useDevicesMock = () => ({
  devices: [
    { id: '1', name: 'Sensor 1', device_type: 'sensor', is_active: true },
    { id: '2', name: 'Actuador 1', device_type: 'actuator', is_active: false },
  ],
  isLoading: false,
  createDevice: () => {},
  deleteDevice: () => {},
});

// Cuando Miguel termine, solo cambia el import
// import { useDevices } from '@/hooks/useDevices'; // ✅
```

Si Miguel necesita un componente que Gabriela aún no termina:
```typescript
// Miguel crea un placeholder
const DeviceCardPlaceholder = ({ device }) => (
  <div className="p-4 border rounded">
    <h3>{device.name}</h3>
  </div>
);
```

---

## 📦 ESTRUCTURA DE ARCHIVOS FINAL

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Redirect a /dashboard
│   │   ├── login/
│   │   │   └── page.tsx                  # 👩 Gabriela
│   │   ├── register/
│   │   │   └── page.tsx                  # 👩 Gabriela
│   │   └── dashboard/
│   │       ├── layout.tsx                # 👩 Gabriela
│   │       ├── page.tsx                  # 👩 Gabriela - Dashboard principal
│   │       ├── devices/
│   │       │   ├── page.tsx              # 👩 Gabriela - Lista dispositivos
│   │       │   └── [id]/
│   │       │       └── page.tsx          # 👩 Gabriela - Detalle dispositivo
│   │       ├── telemetry/
│   │       │   └── page.tsx              # 👩 Gabriela - Vista telemetría
│   │       ├── commands/
│   │       │   └── page.tsx              # 👩 Gabriela - Historial comandos
│   │       └── settings/
│   │           └── page.tsx              # 👩 Gabriela - Configuración
│   │
│   ├── components/
│   │   ├── ui/                           # 👩 Gabriela - ShadCN components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── auth/                         # 👩 Gabriela
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── dashboard/                    # 👩 Gabriela
│   │   │   ├── StatsCard.tsx
│   │   │   ├── ActivityChart.tsx
│   │   │   └── RecentDevices.tsx
│   │   ├── devices/                      # 👩 Gabriela
│   │   │   ├── DeviceCard.tsx
│   │   │   ├── DeviceList.tsx
│   │   │   ├── DeviceGrid.tsx
│   │   │   ├── CreateDeviceModal.tsx
│   │   │   ├── EditDeviceModal.tsx
│   │   │   ├── DeleteDeviceDialog.tsx
│   │   │   └── CommandPanel.tsx
│   │   ├── telemetry/                    # 👩 Gabriela
│   │   │   ├── TelemetryChart.tsx
│   │   │   ├── RealtimeChart.tsx
│   │   │   └── DataTable.tsx
│   │   ├── layout/                       # 👩 Gabriela
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── providers.tsx                 # Ambos
│   │
│   ├── lib/                              # 👨 Miguel
│   │   ├── api.ts                        # Cliente Axios
│   │   ├── websocket.ts                  # Cliente WebSocket
│   │   └── utils.ts                      # Utilidades
│   │
│   ├── services/                         # 👨 Miguel
│   │   ├── authService.ts
│   │   ├── deviceService.ts
│   │   ├── telemetryService.ts
│   │   └── commandService.ts
│   │
│   ├── store/                            # 👨 Miguel
│   │   ├── authStore.ts
│   │   ├── deviceStore.ts
│   │   └── telemetryStore.ts
│   │
│   ├── hooks/                            # 👨 Miguel
│   │   ├── useAuth.ts
│   │   ├── useDevices.ts
│   │   ├── useTelemetry.ts
│   │   ├── useCommands.ts
│   │   └── useWebSocket.ts
│   │
│   └── types/                            # 👨 Miguel
│       └── index.ts
│
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## 🚀 COMANDOS ÚTILES

### Desarrollo
```bash
# Iniciar servidor de desarrollo
pnpm dev

# Build de producción
pnpm build

# Iniciar producción
pnpm start

# Linter
pnpm lint

# Formatear código
pnpm format
```

### Git
```bash
# Ver estado
git status

# Crear rama
git checkout -b feature/nombre

# Guardar cambios
git add .
git commit -m "feat: descripción"
git push origin feature/nombre

# Actualizar desde main
git checkout main
git pull
git checkout feature/nombre
git merge main

# Ver diferencias
git diff
```

---

---

## 🐛 TROUBLESHOOTING COMÚN

### "use client" no funciona
```typescript
// ❌ No funciona
export default function Component() {
  "use client";  // Debe estar arriba
  
// ✅ Funciona
"use client";
export default function Component() {
```

### Hydration Error
```typescript
// ❌ Error: fecha cambia entre servidor y cliente
<p>{new Date().toLocaleString()}</p>

// ✅ Solución: solo renderizar en cliente
"use client";
const [time, setTime] = useState('');
useEffect(() => {
  setTime(new Date().toLocaleString());
}, []);
```

### Import de imágenes
```typescript
// ❌ No funciona
<img src="/logo.png" />

// ✅ Funciona en Next.js
import Image from 'next/image';
<Image src="/logo.png" width={200} height={50} alt="Logo" />
```

### CORS Error
```typescript
// Verificar que el backend tenga configurado CORS
// Django settings.py:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

---

## 📊 MÉTRICAS DE ÉXITO

### Performance
- Lighthouse Score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s

### Código
- Componentes < 300 líneas
- Funciones < 50 líneas
- Tests coverage > 70%

### UX
- Mobile responsive (320px+)
- Accesible (WCAG AA)
- Tiempos de carga < 2s

---

## 🎓 RECURSOS DE APRENDIZAJE

### Para Miguel
- [React Query Docs](https://tanstack.com/query/latest)
- [Zustand Tutorial](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Axios Guide](https://axios-http.com/docs/intro)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

### Para Gabriela
- [ShadCN UI Components](https://ui.shadcn.com/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Recharts Examples](https://recharts.org/en-US/examples)
- [Next.js Tutorial](https://nextjs.org/learn)

### Para Ambos
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Git Tutorial](https://learngitbranching.js.org/)
- [Next.js 14 Docs](https://nextjs.org/docs)

---

## 🎬 EXAMPLE WORKFLOW - DÍA 1 COMPLETO

### 9:00 AM - Stand-up (10 min)
```
Miguel: "Hoy voy a crear types, api client y auth service"
Gabriela: "Yo haré el LoginForm y RegisterForm"
Decisión: Miguel termina primero, Gabriela usa mock mientras
```

### 9:10 AM - Ambos empiezan
```bash
# Miguel
git checkout -b miguel/auth-logic

# Gabriela
git checkout -b gabriela/auth-ui
```

### 12:00 PM - Miguel termina y commitea
```bash
# Miguel
git add src/types src/lib src/services src/store src/hooks
git commit -m "feat: add auth logic (types, api, service, store, hook)"
git push origin miguel/auth-logic

# Crear PR en GitHub
# Avisar a Gabriela en WhatsApp/Slack
```

### 12:30 PM - Gabriela revisa y hace pull
```bash
# Gabriela
git checkout main
git pull origin main
git merge main  # Actualiza su rama

# Ahora puede usar el hook real
import { useAuth } from '@/hooks/useAuth';
```

### 3:00 PM - Sync de integración
```
Ambos prueban el login completo
- Miguel prueba la UI
- Gabriela prueba el hook
- Corrigen bugs juntos si hay
```

### 5:00 PM - Merge a main
```bash
# Ambos mergean sus PRs
git checkout main
git pull

# Planear el día 2
```

---

## 🏆 BONUS: FEATURES AVANZADOS

### Si terminan antes (opcional)

#### Miguel puede agregar:
1. **Cache con React Query**
```typescript
queryClient.setQueryData(['devices'], (old) => [...old, newDevice]);
```

2. **Optimistic Updates**
```typescript
onMutate: async (newDevice) => {
  await queryClient.cancelQueries(['devices']);
  const previous = queryClient.getQueryData(['devices']);
  queryClient.setQueryData(['devices'], (old) => [...old, newDevice]);
  return { previous };
},
```

3. **Error Retry Logic**
```typescript
retry: (failureCount, error) => {
  if (error.response?.status === 404) return false;
  return failureCount < 3;
},
```

#### Gabriela puede agregar:
1. **Animaciones con Framer Motion**
```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <DeviceCard />
</motion.div>
```

2. **Skeleton Loaders**
```typescript
{isLoading ? (
  <Skeleton className="h-32 w-full" />
) : (
  <DeviceCard device={device} />
)}
```

3. **Dark Mode**
```typescript
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();
<button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  Toggle
</button>
```

---

## ✅ CHECKLIST DIARIO

### Miguel - Daily Checklist
```
[ ] Git pull al empezar el día
[ ] Crear/actualizar tipos si es necesario
[ ] Escribir servicio/hook del día
[ ] Documentar funciones con JSDoc
[ ] Probar en Thunder Client
[ ] Commit y push
[ ] Crear PR
[ ] Avisar a Gabriela
[ ] Revisar PR de Gabriela
```

### Gabriela - Daily Checklist
```
[ ] Git pull al empezar el día
[ ] Revisar tipos disponibles
[ ] Crear componentes del día
[ ] Probar en diferentes tamaños de pantalla
[ ] Verificar accesibilidad
[ ] Commit y push
[ ] Crear PR
[ ] Avisar a Miguel
[ ] Revisar PR de Miguel
```

---

## 🎯 OBJETIVOS FINALES

### Semana 1 (MVP)
- ✅ Usuario puede registrarse y loguearse
- ✅ Usuario puede ver sus dispositivos
- ✅ Usuario puede crear/editar/eliminar dispositivos
- ✅ Usuario puede ver telemetría en tiempo real
- ✅ Usuario puede enviar comandos
- ✅ Interfaz responsive y atractiva

### Semana 2 (Polish)
- ✅ Animaciones suaves
- ✅ Sistema de notificaciones
- ✅ Dashboard personalizable
- ✅ Gráficas avanzadas
- ✅ Exportar datos
- ✅ Documentación completa

---

## 🚀 MENSAJE MOTIVACIONAL

**Para Gabriela:**
Tu rol es crucial - la interfaz es lo primero que ven los usuarios. Tómate el tiempo para que cada componente se vea increíble. No tengas miedo de experimentar con colores y animaciones. Si algo no se ve bien, cámbialo. ¡Confía en tu criterio de diseño!

**Para Miguel:**
Tu lógica es la base de todo. Asegúrate de que todo funcione perfecto antes de pasarlo. Piensa en casos edge (¿qué pasa si el backend no responde? ¿si el token expira?). Tu código robusto hará que Gabriela pueda trabajar tranquila. ¡Eres el backbone del proyecto!

**Para Ambos:**
Comuniquen, comuniquen, comuniquen. Es mejor preguntar 10 veces que perder 2 horas por un malentendido. Celebren cada pequeño logro. Y recuerden: es un proyecto de equipo, ganan o pierden juntos. 

**¡A darle con todo! 💪🚀**

---

## 📞 CONTACTO Y COORDINACIÓN

### Canales de Comunicación
- **WhatsApp/Telegram:** Urgencias y avisos rápidos
- **Discord/Slack:** Conversaciones técnicas detalladas
- **GitHub:** Revisiones de código y comentarios
- **Meet/Zoom:** Stand-ups diarios (10 min)

### Horarios Sugeridos
- **Stand-up:** 9:00 AM (10 min)
- **Deep Work:** 9:30 AM - 12:30 PM (3 horas)
- **Sync:** 12:30 PM (30 min)
- **Deep Work:** 1:00 PM - 5:00 PM (4 horas)
- **Review:** 5:00 PM (30 min)

---

¡ÉXITO EN EL PROYECTO! 🎉