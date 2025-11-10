"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Device, Telemetry } from "@/types";

export default function DeviceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry[]>([]);
  const deviceId = params?.id as string;

  useEffect(() => {
    const load = async () => {
      try {
        const { devicesApi, telemetryApi } = await import("@/services/api");
        const d = await devicesApi.get(deviceId);
        setDevice(d);
        const t = await devicesApi.getTelemetry(deviceId);
        setTelemetry(Array.isArray(t) ? t : []);
      } catch (e) {
        console.error("Error cargando detalle de dispositivo", e);
      }
    };
    if (deviceId) load();
  }, [deviceId]);

  if (!device) return <p className="mt-6">Cargando dispositivo...</p>;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{device.name}</h2>
        <Button variant="outline" onClick={() => router.push("/dashboard/devices")}>Volver</Button>
      </div>

      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Información del Dispositivo</CardTitle>
          <CardDescription>ID: {String(device.id)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p><b>Tipo:</b> {device.device_type}</p>
              <p><b>Estado:</b> {device.is_active ? "Activo" : "Inactivo"}</p>
            </div>
            <div>
              <p><b>Descripción:</b> {device.description || "Sin descripción"}</p>
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
    </section>
  );
}