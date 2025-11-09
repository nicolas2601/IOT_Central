"use client";
import { useEffect, useState } from "react";
import WebSocketClient from "@/lib/websocket";
import type { TelemetryWebSocketMessage } from "@/types";

export const useWebSocket = (deviceId: string, token: string) => {
  type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
  const [telemetryData, setTelemetryData] = useState<TelemetryWebSocketMessage['data'][]>([]);
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId || !token) return;

    // Preferir entorno local por defecto; se puede sobrescribir vía NEXT_PUBLIC_WS_URL
    const client = new WebSocketClient(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws");
    client.connect(deviceId, token);
    setWsClient(client);

    const handleTelemetry = (data: TelemetryWebSocketMessage['data']) => {
      setTelemetryData((prev) => [...prev.slice(-50), data]); // solo últimos 50
    };
    const handleStatus = (st: ConnectionStatus) => {
      setStatus(st);
      if (st !== 'error') setLastError(null);
    };
    const handleError = (err: any) => {
      setLastError(typeof err?.message === 'string' ? err.message : 'Fallo de WebSocket');
    };

    client.on("telemetry", handleTelemetry);
    client.on("status", handleStatus);
    client.on("error", handleError);

    return () => {
      client.off("telemetry", handleTelemetry);
      client.off("status", handleStatus);
      client.off("error", handleError);
      client.disconnect();
    };
  }, [deviceId, token]);

  return { telemetryData, wsClient, status, lastError };
};
