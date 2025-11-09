"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ChartJSLine from "./ChartJSLine";

export const TelemetryChart = ({ data, title, dataKey }: { data: any[]; title: string; dataKey: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ChartJSLine data={data} dataKey={dataKey} />
    </CardContent>
  </Card>
);
