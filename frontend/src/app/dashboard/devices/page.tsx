"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDevices } from "@/hooks/useDevices";
import { DeviceCard } from "@/components/devices/DeviceCard";
import NewDeviceWizard from "@/components/devices/NewDeviceWizard";
import { EditDeviceModal } from "@/components/devices/EditDeviceModal";
import { DeleteDeviceDialog } from "@/components/devices/DeleteDeviceDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SpotlightCard from "@/components/ui/SpotlightCard";
import type { Device } from "@/types";

export default function DevicesPage() {
  const router = useRouter();
  const { devices, isLoading, createDevice, deleteDevice, refetch } = useDevices();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Device | null>(null);

  if (isLoading)
    return <p className="text-center mt-8">Cargando dispositivos...</p>;

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Gestión de Dispositivos</h2>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Dispositivo
        </Button>
      </div>

      {Array.isArray(devices) && devices.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mr-auto">
          {devices.map((device: any) => (
            <SpotlightCard key={device.id} className="bg-black/40 border-white/10 backdrop-blur-xl">
              <DeviceCard
                device={device}
                onEdit={() => { setSelected(device); setEditOpen(true); }}
                onDelete={() => setSelected(device)}
                onView={() => router.push(`/dashboard/devices/${device.id}`)}
              />
            </SpotlightCard>
          ))}
        </div>
      ) : (
        <p className="text-center text-white/70">
          No hay dispositivos registrados.
        </p>
      )}

      {/* Wizard Crear con Plantillas (Azure-like) */}
      <NewDeviceWizard
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (data) => {
          try {
            const createdDevice = await createDevice.mutateAsync(data);
            setCreateOpen(false);
            refetch();

            // Si la simulación automática está activada, iniciar el simulador
            const simulateServer = (data as any)?.metadata?.simulation?.autoServer;
            if (simulateServer && createdDevice?.id) {
              try {
                const { deviceService } = await import("@/services/deviceService");
                await deviceService.startSimulator(String(createdDevice.id), { interval: 5 });
                console.log("✓ Simulador iniciado automáticamente para", createdDevice.name);
              } catch (simError) {
                console.error("Error iniciando simulador:", simError);
              }
            }
          } catch (e) {
            console.error("Error creando dispositivo", e);
          }
        }}
      />

      {/* Modal Editar */}
      <EditDeviceModal
        open={editOpen}
        device={selected}
        onClose={() => setEditOpen(false)}
        onSave={async (data) => {
          try {
            if (data?.id) {
              // Reutilizamos el servicio directo para update
              const { deviceService } = await import("@/services/deviceService");
              await deviceService.update(String(data.id), {
                name: data.name,
                description: data.description,
              });
              setEditOpen(false);
              setSelected(null);
              refetch();
            }
          } catch (e) {
            console.error("Error actualizando dispositivo", e);
          }
        }}
      />

      {/* Dialogo Eliminar */}
      <DeleteDeviceDialog
        device={selected}
        onConfirm={async () => {
          try {
            if (selected?.id) {
              await deleteDevice.mutateAsync(String(selected.id));
              setSelected(null);
              refetch();
            }
          } catch (e) {
            console.error("Error eliminando dispositivo", e);
          }
        }}
        onCancel={() => setSelected(null)}
      />

      {/* Modal con plantilla de telemetría generada */}
      {/* Modal de plantilla retirado según nueva preferencia de simulación local por script */}
    </section>
  );
}
