"use client";
import { useWebSocket } from "@/hooks/useWebSocket";
import { TelemetryChart } from "@/components/dashboard/TelemetryChart";

export const RealtimeChart = ({ deviceId, token }: { deviceId: string; token: string }) => {
  const { telemetryData } = useWebSocket(deviceId, token);

  return (
    <TelemetryChart
      data={telemetryData.map((d) => ({ ...d, timestamp: new Date(d.timestamp).toLocaleTimeString() }))}
      title="Telemetría en Tiempo Real"
      dataKey="value"
    />
  );
};
