"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface TelemetryTemplateModalProps {
  open: boolean;
  onClose: () => void;
  deviceName: string;
  templateJson: string;
}

export default function TelemetryTemplateModal({ open, onClose, deviceName, templateJson }: TelemetryTemplateModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(templateJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Error copiando al portapapeles", e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[80vh] overflow-y-auto bg-black/60 border-white/10 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Plantilla de Telemetría</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-white/80">Dispositivo</Label>
            <p className="text-white font-semibold">{deviceName}</p>
            <p className="text-white/70 text-sm">Usa este JSON como referencia para estructurar tu telemetría.</p>
          </div>

          <div className="rounded-md bg-black/50 border border-white/10">
            <pre className="p-3 text-xs sm:text-sm text-white whitespace-pre-wrap break-words">{templateJson}</pre>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white" onClick={handleCopy}>
            {copied ? "¡Copiado!" : "Copiar JSON"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}