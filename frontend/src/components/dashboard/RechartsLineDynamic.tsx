"use client";
import { useEffect, useState } from "react";

type Props = {
  data: any[];
  dataKey: string;
};

export default function RechartsLineDynamic({ data, dataKey }: Props) {
  const [mod, setMod] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    import("recharts").then((m: any) => {
      if (mounted) setMod(m);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!mod) return null;

  const {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
  } = mod;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="linear"
          dataKey={dataKey}
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}