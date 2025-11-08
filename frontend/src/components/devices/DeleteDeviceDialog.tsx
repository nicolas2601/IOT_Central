"use client";

import { Device } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteDeviceDialogProps {
  device: Device | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteDeviceDialog = ({ device, onConfirm, onCancel }: DeleteDeviceDialogProps) => {
  if (!device) return null;

  return (
    <Dialog open={!!device} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar dispositivo</DialogTitle>
        </DialogHeader>

        <p>¿Estás seguro de que deseas eliminar <b>{device.name}</b>? Esta acción no se puede deshacer.</p>

        <DialogFooter>
          <Button variant="destructive" onClick={onConfirm}>
            Eliminar
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
