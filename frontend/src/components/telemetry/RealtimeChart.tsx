"use client";
import { useWebSocket } from "@/hooks/useWebSocket";
import { TelemetryChart } from "@/components/dashboard/TelemetryChart";

const pickMetricKey = (sample: any): { key: string; fromNested: boolean } => {
  if (!sample) return { key: "value", fromNested: false };
  if (typeof sample.value === "number") return { key: "value", fromNested: false };
  // Prefer nested data object
  if (sample.data && typeof sample.data === "object") {
    const numeric = Object.keys(sample.data).find((k) => typeof sample.data[k] === "number");
    if (numeric) return { key: numeric, fromNested: true };
  }
  // Fallback: any top-level numeric field
  const topNumeric = Object.keys(sample).find((k) => typeof sample[k] === "number");
  if (topNumeric) return { key: topNumeric, fromNested: false };
  return { key: "value", fromNested: false };
};

export const RealtimeChart = ({ deviceId, token, telemetryData: externalData }: { deviceId?: string; token?: string; telemetryData?: any[] }) => {
  const { telemetryData } = externalData ? { telemetryData: externalData } : useWebSocket(deviceId || "", token || "");
  const metric = pickMetricKey(telemetryData[0]);

  const normalized = telemetryData.map((d) => {
    const ts = d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
    const value = metric.fromNested ? d?.data?.[metric.key] : d?.[metric.key];
    return { timestamp: ts, value };
  });

  return (
    <TelemetryChart
      data={normalized}
      title={`Telemetría en Tiempo Real (${metric.key})`}
      dataKey="value"
    />
  );
};
