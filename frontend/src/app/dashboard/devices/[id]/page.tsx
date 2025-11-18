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
  // Control de estado deseado por el usuario y pausa de telemetría en UI
  const [userWantsSimulatorOn, setUserWantsSimulatorOn] = useState<null | boolean>(null);
  const [telemetryPaused, setTelemetryPaused] = useState(false);
  const deviceId = params?.id as string;
  const switchOn = userWantsSimulatorOn !== null ? userWantsSimulatorOn : simulatorRunning;

  useEffect(() => {
    const load = async () => {
      try {
        const { devicesApi, telemetryApi } = await import("@/services/api");
        const d = await devicesApi.get(deviceId);
        setDevice(d);
        // Respetar preferencia previa del usuario (persistida)
        try {
          const pausedFlag = localStorage.getItem(`simulator_paused:${deviceId}`);
          if (pausedFlag === '1') {
            setUserWantsSimulatorOn(false);
            setTelemetryPaused(true);
          } else if (pausedFlag === '0') {
            setUserWantsSimulatorOn(true);
            setTelemetryPaused(false);
          }
        } catch (_) {}
        
        // Obtener telemetría reciente (últimas 24 horas, máximo 10 registros)
        try {
          const recentData = await telemetryApi.getRecent(deviceId, { limit: 10, hours: 24 });
          const t = recentData.results || [];
          setTelemetry(Array.isArray(t) ? t : []);
          
          // Verificar si hay telemetría reciente SOLO si el usuario
          // no ha forzado estado OFF (userWantsSimulatorOn === false)
          if (!telemetryPaused && userWantsSimulatorOn !== false) {
            if (Array.isArray(t) && t.length > 0) {
              const lastTelemetry = t[0];
              const lastTime = new Date(lastTelemetry.timestamp).getTime();
              const now = Date.now();
              // Si la última telemetría es reciente (menos de 60 segundos), inferimos actividad
              if (now - lastTime < 60000) {
                setSimulatorRunning(true);
              }
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
      setUserWantsSimulatorOn(true);
      setTelemetryPaused(false);
      try {
        localStorage.setItem(`simulator_paused:${deviceId}`, '0');
        window.dispatchEvent(new CustomEvent('simulator-toggle', { detail: { deviceId, paused: false } }));
      } catch (_) {}
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
      // Intento principal
      const res1 = await deviceService.stopSimulator(deviceId);
      console.log("✓ Parada solicitada (1)", res1);
      // Intentos adicionales (hasta 3) si siguiera activo
      for (let i = 0; i < 2; i++) {
        await new Promise((r) => setTimeout(r, 800));
        try {
          const resTry = await deviceService.stopSimulator(deviceId);
          console.log(`✓ Parada solicitada (${i + 2})`, resTry);
        } catch (_) {
          // continuar
        }
      }
      // Marcar estado deseado OFF y pausar telemetría en UI
      setSimulatorRunning(false);
      setUserWantsSimulatorOn(false);
      setTelemetryPaused(true);
      try {
        localStorage.setItem(`simulator_paused:${deviceId}`, '1');
        window.dispatchEvent(new CustomEvent('simulator-toggle', { detail: { deviceId, paused: true } }));
      } catch (_) {}
      console.log("✓ Simulador marcado como OFF y telemetría pausada en UI para", device?.name);
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
            {Boolean((device as any)?.metadata?.template) && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/80">Simulador</span>
                <button
                  type="button"
                  onClick={() => {
                    if (loadingSimulator) return;
                    if (switchOn) {
                      handleStopSimulator();
                    } else {
                      handleStartSimulator();
                    }
                  }}
                  disabled={loadingSimulator}
                  aria-pressed={switchOn}
                  aria-label="Alternar simulador"
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors border ${
                    switchOn ? "bg-violet-600 border-violet-500" : "bg-white/20 border-white/20"
                  } ${loadingSimulator ? "opacity-60 cursor-not-allowed" : "hover:bg-violet-500/70"}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                      switchOn ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className={`text-xs ${switchOn ? "text-violet-300" : "text-white/60"}`}>
                  {loadingSimulator ? (switchOn ? "Deteniendo..." : "Iniciando...") : (switchOn ? "ON" : "OFF")}
                </span>
              </div>
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
          {!telemetryPaused && telemetry.length ? (
            <ul className="space-y-2 text-sm">
              {telemetry.slice(0, 20).map((t) => (
                <li key={String(t.id)} className="flex justify-between border-b border-white/10 pb-1">
                  <span>{new Date(t.timestamp).toLocaleString()}</span>
                  <span className="text-white/80">{JSON.stringify(t.data)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/70">
              {telemetryPaused ? "Telemetría detenida." : "Sin telemetría."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Script Python recomendado SOLO para dispositivos "Generar uno propio" */}
      {(() => {
        const md: any = (device as any)?.metadata || {};
        const customProps = md?.customTelemetry?.properties;
        const isCustom = Array.isArray(customProps) && customProps.length > 0;
        if (!isCustom) return null;
        return (
          <TelemetryPythonPanel
            deviceId={String(device.id)}
            deviceName={device.name}
            properties={customProps}
          />
        );
      })()}
    </section>
  );
}