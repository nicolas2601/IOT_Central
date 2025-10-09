# Frontend - Plataforma IoT

Frontend de la plataforma IoT construido con Next.js 15, TypeScript y TailwindCSS.

## 🚀 Stack Tecnológico

- **Next.js 15** con App Router y Turbopack
- **TypeScript** - Tipado estricto
- **TailwindCSS 4** - Estilos modernos
- **React Query** - Data fetching y cache
- **Zustand** - Estado global
- **Axios** - Cliente HTTP
- **Recharts** - Visualización de datos
- **Sonner** - Notificaciones toast
- **Lucide React** - Iconos

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Página de inicio
│   │   └── globals.css        # Estilos globales
│   │
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes UI (ShadCN)
│   │   └── providers.tsx     # Providers (React Query, Toaster)
│   │
│   ├── lib/                   # Utilidades
│   │   └── utils.ts          # Funciones helper
│   │
│   ├── services/              # Servicios API
│   │   └── api.ts            # Cliente Axios configurado
│   │
│   ├── store/                 # Estado global (Zustand)
│   │   └── authStore.ts      # Store de autenticación
│   │
│   ├── types/                 # Tipos TypeScript
│   │   └── index.ts          # Tipos de la aplicación
│   │
│   └── hooks/                 # Custom hooks
│
├── public/                    # Archivos estáticos
├── package.json
├── tsconfig.json
├── next.config.ts
└── Dockerfile
```

## 🔧 Instalación

### Desarrollo Local

1. **Instalar dependencias**
```bash
pnpm install
```

2. **Configurar variables de entorno**
```bash
# Crear archivo .env.local
cp .env.example .env.local
```

Editar `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

3. **Ejecutar en modo desarrollo**
```bash
pnpm dev
```

La aplicación estará disponible en http://localhost:3000

### Con Docker

```bash
# Desde la raíz del proyecto
docker-compose up -d frontend
```

## 📦 Scripts Disponibles

```bash
# Desarrollo con Turbopack
pnpm dev

# Build para producción
pnpm build

# Iniciar servidor de producción
pnpm start

# Linting
pnpm lint

# Type checking
pnpm type-check
```

## 🎨 Componentes UI

Los componentes UI están basados en **ShadCN UI**. Para agregar nuevos componentes:

```bash
# Ejemplo: agregar componente Button
npx shadcn@latest add button
```

## 🔌 Servicios API

El cliente API está configurado en `src/services/api.ts` con:

- Interceptores para JWT automático
- Refresh token automático
- Manejo de errores centralizado
- TypeScript types completos

### Ejemplo de uso:

```typescript
import { devicesApi } from '@/services/api';

// Listar dispositivos
const devices = await devicesApi.list();

// Crear dispositivo
const newDevice = await devicesApi.create({
  name: 'Sensor 1',
  device_type: 'sensor',
});
```

## 🗂️ Estado Global

### Auth Store (Zustand)

```typescript
import { useAuthStore } from '@/store/authStore';

function MyComponent() {
  const { user, login, logout } = useAuthStore();
  
  // Login
  await login({ username: 'user', password: 'pass' });
  
  // Logout
  await logout();
}
```

## 🎯 React Query

Configurado en `src/components/providers.tsx` con:

- Stale time: 1 minuto
- Retry: 1 intento
- No refetch on window focus

### Ejemplo de uso:

```typescript
import { useQuery } from '@tanstack/react-query';
import { devicesApi } from '@/services/api';

function DevicesList() {
  const { data, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => devicesApi.list(),
  });
  
  if (isLoading) return <div>Cargando...</div>;
  
  return <div>{/* Renderizar dispositivos */}</div>;
}
```

## 🎨 Estilos y Temas

TailwindCSS está configurado con variables CSS para temas:

```css
/* Usar en componentes */
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>
```

## 🔒 Autenticación

El sistema de autenticación incluye:

1. **Login/Register** - JWT tokens
2. **Auto-refresh** - Tokens renovados automáticamente
3. **Protected routes** - Middleware de Next.js
4. **Persistent state** - Zustand con localStorage

## 📱 Responsive Design

Todos los componentes están diseñados para ser responsive:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Contenido */}
</div>
```

## 🚀 Build y Deploy

### Build de producción

```bash
pnpm build
```

### Variables de entorno en producción

Asegúrate de configurar:
- `NEXT_PUBLIC_API_URL` - URL del backend
- `NEXT_PUBLIC_WS_URL` - URL de WebSockets

## 📚 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [ShadCN UI](https://ui.shadcn.com/)
- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)

## 🐛 Troubleshooting

### Error de módulos no encontrados

```bash
# Limpiar cache y reinstalar
rm -rf node_modules .next
pnpm install
```

### Error de tipos TypeScript

```bash
# Regenerar tipos de Next.js
pnpm dev
# Luego Ctrl+C y volver a ejecutar
```

### Error de conexión al backend

Verifica que:
1. El backend esté corriendo en el puerto 8000
2. Las variables de entorno estén correctas
3. CORS esté configurado en el backend
