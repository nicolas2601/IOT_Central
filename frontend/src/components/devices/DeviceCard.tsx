"use client";

import { Device } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cpu, Edit, Trash2, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface DeviceCardProps {
  device: Device;
  onEdit: (device: Device) => void;
  onDelete: (device: Device) => void;
  onView: (device: Device) => void;
}

export const DeviceCard = ({ device, onEdit, onDelete, onView }: DeviceCardProps) => {
  const getDeviceIcon = () => {
    switch (device.device_type) {
      case "sensor":
        return <Activity className="h-6 w-6" />;
      case "actuator":
        return <Cpu className="h-6 w-6" />;
      default:
        return <Cpu className="h-6 w-6" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">{getDeviceIcon()}</div>
            <div>
              <CardTitle className="text-lg">{device.name}</CardTitle>
              <CardDescription>{device.device_type}</CardDescription>
            </div>
          </div>
          <Badge variant={device.is_active ? "default" : "secondary"}>
            {device.is_active ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {device.description || "Sin descripción"}
        </p>

        {device.last_connection && (
          <p className="text-xs text-muted-foreground mt-2">
            Última conexión:{" "}
            {formatDistanceToNow(new Date(device.last_connection), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onView(device)} className="flex-1">
          Ver Detalles
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(device)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(device)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardFooter>
    </Card>
  );
};
