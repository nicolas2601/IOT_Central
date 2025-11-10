"use client";
import React from "react";

interface TelemetryKpisProps {
  telemetryData: Array<Record<string, any>>;
}

function formatNumber(n: number) {
  return Intl.NumberFormat().format(n);
}

export const TelemetryKpis: React.FC<TelemetryKpisProps> = ({ telemetryData }) => {
  const total = telemetryData.length;
  const getPanic = (d: any) => {
    const v = d?.panic ?? d?.botonPanico ?? d?.data?.panic ?? d?.data?.botonPanico;
    return typeof v === "boolean" ? v : undefined;
  };
  const panicTrue = telemetryData.filter((d) => getPanic(d) === true).length;
  const lastTs = telemetryData.length ? (telemetryData[telemetryData.length - 1] as any)._timestamp || (telemetryData[telemetryData.length - 1] as any).timestamp : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-xl p-4 bg-gradient-to-br from-blue-600/40 to-blue-800/30 border border-blue-500/40">
        <div className="text-xs text-white/70">Eventos recibidos</div>
        <div className="text-2xl font-semibold text-white">{formatNumber(total)}</div>
        <div className="text-xs text-white/50">Últimos {Math.min(total, 100)} samples</div>
      </div>

      <div className="rounded-xl p-4 bg-gradient-to-br from-emerald-600/40 to-emerald-800/30 border border-emerald-500/40">
        <div className="text-xs text-white/70">Botón de pánico</div>
        <div className="text-2xl font-semibold text-white">{formatNumber(panicTrue)}</div>
        <div className="text-xs text-white/50">Eventos con valor verdadero</div>
      </div>

      <div className="rounded-xl p-4 bg-gradient-to-br from-indigo-600/40 to-indigo-800/30 border border-indigo-500/40">
        <div className="text-xs text-white/70">Última muestra</div>
        <div className="text-sm font-medium text-white break-all">{lastTs ? String(lastTs) : "-"}</div>
        <div className="text-xs text-white/50">Marca de tiempo del último evento</div>
      </div>
    </div>
  );
};