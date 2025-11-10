"use client";
import React, { useMemo } from "react";

interface EventTableProps {
  telemetryData: Array<Record<string, any>>;
  limit?: number;
}

export const EventTable: React.FC<EventTableProps> = ({ telemetryData, limit = 50 }) => {
  const rows = useMemo(() => {
    return telemetryData
      .slice(-limit)
      .reverse()
      .map((d) => {
        const ts = d._timestamp || d.timestamp || d.eventcreationtime || d.created_at || "";
        const name = d.device_name || d.device || d.device_id || "";
        const panic = (d?.panic ?? d?.botonPanico ?? d?.data?.panic ?? d?.data?.botonPanico) === true;
        const payload = typeof d.data === "object" ? d.data : d;
        const summary = Object.entries(payload)
          .filter(([k, v]) => ["string", "number", "boolean"].includes(typeof v))
          .slice(0, 5)
          .map(([k, v]) => `${k}: ${String(v)}`)
          .join(" | ");
        return { ts, name, panic, summary };
      });
  }, [telemetryData, limit]);

  if (!rows.length) return <div className="text-sm text-white/70">Sin eventos recientes.</div>;

  return (
    <div className="overflow-auto rounded-xl border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-black/50 text-white/70">
          <tr>
            <th className="text-left px-3 py-2">Tiempo</th>
            <th className="text-left px-3 py-2">Dispositivo</th>
            <th className="text-left px-3 py-2">Pánico</th>
            <th className="text-left px-3 py-2">Resumen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="border-t border-white/5">
              <td className="px-3 py-2 text-white/90">{typeof r.ts === "string" ? r.ts : String(r.ts)}</td>
              <td className="px-3 py-2 text-white/90">{r.name}</td>
              <td className="px-3 py-2">
                <span className={`px-2 py-1 rounded text-xs ${r.panic ? "bg-red-600/30 text-red-300" : "bg-emerald-600/30 text-emerald-300"}`}>{r.panic ? "Sí" : "No"}</span>
              </td>
              <td className="px-3 py-2 text-white/80 truncate max-w-[50ch]">{r.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};