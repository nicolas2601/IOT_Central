"use client";

import { useMemo, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { alertsApi } from "@/services/api";
import type { Alert, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, AlertTriangle } from "lucide-react";

export default function NotificationsMenu() {
  const { data, isLoading, isError } = useQuery<PaginatedResponse<Alert>>({
    queryKey: ["alerts", { active: true }],
    queryFn: () => alertsApi.list({ is_active: true }),
    staleTime: 30_000,
  });

  const items = useMemo(() => {
    const results = data?.results || [];
    return results.slice(0, 5);
  }, [data]);

  // Persistimos la última vez que el usuario abrió las notificaciones
  const [lastSeenAt, setLastSeenAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem("notificationsLastSeenAt");
    return raw ? Number(raw) : 0;
  });

  // Si llegan nuevas alertas, calculamos si hay no vistas
  const hasUnread = useMemo(() => {
    if (!items || items.length === 0) return false;
    return items.some((a) => {
      const ts = new Date(a.last_triggered || a.created_at).getTime();
      return ts > lastSeenAt;
    });
  }, [items, lastSeenAt]);

  // Al abrir el menú, marcamos como vistas actualizando el timestamp
  const handleOpenChange = (open: boolean) => {
    if (open) {
      const now = Date.now();
      setLastSeenAt(now);
      try {
        window.localStorage.setItem("notificationsLastSeenAt", String(now));
      } catch {}
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-3 text-sm text-muted-foreground">Cargando…</div>
        ) : isError ? (
          <div className="p-3 text-sm text-muted-foreground">No se pudieron cargar las notificaciones.</div>
        ) : items.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">No hay notificaciones activas.</div>
        ) : (
          items.map((alert) => (
            <DropdownMenuItem key={alert.id} className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{alert.name} · {alert.device_name}</p>
                <p className="text-xs text-muted-foreground">
                  Severidad: {alert.severity} · Último: {alert.last_triggered ? new Date(alert.last_triggered).toLocaleString() : "–"}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}