"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { ChartOptions, ChartData } from "chart.js";

// Cargar el componente Line de react-chartjs-2 solo en cliente (evita SSR)
const Line = dynamic(() => import("react-chartjs-2").then(m => m.Line), { ssr: false });

type Props = {
  data: Array<{ timestamp: string | number; [key: string]: any }>;
  dataKey: string;
};

export default function ChartJSLine({ data, dataKey }: Props) {
  const [ready, setReady] = useState(false);

  // Registrar Chart.js automáticamente en cliente
  useEffect(() => {
    let mounted = true;
    import("chart.js/auto").then(() => {
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  const chartData: ChartData<'line', (number | null)[], string> = useMemo(() => {
    const labels = data.map(d => typeof d.timestamp === "string" ? d.timestamp : new Date(d.timestamp).toLocaleTimeString());
    const values = data.map(d => {
      const v = d[dataKey];
      return typeof v === "number" ? v : (typeof v === "string" ? Number(v) : null);
    });
    return {
      labels,
      datasets: [
        {
          label: dataKey,
          data: values,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.2)",
          tension: 0, // lineal
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [data, dataKey]);

  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    spanGaps: true,
    animation: false,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        grid: { display: true },
      },
      y: {
        grid: { display: true },
        // Evita errores de tipos con propiedades no soportadas
        ticks: {},
      },
    },
  }), []);

  if (!ready) return null;

  return (
    <div style={{ width: "100%", height: 300 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}