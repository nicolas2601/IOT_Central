"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEVICE_TEMPLATES, DeviceTemplate } from "@/lib/deviceTemplates";

interface NewDeviceWizardProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}

type Mode = "template" | "custom" | null;

export default function NewDeviceWizard({ open, onClose, onCreate }: NewDeviceWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<Mode>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DeviceTemplate | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [simulateServer, setSimulateServer] = useState<boolean>(false);

  const reset = () => {
    setStep(1);
    setMode(null);
    setSelectedTemplate(null);
    setName("");
    setDescription("");
    setSimulateServer(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleContinue = () => {
    if (step === 1) {
      setStep(mode === "template" ? 2 : 3);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (!name.trim()) return;

      // Construir payload compatible con el backend actual
      const device_type = (selectedTemplate?.deviceType || "sensor");
      const desc = description.trim();
      const basePayload: any = { name: name.trim(), device_type, description: desc || undefined };
      // Solo enviar metadata si se usa plantilla, para evitar conflictos en backend
      if (selectedTemplate) {
        basePayload.metadata = {
          template: {
            id: selectedTemplate.id,
            name: selectedTemplate.name,
            description: selectedTemplate.description,
            deviceType: selectedTemplate.deviceType,
            properties: selectedTemplate.properties,
            source: "azure-inspired",
          },
          simulation: {
            autoServer: simulateServer,
          },
        };
      }

      onCreate(basePayload);
      close();
    }
  };

  // Render helpers
  const renderStep1 = () => (
    <div className="space-y-4">
      <p className="text-white/80">Elige cómo quieres crear tu dispositivo.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <button
          type="button"
          className={`border rounded-md p-4 text-left bg-black/40 hover:bg-black/30 ${mode === "template" ? "border-blue-500" : "border-white/10"}`}
          onClick={() => setMode("template")}
        >
          <h4 className="text-lg font-semibold text-white">Usar plantilla</h4>
          <p className="text-sm text-white/70">Selecciona una plantilla de modelo (Digital Twin) y crea un dispositivo con su telemetría predefinida.</p>
        </button>
        <button
          type="button"
          className={`border rounded-md p-4 text-left bg-black/40 hover:bg-black/30 ${mode === "custom" ? "border-blue-500" : "border-white/10"}`}
          onClick={() => setMode("custom")}
        >
          <h4 className="text-lg font-semibold text-white">Crear uno propio</h4>
          <p className="text-sm text-white/70">Define un dispositivo sin plantilla. Podrás enviar telemetría libremente.</p>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <Label className="text-white">Plantilla</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DEVICE_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            className={`group relative rounded-lg p-3 text-left transition-colors min-h-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80
            ${selectedTemplate?.id === tpl.id
              ? "border border-blue-500 ring-2 ring-blue-500/80 bg-blue-500/10 shadow-md"
              : "border border-white/20 bg-black/40 hover:bg-black/30 hover:border-blue-400"}`}
            onClick={() => setSelectedTemplate(tpl)}
          >
            {/* Indicador visual sutil en la esquina al seleccionar */}
            <span
              className={`pointer-events-none absolute -top-2 -right-2 inline-block size-3 rounded-full transition-opacity duration-200
              ${selectedTemplate?.id === tpl.id ? "bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.35)] opacity-100" : "opacity-0 group-hover:opacity-50"}`}
            />
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-white">{tpl.name}</h4>
              <span className="text-[10px] text-white/60 uppercase">{tpl.deviceType}</span>
            </div>
            {tpl.description && (
              <p className="text-xs text-white/70 mt-1 max-h-[40px] overflow-hidden">{tpl.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1">
              {tpl.properties.map((p) => (
                <span key={p.name} className="text-[10px] bg-white/10 text-white/80 px-1.5 py-0.5 rounded-md">
                  {p.displayName}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between bg-black/40 border border-white/10 rounded p-3">
        <div>
          <p className="text-sm text-white/90 font-semibold">Simular automáticamente por el servidor</p>
          <p className="text-xs text-white/70">Actívalo si deseas que el servidor simule telemetrías para este dispositivo.</p>
        </div>
        <button
          type="button"
          onClick={() => setSimulateServer((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${simulateServer ? "bg-blue-600" : "bg-white/20"}`}
          aria-pressed={simulateServer}
          aria-label="Toggle simulación automática"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${simulateServer ? "translate-x-5" : "translate-x-1"}`}
          />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-white">Nombre</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Sensor 01" />
      </div>
      <div>
        <Label className="text-white">Descripción</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descripción del dispositivo" />
      </div>
      {mode === "template" && selectedTemplate && (
        <div className="text-sm text-white/70">
          <p>
            Plantilla: <b>{selectedTemplate.name}</b> ({selectedTemplate.deviceType})
          </p>
          <p>
            Simulación automática por el servidor: <b>{simulateServer ? "Activada" : "Desactivada"}</b>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[80vh] overflow-y-auto bg-black/60 border-white/10 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Nuevo dispositivo"}
            {step === 2 && "Selecciona una plantilla"}
            {step === 3 && "Detalles del dispositivo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={close}>Cancelar</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-500 text-white"
            onClick={handleContinue}
            disabled={step === 1 && !mode || step === 2 && !selectedTemplate}
          >
            {step < 3 ? "Continuar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}