"use client";
import { Device } from "@/types";
import { DeviceCard } from "./DeviceCard";
import { DeleteDeviceDialog } from "./DeleteDeviceDialog";
import { useState } from "react";

interface DeviceListProps {
  devices: Device[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export const DeviceList = ({ devices, onDelete, onRefresh }: DeviceListProps) => {
  const [selected, setSelected] = useState<Device | null>(null);

  if (devices.length === 0)
    return <p className="text-center text-muted-foreground">No hay dispositivos registrados.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {devices.map((device) => (
        <DeviceCard
          key={device.id}
          device={device}
          onEdit={() => console.log("Editar", device)}
          onView={() => console.log("Ver detalles", device)}
          onDelete={() => setSelected(device)}
        />
      ))}

      <DeleteDeviceDialog
        device={selected}
        onConfirm={() => {
          if (selected) {
            onDelete(selected.id);
            onRefresh();
          }
          setSelected(null);
        }}
        onCancel={() => setSelected(null)}
      />
    </div>
  );
};
