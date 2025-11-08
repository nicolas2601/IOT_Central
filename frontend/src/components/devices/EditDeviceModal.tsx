"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Device } from "@/types";

interface EditDeviceModalProps {
  open: boolean;
  device: Device | null;
  onClose: () => void;
  onSave: (data: Device) => void;
}

export const EditDeviceModal = ({ open, device, onClose, onSave }: EditDeviceModalProps) => {
  const [form, setForm] = useState<Device | null>(device);

  useEffect(() => setForm(device), [device]);

  if (!form) return null;

  const handleChange = (key: keyof Device, value: any) => {
    setForm({ ...form, [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar dispositivo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Input value={form.description || ""} onChange={(e) => handleChange("description", e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onSave(form)}>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
