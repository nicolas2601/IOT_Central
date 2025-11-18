"use client";
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface TrendAreaChartProps {
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

function toLabel(ts: any): string {
  try {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    }
  } catch {}
  return typeof ts === "string" ? ts.slice(11, 16) : "";
}

export const TrendAreaChart: React.FC<TrendAreaChartProps> = ({ telemetryData }) => {
  const data = useMemo(() => {
    if (!telemetryData.length) return [];

    // Detectar primera métrica numérica
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

    if (!metricKey) return [];

    return telemetryData
      .slice(-50)
      .map((d, i) => {
        const ts = d._timestamp || d.timestamp || d.eventcreationtime || d.created_at || i;
        const val = extractNumericValue(d, metricKey);
        return val !== null ? { time: toLabel(ts), value: val, metric: metricKey } : null;
      })
      .filter(Boolean) as any[];
  }, [telemetryData]);

  if (!data.length) {
    return <div className="text-xs text-white/60">No hay datos disponibles.</div>;
  }

  return (
    <div className="rounded-xl p-4 bg-linear-to-br from-emerald-900/30 to-slate-900/30 border border-white/10">
      <div className="mb-3">
        <div className="text-sm font-semibold text-white">📈 Tendencia de Métrica Principal</div>
        <div className="text-xs text-white/60 mt-1">Visualiza cómo evoluciona la métrica principal en el tiempo. El área sombreada facilita ver la tendencia general.</div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
            <XAxis dataKey="time" tick={{ fill: "#9ca3af" }} />
            <YAxis tick={{ fill: "#9ca3af" }} />
            <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", color: "#fff" }} />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              name={data[0]?.metric || "Valor"}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
