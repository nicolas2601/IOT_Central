"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Terminal } from "lucide-react";
import { useCommands } from "@/hooks/useCommands";
import { openErrorModal } from "@/store/errorStore";

interface CommandPanelProps {
  deviceId: string;
}

export const CommandPanel = ({ deviceId }: CommandPanelProps) => {
  const { commands, isLoading, sendCommand, getStatus } = useCommands(deviceId);
  const [command, setCommand] = useState("");
  const [response, setResponse] = useState<any>(null);

  const handleSend = async () => {
    if (!command.trim()) return;
    try {
      const result = await sendCommand.mutateAsync({
        deviceId,
        command,
      });
      setResponse(result);
      setCommand("");
    } catch (err) {
      console.error("Error enviando comando:", err);
      const description = (err as any)?.response?.data?.message || (err as any)?.message || "Intenta nuevamente";
      openErrorModal("Error al enviar comando", description);
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-blue-600" />
          Comandos del Dispositivo
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Escribe un comando (ej: RESTART)"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
          />
          <Button onClick={handleSend} disabled={sendCommand.isPending}>
            {sendCommand.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="ml-2">Enviar</span>
          </Button>
        </div>

        {response && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
            <strong>Respuesta:</strong> {JSON.stringify(response, null, 2)}
          </div>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <p className="text-gray-500 text-sm">Cargando comandos...</p>
          ) : commands.length > 0 ? (
            commands.map((cmd: any) => (
              <div
                key={cmd.id}
                className="flex items-center justify-between p-2 border rounded-md bg-white hover:bg-gray-50"
              >
                <div>
                  <p className="font-semibold text-sm">{cmd.command}</p>
                  <p className="text-xs text-gray-500">
                    {cmd.timestamp || "Sin fecha"}
                  </p>
                </div>
                <Badge
                  variant={
                    cmd.status === "completed"
                      ? "default"
                      : cmd.status === "error"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {cmd.status}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No hay comandos aún.</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="text-xs text-gray-400">
        Usa este panel para probar comandos de control remoto (IoT).
      </CardFooter>
    </Card>
  );
};
