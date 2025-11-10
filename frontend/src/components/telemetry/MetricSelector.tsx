"use client";
import React, { useEffect, useMemo, useState } from "react";

interface MetricSelectorProps {
  telemetryData: Array<Record<string, any>>;
  onChange: (keys: string[]) => void;
  max?: number;
}

export const MetricSelector: React.FC<MetricSelectorProps> = ({ telemetryData, onChange, max = 3 }) => {
  const candidates = useMemo(() => {
    const last = telemetryData[telemetryData.length - 1];
    const set = new Set<string>();
    if (last && typeof last === "object") {
      Object.entries(last).forEach(([k, v]) => {
        const n = typeof v === "string" ? Number(v) : v;
        if (typeof n === "number" && !isNaN(n)) set.add(k);
      });
      if ((last as any).data && typeof (last as any).data === "object") {
        Object.entries((last as any).data).forEach(([k, v]) => {
          const n = typeof v === "string" ? Number(v) : v;
          if (typeof n === "number" && !isNaN(n)) set.add(k);
        });
      }
    }
    return Array.from(set);
  }, [telemetryData]);

  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    // Selección por defecto: primeras N
    const initial = candidates.slice(0, max);
    setSelected(initial);
    onChange(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates.join("|"), max]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const has = prev.includes(key);
      const next = has ? prev.filter((k) => k !== key) : [...prev, key].slice(0, max);
      onChange(next);
      return next;
    });
  };

  if (!candidates.length) {
    return <div className="text-xs text-white/60">No se detectan métricas numéricas en las muestras.</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {candidates.map((key) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          className={`px-2 py-1 rounded text-xs border ${selected.includes(key) ? "bg-blue-600/40 border-blue-500/60 text-white" : "bg-black/40 border-white/20 text-white/80"}`}
        >
          {key}
        </button>
      ))}
      <span className="text-xs text-white/50">(máx. {max})</span>
    </div>
  );
};