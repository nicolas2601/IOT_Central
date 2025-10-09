'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';

/**
 * Providers Component
 * 
 * Envuelve la aplicación con todos los providers necesarios:
 * - React Query para data fetching
 * - Sonner para notificaciones toast
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Crear QueryClient en el estado del componente para evitar recreación
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuración por defecto para queries
            staleTime: 60 * 1000, // 1 minuto
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster 
        position="top-right"
        richColors
        closeButton
        expand={false}
      />
    </QueryClientProvider>
  );
}
