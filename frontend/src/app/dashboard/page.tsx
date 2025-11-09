'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { dashboardApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cpu, Activity, Terminal, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import Galaxy from '@/components/ui/Galaxy';
import type { DashboardStats } from '@/types';
import { RealtimeChart } from "@/components/telemetry/RealtimeChart";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useDevices } from "@/hooks/useDevices";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { devices } = useDevices();
  const { accessToken } = useAuthStore();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  // Llamar hooks siempre en el mismo orden: useWebSocket no debe ser condicional
  const { telemetryData, status, wsClient, lastError } = useWebSocket(selectedDevice || "", accessToken || "");

  // Inicializar dispositivo seleccionado
  useEffect(() => {
    if (!selectedDevice && devices && devices.length > 0) {
      setSelectedDevice(devices[0].id);
    }
  }, [devices, selectedDevice]);

  // Cargar estadísticas del dashboard
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch (err: any) {
        console.error('Error al cargar estadísticas:', err);
        setError(err.response?.data?.message || 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Obtener saludo según la hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero con Galaxy */}
      <div className="relative w-full h-56 rounded-2xl overflow-hidden">
        <Galaxy />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />
        <div className="absolute inset-0 flex flex-col justify-center px-6">
          <h1 className="text-3xl font-bold text-white">
            {getGreeting()}, {user?.first_name || user?.username}! 👋
          </h1>
          <p className="text-white/80 mt-1">
            Resumen de tu plataforma IoT
          </p>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Dispositivos */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Dispositivos
            </CardTitle>
            <Cpu className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_devices || 0}</div>
            <p className="text-xs text-white/70 mt-1">
              {stats?.active_devices || 0} activos
            </p>
          </CardContent>
        </Card>

        {/* Dispositivos Online */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dispositivos Online
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {stats?.online_devices || 0}
            </div>
            <div className="flex items-center text-xs text-white/70 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              {stats?.offline_devices || 0} offline
            </div>
          </CardContent>
        </Card>

        {/* Telemetría Reciente */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Telemetría (24h)
            </CardTitle>
            <Terminal className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.recent_telemetry_24h || 0}
            </div>
            <p className="text-xs text-white/70 mt-1">
              Registros recibidos
            </p>
          </CardContent>
        </Card>

        {/* Alertas Activas */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas Activas
            </CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              {stats?.active_alerts || 0}
            </div>
            <p className="text-xs text-white/70 mt-1">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dispositivos por Tipo */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Dispositivos por Tipo</CardTitle>
          <CardDescription>
            Distribución de tus dispositivos IoT
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats?.devices_by_type && stats.devices_by_type.length > 0 ? (
              stats.devices_by_type.map((item) => (
                <Badge key={item.device_type} variant="secondary" className="text-sm">
                  {item.device_type}: {item.count}
                </Badge>
              ))
            ) : (
              <p className="text-white/70 text-sm">No hay dispositivos registrados</p>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Selector de dispositivo y estado de conexión WS */}
      {accessToken && devices && devices.length > 0 && (
        <div className="mt-6 space-y-4">
          <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Real</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {status === 'connected' && 'WS: Conectado'}
                {status === 'connecting' && 'WS: Conectando...'}
                {status === 'error' && 'WS: Error'}
                {status === 'disconnected' && 'WS: Desconectado'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <select
                  className="w-full sm:w-72 bg-black/60 text-white border-white/10 rounded-md px-3 py-2"
                  value={selectedDevice || ''}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                >
                  {devices.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name || d.id}</option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                  onClick={() => {
                    if (wsClient && selectedDevice && accessToken) {
                      wsClient.disconnect();
                      wsClient.connect(selectedDevice, accessToken);
                    }
                  }}
                >
                  Reconectar
                </Button>
                {lastError && (
                  <span className="text-xs text-red-400">{lastError}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gráfica en Tiempo Real */}
          {selectedDevice ? (
            <RealtimeChart telemetryData={telemetryData} />
          ) : (
            <div className="p-6 text-white/70 text-sm">Selecciona un dispositivo para ver datos en tiempo real.</div>
          )}
        </div>
      )}
      {/* Actividad Reciente */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimos eventos en tu plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600/20 p-2 rounded-lg">
                  <Activity className="h-4 w-4 text-blue-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Telemetría recibida</p>
                  <p className="text-xs text-white/70">Hace 2 minutos</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-green-600/20 p-2 rounded-lg">
                  <Cpu className="h-4 w-4 text-green-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Dispositivo conectado</p>
                  <p className="text-xs text-white/70">Hace 15 minutos</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-orange-600/20 p-2 rounded-lg">
                  <Bell className="h-4 w-4 text-orange-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nueva alerta generada</p>
                  <p className="text-xs text-white/70">Hace 1 hora</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Comandos Recientes</CardTitle>
            <CardDescription>
              Últimos comandos enviados (24h)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Terminal className="h-12 w-12 text-white/70 mx-auto mb-2" />
              <p className="text-sm text-white/70">
                {stats?.recent_commands_24h || 0} comandos enviados en las últimas 24 horas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
