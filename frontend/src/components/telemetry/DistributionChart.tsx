"use client";
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface DistributionChartProps {
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

export const DistributionChart: React.FC<DistributionChartProps> = ({ telemetryData }) => {
  const data = useMemo(() => {
    if (!telemetryData.length) return [];

    // Detectar dos métricas numéricas
    const sample = telemetryData[telemetryData.length - 1];
    const keys: string[] = [];
    
    for (const [k, v] of Object.entries(sample || {})) {
      if ((typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)))) && keys.length < 2) {
        keys.push(k);
      }
    }
    
    if (keys.length < 2 && sample?.data) {
      for (const [k, v] of Object.entries(sample.data)) {
        if ((typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)))) && keys.length < 2) {
          keys.push(k);
        }
      }
    }

    if (keys.length < 2) return [];

    return telemetryData
      .slice(-100)
      .map((d, i) => {
        const x = extractNumericValue(d, keys[0]);
        const y = extractNumericValue(d, keys[1]);
        return x !== null && y !== null ? { x, y, idx: i } : null;
      })
      .filter(Boolean) as any[];
  }, [telemetryData]);

  if (!data.length) {
    return <div className="text-xs text-white/60">Se necesitan al menos 2 métricas numéricas.</div>;
  }

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="rounded-xl p-4 bg-linear-to-br from-indigo-900/30 to-slate-900/30 border border-white/10">
      <div className="mb-3">
        <div className="text-sm font-semibold text-white">📊 Gráfica de Dispersión</div>
        <div className="text-xs text-white/60 mt-1">Muestra la relación entre 2 métricas. Cada punto representa una muestra. Útil para detectar correlaciones o patrones.</div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
            <XAxis dataKey="x" tick={{ fill: "#9ca3af" }} />
            <YAxis dataKey="y" tick={{ fill: "#9ca3af" }} />
            <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", color: "#fff" }} />
            <Scatter name="Muestras" data={data} fill="#3b82f6">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
