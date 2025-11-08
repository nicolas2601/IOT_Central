"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rutas que requieren autenticación.
 * Espera a que el store se hidrate antes de verificar el estado.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  // Esperar a que Zustand termine de hidratar el estado persistido
  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Mientras no haya terminado de hidratar, mostrar loader
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado (una vez hidratado), no renderiza children
  if (!isAuthenticated) {
    return null;
  }

  // Si está autenticado, renderiza el contenido protegido
  return <>{children}</>;
}
