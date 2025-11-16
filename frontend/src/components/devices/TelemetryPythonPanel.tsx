"use client";
import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DeviceTemplate } from "@/lib/deviceTemplates";
import { buildPythonSimulatorScript } from "@/lib/telemetryPython";

interface TelemetryPythonPanelProps {
  deviceId: string;
  deviceName: string;
  template: DeviceTemplate;
}

export default function TelemetryPythonPanel({ deviceId, deviceName, template }: TelemetryPythonPanelProps) {
  const pythonScript = useMemo(() => buildPythonSimulatorScript(template, deviceId), [template, deviceId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pythonScript);
    } catch (e) {
      console.error("Error al copiar el script", e);
    }
  };

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Script Python de simulación de telemetría</CardTitle>
          <CardDescription>
            Recomendado para ejecutar localmente con el ID del dispositivo
          </CardDescription>
        </div>
        <Button variant="outline" onClick={handleCopy}>Copiar Script</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-white/70">
            Dispositivo: <b>{deviceName}</b>
          </p>
          <pre className="text-xs bg-black/60 border border-white/10 rounded p-3 overflow-x-auto max-h-[420px] whitespace-pre-wrap">
{pythonScript}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}