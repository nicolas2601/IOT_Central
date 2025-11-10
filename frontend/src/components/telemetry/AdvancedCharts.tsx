"use client";
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AdvancedChartsProps {
  telemetryData: Array<Record<string, any>>;
  selectedKeys?: string[];
}

function toLabel(ts: any): string {
  try {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
  } catch {}
  return typeof ts === "string" ? ts.slice(11, 19) : "";
}

export const AdvancedCharts: React.FC<AdvancedChartsProps> = ({ telemetryData, selectedKeys }) => {
  const data = useMemo(() => {
    const last = telemetryData.slice(-100); // limitar a 100 muestras
    return last.map((d, i) => {
      const ts = d._timestamp || d.timestamp || d.eventcreationtime || d.created_at || i;
      const entry: Record<string, any> = { tsLabel: toLabel(ts) };
      // Copiar solo números
      Object.entries(d).forEach(([k, v]) => {
        const n = typeof v === "string" ? Number(v) : v;
        if (typeof n === "number" && !isNaN(n)) entry[k] = n;
      });
      // Incluir métricas numéricas anidadas en d.data
      if (d && typeof d === "object" && (d as any).data && typeof (d as any).data === "object") {
        Object.entries((d as any).data as Record<string, any>).forEach(([k, v]) => {
          const n = typeof v === "string" ? Number(v) : v;
          if (typeof n === "number" && !isNaN(n)) entry[k] = n;
        });
      }
      return entry;
    });
  }, [telemetryData]);

  // Detectar hasta 3 métricas numéricas para graficar
  const metricKeys = useMemo(() => {
    if (selectedKeys && selectedKeys.length) return selectedKeys.slice(0, 3);
    if (!data.length) return [] as string[];
    const sample = Object.keys(data[data.length - 1]).filter((k) => k !== "tsLabel");
    const numericKeys = sample.filter((k) => typeof data[data.length - 1][k] === "number");
    return numericKeys.slice(0, 3);
  }, [data, selectedKeys?.join("|")]);

  // Conteo por minuto para barras
  const perMinute = useMemo(() => {
    const bucket: Record<string, number> = {};
    telemetryData.slice(-300).forEach((d) => {
      const ts = d._timestamp || d.timestamp || d.eventcreationtime;
      const dt = ts ? new Date(ts) : null;
      const key = dt && !isNaN(dt.getTime()) ? `${dt.getHours()}:${dt.getMinutes().toString().padStart(2, "0")}` : "";
      bucket[key] = (bucket[key] || 0) + 1;
    });
    return Object.entries(bucket).map(([k, v]) => ({ label: k, count: v }));
  }, [telemetryData]);

  // Distribución de pánico
  const panicDist = useMemo(() => {
    const getPanic = (d: any) => {
      const v = d?.panic ?? d?.botonPanico ?? d?.data?.panic ?? d?.data?.botonPanico;
      return typeof v === "boolean" ? v : undefined;
    };
    let trueCount = 0;
    let falseCount = 0;
    telemetryData.forEach((d) => {
      const val = getPanic(d);
      if (val === true) trueCount += 1;
      else if (val === false) falseCount += 1;
    });
    return [
      { name: "Verdadero", value: trueCount },
      { name: "Falso", value: falseCount },
    ];
  }, [telemetryData]);

  const colors = ["#3b82f6", "#22c55e", "#f97316", "#a855f7"]; // azul, verde, naranja, púrpura

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Line/Area multiparámetro */}
      <div className="rounded-xl p-4 bg-gradient-to-br from-blue-900/30 to-slate-900/30 border border-white/10">
        <div className="text-sm text-white/80 mb-2">Series en tiempo reciente</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {metricKeys.length ? (
              <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
                <XAxis dataKey="tsLabel" tick={{ fill: "#9ca3af" }} />
                <YAxis tick={{ fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", color: "#fff" }} />
                <Legend />
                {metricKeys.map((k, i) => (
                  <Line key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            ) : (
              <div className="flex items-center justify-center h-full text-white/60 text-sm">No se detectaron métricas numéricas en las muestras.</div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conteo por minuto */}
      <div className="rounded-xl p-4 bg-gradient-to-br from-indigo-900/30 to-slate-900/30 border border-white/10">
        <div className="text-sm text-white/80 mb-2">Eventos por minuto</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perMinute}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
              <XAxis dataKey="label" tick={{ fill: "#9ca3af" }} />
              <YAxis tick={{ fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", color: "#fff" }} />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribución de pánico */}
      <div className="rounded-xl p-4 bg-gradient-to-br from-rose-900/30 to-slate-900/30 border border-white/10 xl:col-span-2">
        <div className="text-sm text-white/80 mb-2">Distribución de botón de pánico</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={panicDist} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={120} dataKey="value">
                {panicDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={["#ef4444", "#10b981"][index % 2]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", color: "#fff" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};