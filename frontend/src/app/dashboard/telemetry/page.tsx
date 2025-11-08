"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RealtimeChart } from "@/components/telemetry/RealtimeChart";
import { useDevices } from "@/hooks/useDevices";
import { useAuthStore } from "@/store/authStore";
import { ShinyText } from "@/components/animations/ShinyText";
import { TextType } from "@/components/animations/TextType";
import { FadeContent } from "@/components/animations/FadeContent";
import { ClickSpark } from "@/components/animations/ClickSpark";
import { StarBorder } from "@/components/animations/StarBorder";

export default function TelemetryPage() {
  const { devices, isLoading } = useDevices();
  const { accessToken } = useAuthStore();
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  useEffect(() => {
    if (!selectedDevice && devices && devices.length > 0) {
      setSelectedDevice(devices[0].id);
    }
  }, [devices, selectedDevice]);

  const statusText = useMemo(() => {
    if (!accessToken) return "Inicia sesión para habilitar telemetría en tiempo real";
    if (isLoading) return "Cargando dispositivos...";
    if (!devices || devices.length === 0) return "No hay dispositivos registrados. Crea uno para comenzar.";
    return selectedDevice ? `Visualizando telemetría de ${selectedDevice}` : "Selecciona un dispositivo";
  }, [accessToken, isLoading, devices, selectedDevice]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <ShinyText as="h1" className="text-3xl font-bold">Telemetría en Tiempo Real</ShinyText>
        <TextType text={statusText} className="text-sm text-white/80" />
      </div>

      {/* Selector de dispositivo */}
      <ClickSpark>
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Selecciona dispositivo</CardTitle>
            <CardDescription>Elige el dispositivo para ver sus métricas en vivo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <select
                className="w-full sm:w-72 bg-black/60 text-white border-white/10 rounded-md px-3 py-2"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
              >
                {devices && devices.length > 0 ? (
                  devices.map((d: { id: string; name?: string }) => (
                    <option key={d.id} value={d.id}>{d.name || d.id}</option>
                  ))
                ) : (
                  <option>Sin dispositivos</option>
                )}
              </select>
              <Button
                variant="secondary"
                className="bg-blue-600 hover:bg-blue-500 text-white"
                onClick={() => setSelectedDevice((prev) => prev)}
              >
                Reconectar
              </Button>
            </div>
          </CardContent>
        </Card>
      </ClickSpark>

      {/* Gráfico en tiempo real */}
      <FadeContent>
        <StarBorder>
          <div className="bg-black/40 border-white/10 backdrop-blur-xl rounded-xl p-2">
            {accessToken && selectedDevice ? (
              <RealtimeChart deviceId={selectedDevice} token={accessToken} />
            ) : (
              <div className="p-6 text-white/70 text-sm">Configura tu sesión y selecciona un dispositivo para ver datos.</div>
            )}
          </div>
        </StarBorder>
      </FadeContent>
    </div>
  );
}