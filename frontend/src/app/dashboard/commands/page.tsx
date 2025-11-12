"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Terminal, Send, RefreshCcw, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { openErrorModal, openSuccessModal } from "@/store/errorStore";
import { useCommands } from "@/hooks/useCommands";
import { useDevices } from "@/hooks/useDevices";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/**
 * 🌐 Página de comandos IoT (revisada)
 * - Corrige el envío del ID real (UUID) del dispositivo al backend
 * - Usa un mapa (diccionario) entre nombre → objeto del dispositivo
 */
export default function CommandsPage() {
  const [selectedDeviceKey, setSelectedDeviceKey] = useState<string>("");
  const [selectedCommand, setSelectedCommand] = useState<string>("");
  const [isStartingSimulator, setIsStartingSimulator] = useState(false);

  const { user } = useAuthStore();
  const { devices, isLoading: loadingDevices, refetch } = useDevices();
  const { commands, sendCommand, isLoading } = useCommands();

  // 🔹 Crear un diccionario para buscar el objeto por su key
  const deviceMap = useMemo(() => {
    const map: Record<string, any> = {};
    (devices || []).forEach((device: any, index: number) => {
      // usamos el índice como clave visible, pero almacenamos el objeto completo
      map[String(index)] = device;
    });
    return map;
  }, [devices]);

  const commandOptions = [
    { value: "restart", label: "🔄 Reiniciar dispositivo" },
    { value: "calibrate", label: "🧭 Calibrar sensor" },
    { value: "read_data", label: "📊 Leer datos actuales" },
  ];

  // ✅ Obtener el dispositivo real según la selección
  const selectedDevice = selectedDeviceKey ? deviceMap[selectedDeviceKey] : null;

  // --- Enviar comando ---
  const handleSendCommand = async () => {
    if (!selectedDevice || !selectedCommand) {
      openErrorModal("Campos incompletos", "Selecciona un dispositivo y un comando.");
      return;
    }

    const deviceId = selectedDevice.id;

    sendCommand.mutate(
      { deviceId, command: selectedCommand },
      {
        onSuccess: () => {
          openSuccessModal("Comando enviado", `Comando "${selectedCommand}" enviado correctamente.`);
          refetch();
          setSelectedCommand("");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Error desconocido";
          openErrorModal("Error al enviar comando", msg);
        },
      }
    );
  };

  // --- Iniciar simulador ---
  const handleStartSimulator = async () => {
    if (!selectedDevice) {
      openErrorModal("Selecciona un dispositivo", "Debes elegir un dispositivo primero.");
      return;
    }

    try {
      setIsStartingSimulator(true);
      const { devicesApi } = await import("@/services/api");
      const res = await devicesApi.startSimulator(selectedDevice.id);

      openSuccessModal("Simulador iniciado", `Simulador activo para ${selectedDevice.name}`);
      refetch();
    } catch (error: any) {
      openErrorModal("Error al iniciar simulador", error.message);
    } finally {
      setIsStartingSimulator(false);
    }
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

      {/* Panel de comandos */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Enviar comando o iniciar simulador
          </CardTitle>
          <CardDescription>Selecciona dispositivo y comando</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Selector de dispositivo */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Dispositivo</label>
            <Select onValueChange={setSelectedDeviceKey} disabled={loadingDevices}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loadingDevices
                      ? "Cargando dispositivos..."
                      : devices?.length
                      ? "Seleccionar dispositivo"
                      : "No hay dispositivos disponibles"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(devices) && devices.length > 0 ? (
                  devices.map((d: any, index: number) => (
                    <SelectItem key={d.id} value={String(index)}>
                      {d.name || `Dispositivo ${index + 1}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No hay dispositivos registrados
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de comando */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Comando</label>
            <Select onValueChange={setSelectedCommand}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar comando" />
              </SelectTrigger>
              <SelectContent>
                {commandOptions.map((cmd) => (
                  <SelectItem key={cmd.value} value={cmd.value}>
                    {cmd.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botones */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              onClick={handleSendCommand}
              disabled={sendCommand.isPending || !selectedCommand || !selectedDevice}
              className="flex items-center gap-2"
            >
              {sendCommand.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Enviar comando
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              onClick={handleStartSimulator}
              disabled={isStartingSimulator || !selectedDevice}
              className="flex items-center gap-2"
            >
              {isStartingSimulator ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Iniciando simulador...
                </>
              ) : (
                <>
                  <Cpu className="h-4 w-4 text-primary" /> Iniciar simulador
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
            <CardDescription>Últimos comandos enviados</CardDescription>
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
          ) : commands?.length ? (
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
                      {cmd.timestamp
                        ? new Date(cmd.timestamp).toLocaleString()
                        : "sin fecha"}
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
