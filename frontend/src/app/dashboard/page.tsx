'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { dashboardApi, telemetryApi, alertsApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cpu, Activity, Terminal, Bell, TrendingUp } from 'lucide-react';
import Galaxy from '@/components/ui/Galaxy';
import type { DashboardStats } from '@/types';
import { RealtimeChart } from "@/components/telemetry/RealtimeChart";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useDevices } from "@/hooks/useDevices";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { devices } = useDevices();
  const { accessToken } = useAuthStore();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<Array<{ icon: 'telemetry' | 'connection' | 'alert'; title: string; time: string }>>([]);
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

  // Cargar historial de telemetría para el dispositivo seleccionado (últimos 7 días)
  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedDevice) {
        setHistory([]);
        return;
      }
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const res = await telemetryApi.list({ device: selectedDevice, start_date: sevenDaysAgo });
        const items = res?.results || [];
        setHistory(items.reverse()); // ordenar ascendente por timestamp
      } catch (e) {
        setHistory([]);
      }
    };
    loadHistory();
  }, [selectedDevice]);

  // Cargar actividad reciente real (telemetría, conexión, alertas)
  useEffect(() => {
    const loadRecent = async () => {
      try {
        const events: Array<{ icon: 'telemetry' | 'connection' | 'alert'; title: string; time: string }> = [];

        // Última telemetría del dispositivo seleccionado o del primero
        const deviceId = selectedDevice || (devices?.[0]?.id ?? null);
        if (deviceId) {
          try {
            const latest = await telemetryApi.getLatest(deviceId);
            if (latest?.timestamp) {
              events.push({
                icon: 'telemetry',
                title: `Telemetría recibida (${latest.device_name || deviceId})`,
                time: formatDistanceToNow(new Date(latest.timestamp), { addSuffix: true, locale: es }),
              });
            }
          } catch (_) {}
        }

        // Última conexión de cualquier dispositivo del usuario
        const devicesWithConn = (devices || []).filter((d: any) => d?.last_connection);
        if (devicesWithConn.length) {
          const latestConn = devicesWithConn.sort((a: any, b: any) => new Date(b.last_connection).getTime() - new Date(a.last_connection).getTime())[0];
          events.push({
            icon: 'connection',
            title: `Dispositivo conectado (${latestConn.name || latestConn.id})`,
            time: formatDistanceToNow(new Date(latestConn.last_connection), { addSuffix: true, locale: es }),
          });
        }

        // Última alerta activa
        try {
          const alerts = await alertsApi.list({ is_active: true });
          const items = alerts?.results || [];
          if (items.length) {
            const latestAlert = items.sort((a: any, b: any) => new Date(b.last_triggered || b.created_at).getTime() - new Date(a.last_triggered || a.created_at).getTime())[0];
            const when = latestAlert.last_triggered || latestAlert.created_at;
            if (when) {
              events.push({
                icon: 'alert',
                title: `Alerta: ${latestAlert.name}`,
                time: formatDistanceToNow(new Date(when), { addSuffix: true, locale: es }),
              });
            }
          }
        } catch (_) {}

        setRecentEvents(events.slice(0, 3));
      } catch (e) {
        setRecentEvents([]);
      }
    };
    loadRecent();
  }, [devices, selectedDevice]);

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

        {/* Telemetría Total */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Telemetría Total
            </CardTitle>
            <Terminal className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_telemetry ?? stats?.recent_telemetry_24h ?? 0}
            </div>
            <p className="text-xs text-white/70 mt-1">
              {stats?.recent_telemetry_24h != null
                ? `${stats?.recent_telemetry_24h} en últimas 24h`
                : 'Registros recibidos'}
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

          {/* Historial de Telemetría (7 días) */}
          {history.length > 0 && (
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Historial de Telemetría (7 días)</CardTitle>
                <CardDescription>Principales métricas históricas</CardDescription>
              </CardHeader>
              <CardContent>
                <HistoryChart data={history} />
              </CardContent>
            </Card>
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
              {recentEvents.length === 0 && (
                <p className="text-sm text-white/70">Sin eventos recientes.</p>
              )}
              {recentEvents.map((ev, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className={ev.icon === 'telemetry' ? 'bg-blue-600/20 p-2 rounded-lg' : ev.icon === 'connection' ? 'bg-green-600/20 p-2 rounded-lg' : 'bg-orange-600/20 p-2 rounded-lg'}>
                    {ev.icon === 'telemetry' && <Activity className="h-4 w-4 text-blue-300" />}
                    {ev.icon === 'connection' && <Cpu className="h-4 w-4 text-green-300" />}
                    {ev.icon === 'alert' && <Bell className="h-4 w-4 text-orange-300" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-white/70">{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Comandos</CardTitle>
            <CardDescription>
              Total y últimos 24h
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Terminal className="h-12 w-12 text-white/70 mx-auto mb-2" />
              <p className="text-sm text-white/70">
                Total: {stats?.total_commands ?? stats?.recent_commands_24h ?? 0}
              </p>
              {stats?.recent_commands_24h != null && (
                <p className="text-xs text-white/60 mt-1">
                  {stats?.recent_commands_24h} en últimas 24h
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Selecciona una métrica representativa del conjunto de datos
function pickMetricKeyFromHistory(data: any[]): string | null {
  for (let i = data.length - 1; i >= 0; i--) {
    const d = data[i]?.data;
    if (d && typeof d === 'object') {
      const keys = Object.keys(d);
      const numericKey = keys.find((k) => typeof d[k] === 'number');
      if (numericKey) return numericKey;
    }
  }
  return null;
}

// Componente simple que usa RechartsLineDynamic para renderizar el historial
function HistoryChart({ data }: { data: any[] }) {
  const key = pickMetricKeyFromHistory(data);
  const chartData = data.map((d) => ({
    timestamp: new Date(d.timestamp).toLocaleString(),
    [key || 'valor']: key ? d.data[key] : null,
  }));
  const dataKey = key || 'valor';
  // Carga dinámica del componente de Recharts
  const RechartsLineDynamic = require('@/components/dashboard/RechartsLineDynamic').default;
  return <RechartsLineDynamic data={chartData} dataKey={dataKey} />;
}
