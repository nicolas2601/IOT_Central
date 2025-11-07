'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { dashboardApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cpu, Activity, Terminal, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import type { DashboardStats } from '@/types';
import { RealtimeChart } from "@/components/telemetry/RealtimeChart";

/**
 * Página Principal del Dashboard
 * 
 * Muestra un resumen general de la plataforma IoT:
 * - Estadísticas de dispositivos
 * - Actividad reciente
 * - Alertas activas
 * - Gráficas de telemetría
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      {/* Header de Bienvenida */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user?.first_name || user?.username}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Aquí está el resumen de tu plataforma IoT
        </p>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Dispositivos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Dispositivos
            </CardTitle>
            <Cpu className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_devices || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.active_devices || 0} activos
            </p>
          </CardContent>
        </Card>

        {/* Dispositivos Online */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dispositivos Online
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.online_devices || 0}
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              {stats?.offline_devices || 0} offline
            </div>
          </CardContent>
        </Card>

        {/* Telemetría Reciente */}
        <Card>
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
            <p className="text-xs text-gray-500 mt-1">
              Registros recibidos
            </p>
          </CardContent>
        </Card>

        {/* Alertas Activas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas Activas
            </CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.active_alerts || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dispositivos por Tipo */}
      <Card>
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
              <p className="text-gray-500 text-sm">No hay dispositivos registrados</p>
            )}
          </div>
        </CardContent>
      </Card>
         {/* Gráfica en Tiempo Real */}
      <div className="mt-6">
        <RealtimeChart deviceId="sensor_001" token="mi_token_seguro" />
      </div>
      {/* Actividad Reciente */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimos eventos en tu plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Telemetría recibida</p>
                  <p className="text-xs text-gray-500">Hace 2 minutos</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Cpu className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Dispositivo conectado</p>
                  <p className="text-xs text-gray-500">Hace 15 minutos</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Bell className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nueva alerta generada</p>
                  <p className="text-xs text-gray-500">Hace 1 hora</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comandos Recientes</CardTitle>
            <CardDescription>
              Últimos comandos enviados (24h)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Terminal className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {stats?.recent_commands_24h || 0} comandos enviados en las últimas 24 horas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
