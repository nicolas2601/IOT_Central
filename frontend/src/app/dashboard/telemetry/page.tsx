"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RealtimeChart } from "@/components/telemetry/RealtimeChart";
import { TelemetryKpis } from "@/components/telemetry/TelemetryKpis";
import { AdvancedCharts } from "@/components/telemetry/AdvancedCharts";
import { MetricSelector } from "@/components/telemetry/MetricSelector";
import { EventTable } from "@/components/telemetry/EventTable";
import { HourlyStacked } from "@/components/telemetry/HourlyStacked";
import { RadialPanicGauge } from "@/components/telemetry/RadialPanicGauge";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useDevices } from "@/hooks/useDevices";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";
import { telemetryApi } from "@/services/api";
import { ShinyText } from "@/components/animations/ShinyText";
import { TextType } from "@/components/animations/TextType";
import { FadeContent } from "@/components/animations/FadeContent";
import { ClickSpark } from "@/components/animations/ClickSpark";
import { StarBorder } from "@/components/animations/StarBorder";

export default function TelemetryPage() {
  const { devices, isLoading } = useDevices();
  const { accessToken } = useAuthStore();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const { defaultDevice, telemetryRate, smooth } = useSettingsStore();
  const { telemetryData, status, lastError } = useWebSocket(selectedDevice || "", accessToken || "");
  const wsEnabled = !!accessToken && !!selectedDevice;
  const [fallbackData, setFallbackData] = useState<any[]>([]);
  const analyticsData = telemetryData.length ? telemetryData : fallbackData;
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  // Fallback REST: si el WS no entrega muestras, mostrar la última telemetría
  useEffect(() => {
    const fetchLatest = async () => {
      if (!wsEnabled || telemetryData.length > 0) return;
      try {
        const latest = await telemetryApi.getLatest(selectedDevice);
        if (latest) {
          setFallbackData([{ ...latest }]);
        }
      } catch (e) {
        // Silencioso: la UI ya muestra errores WS
        setFallbackData([]);
      }
    };
    fetchLatest();
  }, [wsEnabled, selectedDevice, telemetryData.length]);

  useEffect(() => {
    // Si hay preferencia guardada, usarla; si no, tomar el primero
    if (!selectedDevice) {
      if (defaultDevice) {
        setSelectedDevice(defaultDevice);
      } else if (devices && devices.length > 0) {
        setSelectedDevice(devices[0].id);
      }
    }
  }, [devices, selectedDevice, defaultDevice]);

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
        <br />
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
            {/* Estado de WebSocket y diagnóstico */}
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
              <span className={`px-2 py-0.5 rounded ${status === 'connected' ? 'bg-green-600/30 text-green-300' : status === 'connecting' ? 'bg-yellow-600/30 text-yellow-300' : status === 'error' ? 'bg-red-600/30 text-red-300' : 'bg-gray-600/30 text-gray-300'}`}>WS: {status}</span>
              <span className="text-white/70">muestras: {telemetryData?.length || 0}</span>
              {lastError && (
                <span className="text-red-300 truncate max-w-[50ch]">Error: {lastError}</span>
              )}
              {process.env.NEXT_PUBLIC_WS_URL && (
                <span className="text-white/50 truncate max-w-[60ch]">WS URL: {process.env.NEXT_PUBLIC_WS_URL}</span>
              )}
            </div>

            {wsEnabled ? (
              <RealtimeChart deviceId={selectedDevice} token={accessToken} telemetryData={telemetryData.length ? telemetryData : fallbackData} />
            ) : (
              <div className="p-6 text-white/70 text-sm">Configura tu sesión y selecciona un dispositivo para ver datos.</div>
            )}

            {wsEnabled && telemetryData && telemetryData.length > 0 && (
              <div className="px-3 pb-3">
                <details className="text-xs text-white/60">
                  <summary>Ver última muestra recibida</summary>
                  <pre className="mt-2 max-h-48 overflow-auto bg-black/50 border border-white/10 rounded p-2">
                    {JSON.stringify(telemetryData[telemetryData.length - 1], null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </StarBorder>
      </FadeContent>

      {/* Analítica y visualizaciones adicionales */}
      {(analyticsData && analyticsData.length > 0) && (
        <FadeContent>
          <StarBorder>
            <div className="bg-black/40 border-white/10 backdrop-blur-xl rounded-xl p-2">
              <Card className="bg-transparent border-transparent">
                <CardHeader>
                  <CardTitle className="text-white">Analítica</CardTitle>
                  <CardDescription>KPIs y gráficas avanzadas al estilo Azure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <TelemetryKpis telemetryData={analyticsData} />
                  <div className="space-y-3">
                    <div className="text-xs text-white/70">Selecciona métricas para las series</div>
                    <MetricSelector telemetryData={analyticsData} onChange={setSelectedMetrics} max={3} />
                  </div>
                  <AdvancedCharts telemetryData={analyticsData} selectedKeys={selectedMetrics} />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <HourlyStacked telemetryData={analyticsData} />
                    <RadialPanicGauge telemetryData={analyticsData} />
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm text-white/80">Eventos recientes</div>
                    <EventTable telemetryData={analyticsData} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </StarBorder>
        </FadeContent>
      )}
    </div>
  );
}