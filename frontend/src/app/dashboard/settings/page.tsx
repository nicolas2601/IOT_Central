"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { authApi } from "@/services/api";
import { ShinyText } from "@/components/animations/ShinyText";
import { TextType } from "@/components/animations/TextType";
import { FadeContent } from "@/components/animations/FadeContent";
import { ClickSpark } from "@/components/animations/ClickSpark";
import { StarBorder } from "@/components/animations/StarBorder";
import { AnimatedContent } from "@/components/animations/AnimatedContent";
import { Edit } from "lucide-react";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { openErrorModal } from "@/store/errorStore";

export default function SettingsPage() {
  const { user, accessToken, setUser, setProfileOverrides } = useAuthStore();
  const {
    theme,
    telemetryRate,
    smooth,
    defaultDevice,
    setTheme,
    setTelemetryRate,
    setSmooth,
    setDefaultDevice,
    reset,
  } = useSettingsStore();

  // Estado de edición (modal)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "", []);
  const wsUrl = useMemo(() => process.env.NEXT_PUBLIC_WS_URL || "", []);

  // Cargar perfil actualizado al entrar
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const p = await authApi.getProfile();
        setUser(p);
      } catch (_) {
        // silencioso: la UI sigue mostrando valores actuales
      } finally {
        setIsLoadingProfile(false);
      }
    };
    loadProfile();
    // Aplicar tema al documento
    try {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      if (theme === "light") root.classList.add("light");
      else if (theme === "dark") root.classList.add("dark");
    } catch (_) {}
  }, []);

  // Re-aplicar tema cuando cambie
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      if (theme === "light") root.classList.add("light");
      else if (theme === "dark") root.classList.add("dark");
    } catch (_) {}
  }, [theme]);

  const handleSaveProfile = async (data: any) => {
    // Actualización optimista y persistente en la UI (overrides locales)
    if (user) {
      setUser({ ...user, ...data });
    }
    setProfileOverrides(data);
    try {
      const updated = await authApi.updateProfile(data);
      // Refrescar desde servidor para asegurar consistencia del store
      try {
        const fresh = await authApi.getProfile();
        setUser(fresh);
        // Servidor confirmó: limpiar overrides locales
        setProfileOverrides(null);
      } catch (_) {
        setUser(updated);
        setProfileOverrides(null);
      }
    } catch (e: any) {
      // Mantener overrides locales y notificar error del servidor
      const status = e?.response?.status;
      const details = typeof e?.response?.data === 'string' ? e.response.data : JSON.stringify(e?.response?.data ?? {});
      const title = status === 400 ? 'Datos inválidos' : 'Error al guardar perfil';
      const message = status ? `El servidor respondió con ${status}.` : 'No se pudo contactar el servidor.';
      try { openErrorModal(title, message, details); } catch (_) {}
      // No revertimos: se respetan los cambios locales
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <ShinyText as="h1" className="text-3xl font-bold">Configuración</ShinyText>
        <br />
        <TextType text="Ajusta tu experiencia, apariencia y conexión" className="text-sm text-white/80" />
      </div>

      {/* Perfil y autenticación */}
      <AnimatedContent>
        <ClickSpark>
          <Card id="perfil" className="bg-black/40 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Perfil</CardTitle>
                <CardDescription>Información básica de tu cuenta</CardDescription>
              </div>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                aria-label="Editar perfil"
                onClick={() => setIsEditOpen(true)}
              >
                <Edit className="w-4 h-4 mr-2" /> Editar
              </Button>
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
                <div>
                  <label className="text-sm text-white/70">Nombre</label>
                  <Input readOnly value={user?.first_name || ""} className="bg-black/60 text-white border-white/10" />
                </div>
                <div>
                  <label className="text-sm text-white/70">Apellido</label>
                  <Input readOnly value={user?.last_name || ""} className="bg-black/60 text-white border-white/10" />
                </div>
                <div>
                  <label className="text-sm text-white/70">Teléfono</label>
                  <Input readOnly value={user?.phone || ""} className="bg-black/60 text-white border-white/10" />
                </div>
                <div>
                  <label className="text-sm text-white/70">Empresa</label>
                  <Input readOnly value={user?.company_name || ""} className="bg-black/60 text-white border-white/10" />
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

      {/* Modal de edición de perfil */}
      <ProfileEditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        user={user || null}
        onSave={handleSaveProfile}
      />

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
                      onChange={(e) => setTheme(e.target.value as any)}
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
                  <Button onClick={() => { /* preferencias ya están persistidas vía setters */ }} className="bg-primary text-primary-foreground">Guardar preferencias</Button>
                  <Button variant="outline" onClick={reset} className="border-white/20 text-white">Restablecer</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </StarBorder>
      </FadeContent>
    </div>
  );
}