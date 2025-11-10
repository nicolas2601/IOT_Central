"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { ShinyText } from "@/components/animations/ShinyText";
import { TextType } from "@/components/animations/TextType";
import { FadeContent } from "@/components/animations/FadeContent";
import { ClickSpark } from "@/components/animations/ClickSpark";
import { StarBorder } from "@/components/animations/StarBorder";
import { AnimatedContent } from "@/components/animations/AnimatedContent";

export default function SettingsPage() {
  const { user, accessToken } = useAuthStore();

  // Local UI state (persistencia opcional futura)
  const [theme, setTheme] = useState<string>("system");
  const [telemetryRate, setTelemetryRate] = useState<number>(1000);
  const [smooth, setSmooth] = useState<boolean>(true);
  const [defaultDevice, setDefaultDevice] = useState<string>("");

  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "", []);
  const wsUrl = useMemo(() => process.env.NEXT_PUBLIC_WS_URL || "", []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <ShinyText as="h1" className="text-3xl font-bold">Configuración</ShinyText>
        <TextType text="Ajusta tu experiencia, apariencia y conexión" className="text-sm text-white/80" />
      </div>

      {/* Perfil y autenticación */}
      <AnimatedContent>
        <ClickSpark>
          <Card id="perfil" className="bg-black/40 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Perfil</CardTitle>
              <CardDescription>Información básica de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/70">Usuario</label>
                  <Input readOnly value={user?.username || "Invitado"} className="bg-black/60 text-white border-white/10" />
                </div>
                <div>
                  <label className="text-sm text-white/70">Email</label>
                  <Input readOnly value={user?.email || "-"} className="bg-black/60 text-white border-white/10" />
                </div>
                {user?.role === 'admin' && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-white/70">Access Token</label>
                    <div className="flex gap-2">
                      <Input readOnly value={accessToken ? `${accessToken.slice(0, 12)}…` : "No disponible"} className="bg-black/60 text-white border-white/10" />
                      <Button
                        variant="secondary"
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                        onClick={() => navigator.clipboard.writeText(accessToken || "")}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ClickSpark>
      </AnimatedContent>

      {/* Apariencia */}
      <FadeContent>
        <StarBorder>
          <div className="bg-black/40 border-white/10 backdrop-blur-xl rounded-xl p-2">
            <Card className="bg-transparent border-transparent">
              <CardHeader>
                <CardTitle className="text-white">Apariencia</CardTitle>
                <CardDescription>Selecciona el tema de la interfaz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-white/70">Tema</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-full bg-black/60 text-white border-white/10 rounded-md px-3 py-2"
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Oscuro</option>
                      <option value="system">Sistema</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </StarBorder>
      </FadeContent>

      {/* Conexión API/WS */}
      {user?.role === 'admin' && (
        <AnimatedContent delay={50}>
          <ClickSpark>
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Conexión</CardTitle>
                <CardDescription>URLs actuales de API y WebSocket</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/70">API URL</label>
                    <Input readOnly value={apiUrl || "-"} className="bg-black/60 text-white border-white/10" />
                  </div>
                  <div>
                    <label className="text-sm text-white/70">WS URL</label>
                    <Input readOnly value={wsUrl || "-"} className="bg-black/60 text-white border-white/10" />
                  </div>
                </div>
                <p className="text-xs text-white/50">Se configuran vía variables de entorno `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_WS_URL`.</p>
              </CardContent>
            </Card>
          </ClickSpark>
        </AnimatedContent>
      )}

      {/* Preferencias de Telemetría */}
      <FadeContent>
        <StarBorder>
          <div className="bg-black/40 border-white/10 backdrop-blur-xl rounded-xl p-2">
            <Card className="bg-transparent border-transparent">
              <CardHeader>
                <CardTitle className="text-white">Telemetría</CardTitle>
                <CardDescription>Control de refresco y suavizado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-white/70">Intervalo (ms)</label>
                    <Input type="number" min={200} step={100} value={telemetryRate} onChange={(e) => setTelemetryRate(parseInt(e.target.value || "1000"))} className="bg-black/60 text-white border-white/10" />
                  </div>
                  <div className="flex items-center gap-3">
                    <input id="smooth" type="checkbox" checked={smooth} onChange={(e) => setSmooth(e.target.checked)} />
                    <label htmlFor="smooth" className="text-sm text-white/80">Suavizado de curvas</label>
                  </div>
                  <div>
                    <label className="text-sm text-white/70">Dispositivo por defecto</label>
                    <Input value={defaultDevice} onChange={(e) => setDefaultDevice(e.target.value)} placeholder="ID del dispositivo" className="bg-black/60 text-white border-white/10" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button className="bg-primary text-primary-foreground">Guardar preferencias</Button>
                  <Button variant="outline" className="border-white/20 text-white">Restablecer</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </StarBorder>
      </FadeContent>
    </div>
  );
}