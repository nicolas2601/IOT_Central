"use client";
import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildTelemetryTemplate } from "@/lib/telemetryTemplate";
import type { DeviceTemplate } from "@/lib/deviceTemplates";

interface TelemetryTemplatePanelProps {
  deviceName: string;
  template: DeviceTemplate;
}

export default function TelemetryTemplatePanel({ deviceName, template }: TelemetryTemplatePanelProps) {
  const templateJson = useMemo(() => buildTelemetryTemplate(template, deviceName), [template, deviceName]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(templateJson);
    } catch (e) {
      console.error("Error al copiar la plantilla", e);
    }
  };

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Telemetría personalizada recomendada para ejecución</CardTitle>
          <CardDescription>
            Generada según la plantilla asociada al dispositivo
          </CardDescription>
        </div>
        <Button variant="outline" onClick={handleCopy}>Copiar JSON</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-white/70">
            Dispositivo: <b>{deviceName}</b>
          </p>
          <pre className="text-xs bg-black/60 border border-white/10 rounded p-3 overflow-x-auto max-h-[320px]">
            {templateJson}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}