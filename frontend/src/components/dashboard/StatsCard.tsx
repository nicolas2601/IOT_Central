"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const StatsCard = ({ title, value, icon }: { title: string; value: string | number; icon?: React.ReactNode }) => (
  <Card>
    <CardHeader className="flex justify-between items-center">
      <CardTitle>{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">{value}</p>
    </CardContent>
  </Card>
);
