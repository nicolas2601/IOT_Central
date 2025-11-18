"use client";
import React, { useMemo } from "react";
import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";

interface RadialPanicGaugeProps {
  telemetryData: Array<Record<string, any>>;
}

export const RadialPanicGauge: React.FC<RadialPanicGaugeProps> = ({ telemetryData }) => {
  const value = useMemo(() => {
    const total = telemetryData.length || 1;
    const panic = telemetryData.filter((d) => (d?.panic ?? d?.botonPanico ?? d?.data?.panic ?? d?.data?.botonPanico) === true).length;
    return Math.round((panic / total) * 100);
  }, [telemetryData]);

  const data = [{ name: "Pánico", value }];

  return (
    <div className="rounded-xl p-4 bg-linear-to-br from-purple-900/30 to-slate-900/30 border border-white/10">
      <div className="mb-3">
        <div className="text-sm font-semibold text-white">🎯 Indicador de Pánico</div>
        <div className="text-xs text-white/60 mt-1">Muestra qué porcentaje de eventos tienen el botón de pánico activado. Un valor alto indica muchas alertas.</div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="50%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
            <RadialBar min={15} background dataKey="value" cornerRadius={20} fill="#a855f7" />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center text-2xl font-semibold text-white">{value}%</div>
    </div>
  );
};