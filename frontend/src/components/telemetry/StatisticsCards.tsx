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

    return { metricKey, min, max, avg, latest };
  }, [telemetryData]);

  if (!stats) {
    return <div className="text-xs text-white/60">No hay datos numéricos disponibles.</div>;
  }

  const format = (n: number) => n.toFixed(2);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-lg p-3 bg-gradient-to-br from-blue-600/30 to-blue-800/20 border border-blue-500/30">
        <div className="text-xs text-white/70">Mínimo</div>
        <div className="text-xl font-bold text-blue-300">{format(stats.min)}</div>
        <div className="text-xs text-white/50">{stats.metricKey}</div>
      </div>

      <div className="rounded-lg p-3 bg-gradient-to-br from-green-600/30 to-green-800/20 border border-green-500/30">
        <div className="text-xs text-white/70">Máximo</div>
        <div className="text-xl font-bold text-green-300">{format(stats.max)}</div>
        <div className="text-xs text-white/50">{stats.metricKey}</div>
      </div>

      <div className="rounded-lg p-3 bg-gradient-to-br from-purple-600/30 to-purple-800/20 border border-purple-500/30">
        <div className="text-xs text-white/70">Promedio</div>
        <div className="text-xl font-bold text-purple-300">{format(stats.avg)}</div>
        <div className="text-xs text-white/50">{stats.metricKey}</div>
      </div>

      <div className="rounded-lg p-3 bg-gradient-to-br from-orange-600/30 to-orange-800/20 border border-orange-500/30">
        <div className="text-xs text-white/70">Último</div>
        <div className="text-xl font-bold text-orange-300">{format(stats.latest)}</div>
        <div className="text-xs text-white/50">{stats.metricKey}</div>
      </div>
    </div>
  );
};
