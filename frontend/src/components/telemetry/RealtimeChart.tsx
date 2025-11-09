"use client";
import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { TelemetryChart } from "@/components/dashboard/TelemetryChart";
import { telemetryService } from "@/services/telemetryService";
import type { TelemetryWebSocketMessage } from "@/types";

type TelemetrySample = TelemetryWebSocketMessage["data"];

const isRecord = (obj: unknown): obj is Record<string, unknown> =>
  !!obj && typeof obj === "object";

const pickMetricKey = (samples: TelemetrySample[]): { key: string; fromNested: boolean } => {
  // Prioridad de métricas comunes para mayor estabilidad visual
  const preferred = [
    "temperature",
    "temp",
    "humidity",
    "pressure",
    "speed",
    "rpm",
    "voltage",
    "current",
    // Claves comunes en español
    "temperatura",
    "humedad",
    "presion",
    "velocidad",
    "voltaje",
    "corriente",
    "value",
  ];
  // Buscar en las últimas muestras una clave numérica dentro de data
  const recent = samples.slice(-20).reverse();
  for (const s of recent) {
    if (isRecord(s?.data)) {
      const keys = Object.keys(s.data);
      // Intentar primero por claves preferidas
      for (const k of preferred) {
        if (k in (s.data as Record<string, unknown>)) {
          const val = (s.data as Record<string, unknown>)[k];
          const num = typeof val === "string" ? Number(val) : typeof val === "boolean" ? (val ? 1 : 0) : Array.isArray(val) ? Number(val[0]) : val;
          if (typeof num === "number" && !Number.isNaN(num)) {
            return { key: k, fromNested: true };
          }
        }
      }
      for (const k of keys) {
        const val = (s.data as Record<string, unknown>)[k];
        const num = typeof val === "string" ? Number(val) : typeof val === "boolean" ? (val ? 1 : 0) : Array.isArray(val) ? Number(val[0]) : val;
        if (typeof num === "number" && !Number.isNaN(num)) {
          return { key: k, fromNested: true };
        }
      }
    }
    // Alternativa: campo superior numérico
    const topKeys = Object.keys(s ?? {});
    for (const k of topKeys) {
      const val = (s as Record<string, unknown>)[k];
      const num = typeof val === "string" ? Number(val) : typeof val === "boolean" ? (val ? 1 : 0) : Array.isArray(val) ? Number(val[0]) : val;
      if (typeof num === "number" && !Number.isNaN(num)) {
        return { key: k, fromNested: false };
      }
    }
  }
  // Fallback si no se detecta nada
  return { key: "value", fromNested: false };
};

export const RealtimeChart = ({ deviceId, token, telemetryData: externalData }: { deviceId?: string; token?: string; telemetryData?: TelemetrySample[] }) => {
  const { telemetryData } = externalData ? { telemetryData: externalData } : useWebSocket(deviceId || "", token || "");

  // Semilla: historial reciente para mostrar una línea completa al inicio
  const [seedHistory, setSeedHistory] = useState<TelemetrySample[]>([]);

  useEffect(() => {
    const shouldSeed = (!!deviceId) && (!externalData || externalData.length === 0) && (telemetryData.length === 0);
    if (!shouldSeed) return;
    (async () => {
      try {
        const recent = await telemetryService.getRecent(deviceId!);
        const mapped: TelemetrySample[] = Array.isArray(recent)
          ? recent.map((r: any) => ({
              device_id: r.device || r.device_id,
              device_name: r.device_name,
              timestamp: r.timestamp,
              data: r.data,
            }))
          : [];
        setSeedHistory(mapped.slice(-50));
      } catch (e) {
        setSeedHistory([]);
      }
    })();
  }, [deviceId, token, externalData?.length, telemetryData.length]);

  const samples = [...seedHistory, ...telemetryData];
  const metric = pickMetricKey(samples);

  const normalized = samples
    .map((d) => {
      const ts = d?.timestamp ? new Date(d.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
      const raw = metric.fromNested ? (d?.data as Record<string, unknown>)?.[metric.key] : (d as Record<string, unknown>)?.[metric.key];
      const num = typeof raw === "string"
        ? Number(raw)
        : typeof raw === "boolean"
          ? (raw ? 1 : 0)
          : Array.isArray(raw)
            ? Number(raw[0])
            : (raw as number);
      if (typeof num !== "number" || Number.isNaN(num)) return null;
      return { timestamp: ts, value: num };
    })
    .filter(Boolean) as { timestamp: string; value: number }[];

  return (
    <TelemetryChart
      data={normalized}
      title={`Telemetría en Tiempo Real (${metric.key})`}
      dataKey="value"
    />
  );
};
