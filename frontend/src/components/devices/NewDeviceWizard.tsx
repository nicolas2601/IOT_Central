"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEVICE_TEMPLATES, DeviceTemplate } from "@/lib/deviceTemplates";

// Perfiles de telemetría comunes con métricas sugeridas
type Profile =
  | "general"
  | "agua"
  | "aire"
  | "energia"
  | "ambiental"
  | "industrial"
  | "seguridad"
  | "gps"
  | "agricultura";

const PROFILE_SUGGESTIONS: Record<Profile, Array<{ displayName: string; name: string; type: 'number' | 'boolean' | 'string'; unit?: string; min?: number; max?: number }>> = {
  general: [
    { displayName: "Temperatura", name: "temperature", type: "number", unit: "°C", min: -40, max: 85 },
    { displayName: "Humedad", name: "humidity", type: "number", unit: "%", min: 0, max: 100 },
  ],
  agua: [
    { displayName: "pH", name: "ph", type: "number", min: 0, max: 14 },
    { displayName: "Turbidez", name: "turbidity", type: "number", unit: "NTU", min: 0, max: 100 },
    { displayName: "Temperatura", name: "water_temperature", type: "number", unit: "°C", min: 0, max: 50 },
    { displayName: "Nivel de agua", name: "water_level", type: "number", unit: "%", min: 0, max: 100 },
    { displayName: "Conductividad", name: "conductivity", type: "number", unit: "µS/cm", min: 0, max: 5000 },
    { displayName: "Oxígeno disuelto", name: "dissolved_oxygen", type: "number", unit: "mg/L", min: 0, max: 20 },
    { displayName: "ORP", name: "orp", type: "number", unit: "mV", min: -1000, max: 1000 },
    { displayName: "Salinidad", name: "salinity", type: "number", unit: "ppt", min: 0, max: 40 },
    { displayName: "Presión", name: "pressure", type: "number", unit: "bar", min: 0, max: 10 },
    { displayName: "Caudal", name: "flow_rate", type: "number", unit: "L/min", min: 0, max: 1000 },
  ],
  aire: [
    { displayName: "PM2.5", name: "pm25", type: "number", unit: "µg/m³", min: 0, max: 500 },
    { displayName: "PM10", name: "pm10", type: "number", unit: "µg/m³", min: 0, max: 1000 },
    { displayName: "CO2", name: "co2", type: "number", unit: "ppm", min: 400, max: 5000 },
    { displayName: "TVOC", name: "tvoc", type: "number", unit: "ppb", min: 0, max: 1200 },
    { displayName: "Temperatura", name: "temperature", type: "number", unit: "°C", min: -40, max: 85 },
    { displayName: "Humedad", name: "humidity", type: "number", unit: "%", min: 0, max: 100 },
    { displayName: "Presión", name: "barometric_pressure", type: "number", unit: "hPa", min: 300, max: 1100 },
  ],
  energia: [
    { displayName: "Voltaje", name: "voltage", type: "number", unit: "V", min: 0, max: 260 },
    { displayName: "Corriente", name: "current", type: "number", unit: "A", min: 0, max: 100 },
    { displayName: "Potencia activa", name: "active_power", type: "number", unit: "kW", min: 0, max: 30 },
    { displayName: "Potencia reactiva", name: "reactive_power", type: "number", unit: "kVAr", min: 0, max: 30 },
    { displayName: "Factor de potencia", name: "power_factor", type: "number", min: 0, max: 1 },
    { displayName: "Frecuencia", name: "frequency", type: "number", unit: "Hz", min: 45, max: 65 },
    { displayName: "Energía acumulada", name: "energy_kwh", type: "number", unit: "kWh", min: 0, max: 100000 },
  ],
  ambiental: [
    { displayName: "Temperatura", name: "temperature", type: "number", unit: "°C", min: -40, max: 60 },
    { displayName: "Humedad", name: "humidity", type: "number", unit: "%", min: 0, max: 100 },
    { displayName: "Presión", name: "pressure", type: "number", unit: "hPa", min: 300, max: 1100 },
    { displayName: "Lluvia", name: "rain", type: "number", unit: "mm", min: 0, max: 500 },
    { displayName: "Velocidad del viento", name: "wind_speed", type: "number", unit: "m/s", min: 0, max: 60 },
    { displayName: "Dirección del viento", name: "wind_direction", type: "number", unit: "°", min: 0, max: 360 },
    { displayName: "Radiación solar", name: "solar_radiation", type: "number", unit: "W/m²", min: 0, max: 1500 },
    { displayName: "Índice UV", name: "uv_index", type: "number", min: 0, max: 15 },
  ],
  industrial: [
    { displayName: "Vibración RMS", name: "vibration_rms", type: "number", unit: "mm/s", min: 0, max: 50 },
    { displayName: "Aceleración", name: "acceleration", type: "number", unit: "g", min: 0, max: 20 },
    { displayName: "Temperatura motor", name: "motor_temperature", type: "number", unit: "°C", min: 0, max: 150 },
    { displayName: "RPM", name: "rpm", type: "number", unit: "rpm", min: 0, max: 3000 },
    { displayName: "Corriente", name: "motor_current", type: "number", unit: "A", min: 0, max: 50 },
    { displayName: "Estado", name: "status", type: "boolean" },
  ],
  seguridad: [
    { displayName: "Movimiento", name: "motion", type: "boolean" },
    { displayName: "Puerta abierta", name: "door_open", type: "boolean" },
    { displayName: "Humo", name: "smoke", type: "number", unit: "ppm", min: 0, max: 500 },
    { displayName: "Gas", name: "gas", type: "number", unit: "ppm", min: 0, max: 10000 },
    { displayName: "Sonido", name: "sound", type: "number", unit: "dB", min: 30, max: 120 },
    { displayName: "Luz", name: "light", type: "number", unit: "lux", min: 0, max: 100000 },
  ],
  gps: [
    { displayName: "Latitud", name: "lat", type: "number", min: -90, max: 90 },
    { displayName: "Longitud", name: "lon", type: "number", min: -180, max: 180 },
    { displayName: "Velocidad", name: "speed", type: "number", unit: "km/h", min: 0, max: 200 },
    { displayName: "Altitud", name: "alt", type: "number", unit: "m", min: -500, max: 9000 },
    { displayName: "Precisión", name: "accuracy", type: "number", unit: "m", min: 0, max: 100 },
  ],
  agricultura: [
    { displayName: "Humedad del suelo", name: "soil_moisture", type: "number", unit: "%", min: 0, max: 100 },
    { displayName: "Temperatura del suelo", name: "soil_temperature", type: "number", unit: "°C", min: -20, max: 50 },
    { displayName: "Conductividad del suelo", name: "soil_ec", type: "number", unit: "mS/cm", min: 0, max: 10 },
    { displayName: "pH del suelo", name: "soil_ph", type: "number", min: 0, max: 14 },
  ],
};

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
  const [profile, setProfile] = useState<Profile>("general");
  const [customFields, setCustomFields] = useState<Array<{
    displayName: string;
    name: string;
    unit?: string;
    type?: 'number' | 'boolean' | 'string';
    min?: number;
    max?: number;
    notes?: string;
  }>>([]);

  const reset = () => {
    setStep(1);
    setMode(null);
    setSelectedTemplate(null);
    setName("");
    setDescription("");
    setSimulateServer(false);
    setProfile("general");
    setCustomFields([]);
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
      } else {
        basePayload.metadata = {
          customTelemetry: {
            profile,
            properties: customFields,
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
      {mode === "custom" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <Label className="text-white">Perfil de telemetría</Label>
              <select
                className="w-full bg-black/50 border border-white/10 rounded p-2 text-white"
                value={profile}
                onChange={(e) => setProfile(e.target.value as any)}
              >
                <option value="general">General</option>
                <option value="agua">Agua</option>
                <option value="aire">Aire</option>
                <option value="energia">Energía</option>
                <option value="ambiental">Ambiental</option>
                <option value="industrial">Industrial</option>
                <option value="seguridad">Seguridad</option>
                <option value="gps">GPS/Tracking</option>
                <option value="agricultura">Agricultura</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-white">Métricas de telemetría</Label>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-500 text-white"
              onClick={() => {
                // Añadir métrica con sugerencias según perfil
                const suggestion = PROFILE_SUGGESTIONS[profile]?.[0];
                const next = suggestion || { displayName: '', name: '', type: 'number' as const, unit: undefined, min: 0, max: 100 };
                setCustomFields((arr) => [...arr, next]);
              }}
            >
              Agregar métrica
            </Button>
            <Button
              type="button"
              className="ml-2 bg-violet-600 hover:bg-violet-500 text-white"
              onClick={() => {
                const list = PROFILE_SUGGESTIONS[profile] || [];
                setCustomFields((arr) => {
                  const names = new Set(arr.map((a) => a.name));
                  const toAdd = list.filter((s) => s.name && !names.has(s.name));
                  return [...arr, ...toAdd];
                });
              }}
            >
              Agregar métricas sugeridas
            </Button>
          </div>
          <div className="space-y-2">
            {customFields.length === 0 && (
              <p className="text-sm text-white/70">
                Añade al menos una métrica con límites. Perfiles disponibles: General, Agua, Aire, Energía, Ambiental, Industrial, Seguridad, GPS y Agricultura. Usa “Agregar métricas sugeridas” para autocompletar métricas típicas del perfil.
              </p>
            )}
            {customFields.map((f, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end bg-black/30 border border-white/10 rounded p-2">
                <div>
                  <Label className="text-white">Nombre</Label>
                  <Input value={f.name} onChange={(e) => {
                    const v = e.target.value;
                    setCustomFields((arr) => arr.map((it, i) => i === idx ? { ...it, name: v } : it));
                  }} placeholder="temperature" />
                </div>
                <div>
                  <Label className="text-white">Etiqueta</Label>
                  <Input value={f.displayName} onChange={(e) => {
                    const v = e.target.value;
                    setCustomFields((arr) => arr.map((it, i) => i === idx ? { ...it, displayName: v } : it));
                  }} placeholder="Temperatura" />
                </div>
                <div>
                  <Label className="text-white">Tipo</Label>
                  <select
                    className="w-full bg-black/50 border border-white/10 rounded p-2 text-white"
                    value={f.type || 'number'}
                    onChange={(e) => {
                      const v = e.target.value as any;
                      setCustomFields((arr) => arr.map((it, i) => i === idx ? { ...it, type: v } : it));
                    }}
                  >
                    <option value="number">Número</option>
                    <option value="boolean">Booleano</option>
                    <option value="string">Texto</option>
                  </select>
                </div>
                <div>
                  <Label className="text-white">Unidad</Label>
                  <Input value={f.unit || ''} onChange={(e) => {
                    const v = e.target.value;
                    setCustomFields((arr) => arr.map((it, i) => i === idx ? { ...it, unit: v } : it));
                  }} placeholder="°C, %, NTU" />
                </div>
                <div>
                  <Label className="text-white">Mín</Label>
                  <Input type="number" value={typeof f.min === 'number' ? f.min : ''} onChange={(e) => {
                    const v = e.target.value;
                    setCustomFields((arr) => arr.map((it, i) => i === idx ? { ...it, min: v === '' ? undefined : Number(v) } : it));
                  }} placeholder={profile === 'agua' ? '0' : '0'} />
                </div>
                <div>
                  <Label className="text-white">Máx</Label>
                  <Input type="number" value={typeof f.max === 'number' ? f.max : ''} onChange={(e) => {
                    const v = e.target.value;
                    setCustomFields((arr) => arr.map((it, i) => i === idx ? { ...it, max: v === '' ? undefined : Number(v) } : it));
                  }} placeholder={profile === 'agua' ? '50' : '100'} />
                </div>
              </div>
            ))}
          </div>
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
            disabled={step === 1 && !mode || step === 2 && !selectedTemplate || step === 3 && mode === 'custom' && customFields.length === 0}
          >
            {step < 3 ? "Continuar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}