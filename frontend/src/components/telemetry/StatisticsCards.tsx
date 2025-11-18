"use client";
import React, { useMemo } from "react";

interface StatisticsCardsProps {
  telemetryData: Array<Record<string, any>>;
}

function extractNumericValue(obj: any, key: string): number | null {
  const val = obj?.[key] ?? obj?.data?.[key];
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val);
    return isNaN(n) ? null : n;
  }
  return null;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ telemetryData }) => {
  const stats = useMemo(() => {
    if (!telemetryData.length) return null;

    // Detectar primera métrica numérica disponible
    const sample = telemetryData[telemetryData.length - 1];
    let metricKey = "";
    for (const [k, v] of Object.entries(sample || {})) {
      if (typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)))) {
        metricKey = k;
        break;
      }
    }
    if (!metricKey && sample?.data) {
      for (const [k, v] of Object.entries(sample.data)) {
        if (typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)))) {
          metricKey = k;
          break;
        }
      }
    }

    if (!metricKey) return null;

    const values = telemetryData
      .map((d) => extractNumericValue(d, metricKey))
      .filter((v): v is number => v !== null);

    if (!values.length) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = values[values.length - 1];
    const range = max - min;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { metricKey, min, max, avg, latest, range, stdDev, count: values.length };
  }, [telemetryData]);

  if (!stats) {
    return <div className="text-xs text-white/60">No hay datos numéricos disponibles.</div>;
  }

  const format = (n: number) => n.toFixed(2);

  return (
    <div className="space-y-4">
      {/* Explicación general */}
      <div className="rounded-lg p-3 bg-white/5 border border-white/10">
        <div className="text-xs text-white/70">
          <strong>Métrica analizada:</strong> <span className="text-white font-semibold">{stats.metricKey}</span>
          <br />
          <strong>Muestras:</strong> {stats.count} registros
          <br />
          <span className="text-white/60">Análisis estadístico de los últimos datos recibidos</span>
        </div>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg p-3 bg-linear-to-br from-blue-600/30 to-blue-800/20 border border-blue-500/30">
          <div className="text-xs text-white/70 mb-1">❄️ Mínimo</div>
          <div className="text-xl font-bold text-blue-300">{format(stats.min)}</div>
          <div className="text-xs text-white/50 mt-1">Valor más bajo registrado</div>
        </div>

        <div className="rounded-lg p-3 bg-linear-to-br from-green-600/30 to-green-800/20 border border-green-500/30">
          <div className="text-xs text-white/70 mb-1">🔥 Máximo</div>
          <div className="text-xl font-bold text-green-300">{format(stats.max)}</div>
          <div className="text-xs text-white/50 mt-1">Valor más alto registrado</div>
        </div>

        <div className="rounded-lg p-3 bg-linear-to-br from-purple-600/30 to-purple-800/20 border border-purple-500/30">
          <div className="text-xs text-white/70 mb-1">📊 Promedio</div>
          <div className="text-xl font-bold text-purple-300">{format(stats.avg)}</div>
          <div className="text-xs text-white/50 mt-1">Media de todos los valores</div>
        </div>

        <div className="rounded-lg p-3 bg-linear-to-br from-orange-600/30 to-orange-800/20 border border-orange-500/30">
          <div className="text-xs text-white/70 mb-1">⏱️ Último</div>
          <div className="text-xl font-bold text-orange-300">{format(stats.latest)}</div>
          <div className="text-xs text-white/50 mt-1">Valor más reciente</div>
        </div>
      </div>

      {/* Tarjetas secundarias con explicaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg p-3 bg-white/5 border border-white/10">
          <div className="text-xs text-white/70 mb-1">📏 Rango</div>
          <div className="text-lg font-bold text-white">{format(stats.range)}</div>
          <div className="text-xs text-white/50 mt-1">Diferencia entre máximo y mínimo</div>
          <div className="text-xs text-white/40 mt-2">Indica la variabilidad total de los datos</div>
        </div>

        <div className="rounded-lg p-3 bg-white/5 border border-white/10">
          <div className="text-xs text-white/70 mb-1">📈 Desv. Estándar</div>
          <div className="text-lg font-bold text-white">{format(stats.stdDev)}</div>
          <div className="text-xs text-white/50 mt-1">Dispersión respecto al promedio</div>
          <div className="text-xs text-white/40 mt-2">Valores bajos = datos estables</div>
        </div>

        <div className="rounded-lg p-3 bg-white/5 border border-white/10">
          <div className="text-xs text-white/70 mb-1">🎯 Estabilidad</div>
          <div className="text-lg font-bold text-white">
            {stats.stdDev < stats.avg * 0.1 ? "✓ Estable" : stats.stdDev < stats.avg * 0.3 ? "⚠ Normal" : "⚠ Variable"}
          </div>
          <div className="text-xs text-white/50 mt-1">Análisis de variabilidad</div>
          <div className="text-xs text-white/40 mt-2">Basado en desviación estándar</div>
        </div>
      </div>

      {/* Leyenda explicativa */}
      <div className="rounded-lg p-3 bg-white/5 border border-white/10 text-xs text-white/60 space-y-1">
        <div><strong>¿Qué significan estos valores?</strong></div>
        <div>• <strong>Mínimo:</strong> El valor más bajo que ha tenido la métrica</div>
        <div>• <strong>Máximo:</strong> El valor más alto que ha tenido la métrica</div>
        <div>• <strong>Promedio:</strong> Si sumas todos los valores y divides entre la cantidad</div>
        <div>• <strong>Último:</strong> El valor más reciente recibido</div>
        <div>• <strong>Rango:</strong> Cuánto varía entre el mínimo y máximo</div>
        <div>• <strong>Desv. Estándar:</strong> Qué tan dispersos están los datos respecto al promedio</div>
      </div>
    </div>
  );
};
