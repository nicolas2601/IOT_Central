"use client";
import { useEffect, useState } from "react";
import WebSocketClient from "@/lib/websocket";

export const useWebSocket = (deviceId: string, token: string) => {
  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  useEffect(() => {
    if (!deviceId || !token) return;

    const client = new WebSocketClient(process.env.NEXT_PUBLIC_WS_URL || "wss://iot-central.onrender.com/ws");
    client.connect(deviceId, token);
    setWsClient(client);

    const handleTelemetry = (data: any) => {
      setTelemetryData((prev) => [...prev.slice(-50), data]); // solo últimos 50
    };
    const handleStatus = (st: any) => {
      setStatus(st);
    };

    client.on("telemetry", handleTelemetry);
    client.on("status", handleStatus);

    return () => {
      client.off("telemetry", handleTelemetry);
      client.off("status", handleStatus);
      client.disconnect();
    };
  }, [deviceId, token]);

  return { telemetryData, wsClient, status };
};
