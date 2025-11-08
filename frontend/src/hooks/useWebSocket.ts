"use client";
import { useEffect, useState } from "react";
import WebSocketClient from "@/lib/websocket";

export const useWebSocket = (deviceId: string, token: string) => {
  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);

  useEffect(() => {
    if (!deviceId || !token) return;

    const client = new WebSocketClient(process.env.NEXT_PUBLIC_WS_URL || "wss://iot-central.onrender.com/ws");
    client.connect(deviceId, token);
    setWsClient(client);

    const handleTelemetry = (data: any) => {
      setTelemetryData((prev) => [...prev.slice(-50), data]); // solo últimos 50
    };

    client.on("telemetry", handleTelemetry);

    return () => {
      client.off("telemetry", handleTelemetry);
      client.disconnect();
    };
  }, [deviceId, token]);

  return { telemetryData, wsClient };
};
