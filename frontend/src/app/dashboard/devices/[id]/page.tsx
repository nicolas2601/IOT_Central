"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Device, Telemetry } from "@/types";
import { resolveDeviceDescription } from "@/lib/device";
import TelemetryPythonPanel from "@/components/devices/TelemetryPythonPanel";
import { Play, Square } from "lucide-react";

export default function DeviceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry[]>([]);
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [loadingSimulator, setLoadingSimulator] = useState(false);
  const deviceId = params?.id as string;

  useEffect(() => {
    const load = async () => {
      try {
        const { devicesApi, telemetryApi } = await import("@/services/api");
        const d = await devicesApi.get(deviceId);
        setDevice(d);
        
        // Obtener telemetría reciente (últimas 24 horas, máximo 10 registros)
        try {
          const recentData = await telemetryApi.getRecent(deviceId, { limit: 10, hours: 24 });
          const t = recentData.results || [];
          setTelemetry(Array.isArray(t) ? t : []);
          
          // Verificar si hay telemetría reciente (indica que el simulador está corriendo)
          if (Array.isArray(t) && t.length > 0) {
            const lastTelemetry = t[0];
            const lastTime = new Date(lastTelemetry.timestamp).getTime();
            const now = Date.now();
            // Si la última telemetría es reciente (menos de 60 segundos), el simulador está activo
            if (now - lastTime < 60000) {
              setSimulatorRunning(true);
            }
          }
        } catch (telemetryError) {
          console.warn("No se pudo obtener telemetría reciente:", telemetryError);
          setTelemetry([]);
        }
      } catch (e) {
        console.error("Error cargando detalle de dispositivo", e);
      }
    };
    if (deviceId) load();
  }, [deviceId]);

  const handleStartSimulator = async () => {
    if (!deviceId) return;
    setLoadingSimulator(true);
    try {
      const { deviceService } = await import("@/services/deviceService");
      await deviceService.startSimulator(deviceId, { interval: 5 });
      setSimulatorRunning(true);
      console.log("✓ Simulador iniciado para", device?.name);
    } catch (error) {
      console.error("Error iniciando simulador:", error);
    } finally {
      setLoadingSimulator(false);
    }
  };

  const handleStopSimulator = async () => {
    if (!deviceId) return;
    setLoadingSimulator(true);
    try {
      const { deviceService } = await import("@/services/deviceService");
      await deviceService.stopSimulator(deviceId);
      setSimulatorRunning(false);
      console.log("✓ Simulador detenido para", device?.name);
    } catch (error) {
      console.error("Error deteniendo simulador:", error);
    } finally {
      setLoadingSimulator(false);
    }
  };

  if (!device) return <p className="mt-6">Cargando dispositivo...</p>;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{device.name}</h2>
        <Button variant="outline" onClick={() => router.push("/dashboard/devices")}>Volver</Button>
      </div>

      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Información del Dispositivo</CardTitle>
              <CardDescription>ID: {String(device.id)}</CardDescription>
            </div>
            {simulatorRunning ? (
              <Button
                onClick={handleStopSimulator}
                disabled={loadingSimulator}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                <Square className="w-4 h-4 mr-2" /> {loadingSimulator ? "Deteniendo..." : "Parar Simulador"}
              </Button>
            ) : (
              <Button
                onClick={handleStartSimulator}
                disabled={loadingSimulator}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                <Play className="w-4 h-4 mr-2" /> {loadingSimulator ? "Iniciando..." : "Iniciar Simulador"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p><b>Tipo:</b> {device.device_type}</p>
              <p><b>Estado:</b> {device.is_active ? "Activo" : "Inactivo"}</p>
            </div>
            <div>
              <p><b>Descripción:</b> {resolveDeviceDescription(device)}</p>
              <p><b>Última conexión:</b> {device.last_connection || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Telemetría Reciente</CardTitle>
          <CardDescription>Últimos registros</CardDescription>
        </CardHeader>
        <CardContent>
          {telemetry.length ? (
            <ul className="space-y-2 text-sm">
              {telemetry.slice(0, 20).map((t) => (
                <li key={String(t.id)} className="flex justify-between border-b border-white/10 pb-1">
                  <span>{new Date(t.timestamp).toLocaleString()}</span>
                  <span className="text-white/80">{JSON.stringify(t.data)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/70">Sin telemetría.</p>
          )}
        </CardContent>
      </Card>

      {/* Sección: Script Python recomendado para simulación local */}
      {Boolean((device as any)?.metadata?.template) && (
        <TelemetryPythonPanel
          deviceId={String(device.id)}
          deviceName={device.name}
          template={(device as any).metadata.template}
        />
      )}
    </section>
  );
}