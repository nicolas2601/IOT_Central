"use client";
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface MultiMetricComparisonProps {
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
      return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
    }
  } catch {}
  return typeof ts === "string" ? ts.slice(11, 19) : "";
}

export const MultiMetricComparison: React.FC<MultiMetricComparisonProps> = ({ telemetryData }) => {
  const { data, metrics } = useMemo(() => {
    if (!telemetryData.length) return { data: [], metrics: [] };

    // Detectar hasta 4 métricas numéricas
    const sample = telemetryData[telemetryData.length - 1];
    const metricKeys: string[] = [];
    
    for (const [k, v] of Object.entries(sample || {})) {
      if ((typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)))) && metricKeys.length < 4) {
        metricKeys.push(k);
      }
    }
    
    if (metricKeys.length < 4 && sample?.data) {
      for (const [k, v] of Object.entries(sample.data)) {
        if ((typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)))) && metricKeys.length < 4) {
          metricKeys.push(k);
        }
      }
    }

    if (!metricKeys.length) return { data: [], metrics: [] };

    const chartData = telemetryData
      .slice(-50)
      .map((d, i) => {
        const ts = d._timestamp || d.timestamp || d.eventcreationtime || d.created_at || i;
        const entry: any = { time: toLabel(ts) };
        
        metricKeys.forEach((key) => {
          const val = extractNumericValue(d, key);
          if (val !== null) {
            entry[key] = val;
          }
        });
        
        return entry;
      });

    return { data: chartData, metrics: metricKeys };
  }, [telemetryData]);

  if (!data.length || !metrics.length) {
    return <div className="text-xs text-white/60">No hay métricas numéricas disponibles.</div>;
  }

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="rounded-xl p-4 bg-gradient-to-br from-cyan-900/30 to-slate-900/30 border border-white/10">
      <div className="text-sm text-white/80 mb-2">Comparativa de métricas ({metrics.length} series)</div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
            <XAxis dataKey="time" tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9ca3af" }} />
            <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", color: "#fff" }} />
            <Legend />
            {metrics.map((metric, idx) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
