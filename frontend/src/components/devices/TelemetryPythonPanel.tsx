"use client";
import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TelemetryField } from "@/lib/telemetryPython";
import { buildPythonSimulatorScript } from "@/lib/telemetryPython";

interface TelemetryPythonPanelProps {
  deviceId: string;
  deviceName: string;
  properties: TelemetryField[];
}

export default function TelemetryPythonPanel({ deviceId, deviceName, properties }: TelemetryPythonPanelProps) {
  const pythonScript = useMemo(() => buildPythonSimulatorScript(properties, deviceId), [properties, deviceId]);

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
            Ejecuta localmente con el ID del dispositivo; conecta al broker de la nube.
          </CardDescription>
        </div>
        <Button variant="outline" onClick={handleCopy}>Copiar Script</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-white/70">
            Dispositivo: <b>{deviceName}</b>
          </p>
          <div className="text-xs text-white/80 space-y-2">
            <p><b>Requisitos:</b> Python 3.8+, librería <code>paho-mqtt</code>, conexión a internet.</p>
            <p className="text-white/90 font-semibold mt-2">Desde 0 (Windows CMD)</p>
            <pre className="bg-black/50 border border-white/10 rounded p-2 whitespace-pre-wrap">{`
cd "C:\\ruta\\donde\\quieres\\trabajar"
py -m venv venv
venv\\Scripts\\activate.bat
python -m pip install --upgrade pip
python -m pip install paho-mqtt
python simular_telemetria.py --device-id ${deviceId} --broker-host iotcentral.duckdns.org --broker-port 1883 --interval 4
`}</pre>
            <p className="text-white/70">Nota: si tu carpeta tiene espacios/acentos (ej. "Más Carpetas"), usa comillas como en el <code>cd</code>. El broker está en la nube, asegúrate de tener conexión a internet.</p>

            <p className="text-white/90 font-semibold mt-2">PowerShell (alternativa)</p>
            <pre className="bg-black/50 border border-white/10 rounded p-2 whitespace-pre-wrap">{`
cd "C:\\ruta\\donde\\quieres\\trabajar"
python -m venv venv
venv\\Scripts\\Activate.ps1
python -m pip install --upgrade pip
python -m pip install paho-mqtt
python .\\simular_telemetria.py --device-id ${deviceId} --broker-host iotcentral.duckdns.org --broker-port 1883 --interval 4
`}</pre>
            <p className="text-white/70">Si PowerShell bloquea la activación, ejecuta (como usuario): <code>Set-ExecutionPolicy RemoteSigned -Scope CurrentUser</code>. El broker está en la nube.</p>

            <p className="text-white/90 font-semibold mt-2">Linux / macOS</p>
            <pre className="bg-black/50 border border-white/10 rounded p-2 whitespace-pre-wrap">{`
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install paho-mqtt
python simular_telemetria.py --device-id ${deviceId} --broker-host iotcentral.duckdns.org --broker-port 1883 --interval 4
`}</pre>

            <p className="text-white/90 font-semibold mt-2">Verificar broker (opcional)</p>
            <pre className="bg-black/50 border border-white/10 rounded p-2 whitespace-pre-wrap">{`
mosquitto_sub -t dispositivo/${deviceId}/telemetria -h iotcentral.duckdns.org -p 1883
`}</pre>
            <p className="text-white/70">En otra ventana ejecuta el simulador; deberías ver mensajes JSON publicados desde la nube.</p>

            <p className="text-white/90 font-semibold mt-2">Errores comunes</p>
            <ul className="list-disc pl-5 text-white/70 space-y-1">
              <li>Usa siempre <code>python -m pip</code> en lugar de <code>pip</code> para evitar errores de launcher.</li>
              <li>Si no conecta al broker, verifica que tienes conexión a internet y que <code>iotcentral.duckdns.org:1883</code> es accesible.</li>
              <li>Si tu antivirus/firewall bloquea MQTT, habilita la conexión a iotcentral.duckdns.org puerto 1883.</li>
            </ul>

            <p className="text-white/80 mt-2">Comando final (rápido):</p>
            <pre className="bg-black/50 border border-white/10 rounded p-2 whitespace-pre-wrap">{`python simular_telemetria.py --device-id ${deviceId} --broker-host iotcentral.duckdns.org --broker-port 1883 --interval 4`}</pre>
          </div>
          <pre className="text-xs bg-black/60 border border-white/10 rounded p-3 overflow-x-auto max-h-[420px] whitespace-pre-wrap">
{pythonScript}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}