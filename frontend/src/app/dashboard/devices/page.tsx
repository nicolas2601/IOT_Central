"use client";
import { useDevices } from "@/hooks/useDevices";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DevicesPage() {
  const { devices, isLoading } = useDevices();

  if (isLoading)
    return <p className="text-center mt-8">Cargando dispositivos...</p>;

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gestión de Dispositivos</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Dispositivo
        </Button>
      </div>

      {Array.isArray(devices) && devices.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device: any) => (
            <DeviceCard
              key={device.id}
              device={device}
              onEdit={() => console.log("Editar", device)}
              onDelete={() => console.log("Eliminar", device)}
              onView={() => console.log("Ver detalles", device)}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          No hay dispositivos registrados.
        </p>
      )}
    </section>
  );
}
