"use client";

import { useState } from "react";
import { useCommands } from "@/hooks/useCommands";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Terminal, Send, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { openErrorModal } from "@/store/errorStore";

/**
 * Página de comandos IoT mejorada (Día 4 - Gabriela)
 * - Responsive design
 * - Mejor feedback visual
 * - UI refinada con estilos consistentes
 */
export default function CommandsPage() {
  const [deviceId, setDeviceId] = useState("sensor_001");
  const [command, setCommand] = useState("");
  const { commands, sendCommand, isLoading, refetch } = useCommands();
  const { user } = useAuthStore();

  const handleSend = async () => {
    if (!deviceId || !command) {
      openErrorModal("Campos incompletos", "Completa el ID del dispositivo y el comando");
      return;
    }
    sendCommand.mutate(
      { deviceId, command },
      {
        onSuccess: () => {
          // Éxito: limpiar el comando y refrescar sin modal (solo errores usan modal)
          setCommand("");
          refetch();
        },
        onError: (err: any) => {
          const description = err?.response?.data?.message || err?.message || "Intenta nuevamente";
          openErrorModal("Error al enviar comando", description);
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-primary">
            <Terminal className="h-8 w-8 text-primary" /> Centro de Comandos
          </h1>
          <p className="text-muted-foreground text-sm">
            Envía, supervisa y gestiona comandos en tus dispositivos IoT conectados.
          </p>
        </div>
      </div>

      {/* Usuario autenticado */}
<Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
<CardTitle className="text-white">Sesión actual</CardTitle>
          <CardDescription>
            Información del usuario autenticado
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>👤 <strong>{user?.username || "Sin usuario"}</strong></p>
          <p className="text-muted-foreground text-xs">
            Usa tu sesión para enviar comandos con autenticación segura.
          </p>
        </CardContent>
      </Card>

      {/* Envío de comandos */}
<Card className="bg-black/40 border-white/10 backdrop-blur-xl hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Enviar nuevo comando
          </CardTitle>
          <CardDescription>
            Ingresa el identificador del dispositivo y la instrucción a ejecutar
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="ID del dispositivo"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
            />
            <Input
              placeholder="Comando (ej: restart, calibrate)"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
            />
            <Button
              onClick={handleSend}
              disabled={sendCommand.isPending}
              className="flex items-center justify-center gap-2"
            >
              {sendCommand.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Enviar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial de comandos */}
<Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Historial de Comandos</CardTitle>
            <CardDescription>
              Últimos comandos enviados a tus dispositivos
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCcw className="h-4 w-4" /> Actualizar
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Cargando historial...
            </div>
          ) : commands.length > 0 ? (
            <ul className="divide-y divide-border rounded-md bg-muted/20">
              {commands.map((cmd: any) => (
                <li
                  key={cmd.id}
                  className="flex justify-between items-center p-3 hover:bg-muted/40 transition"
                >
                  <div>
                    <p className="font-semibold text-sm">{cmd.command}</p>
                    <p className="text-xs text-muted-foreground">
                      {cmd.device_id || "sin id"} —{" "}
                      {cmd.timestamp ? new Date(cmd.timestamp).toLocaleString() : "sin fecha"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      cmd.status === "completed"
                        ? "default"
                        : cmd.status === "error"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {cmd.status || "pendiente"}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay comandos registrados todavía.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
