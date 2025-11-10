"use client";
import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface HourlyStackedProps {
  telemetryData: Array<Record<string, any>>;
}

export const HourlyStacked: React.FC<HourlyStackedProps> = ({ telemetryData }) => {
  const data = useMemo(() => {
    const bucket: Record<string, { panic: number; normal: number }> = {};
    telemetryData.slice(-500).forEach((d) => {
      const ts = d._timestamp || d.timestamp || d.eventcreationtime;
      const dt = ts ? new Date(ts) : null;
      const key = dt && !isNaN(dt.getTime()) ? `${dt.getHours().toString().padStart(2, "0")}:00` : "";
      const isPanic = (d?.panic ?? d?.botonPanico ?? d?.data?.panic ?? d?.data?.botonPanico) === true;
      if (!bucket[key]) bucket[key] = { panic: 0, normal: 0 };
      bucket[key][isPanic ? "panic" : "normal"] += 1;
    });
    return Object.entries(bucket)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, v]) => ({ label, panic: v.panic, normal: v.normal }));
  }, [telemetryData]);

  return (
    <div className="rounded-xl p-4 bg-gradient-to-br from-sky-900/30 to-slate-900/30 border border-white/10">
      <div className="text-sm text-white/80 mb-2">Eventos por hora (pánico vs normal)</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} stackOffset="expand">
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
            <XAxis dataKey="label" tick={{ fill: "#9ca3af" }} />
            <YAxis tick={{ fill: "#9ca3af" }} />
            <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", color: "#fff" }} />
            <Legend />
            <Bar dataKey="normal" stackId="a" fill="#22c55e" name="Normal" />
            <Bar dataKey="panic" stackId="a" fill="#ef4444" name="Pánico" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};