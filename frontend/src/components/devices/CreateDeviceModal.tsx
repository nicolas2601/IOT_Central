"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateDeviceModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}

export const CreateDeviceModal = ({ open, onClose, onCreate }: CreateDeviceModalProps) => {
  const [name, setName] = useState("");
  const [device_type, setDeviceType] = useState("sensor");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name, device_type, description });
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nuevo dispositivo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Tipo</Label>
            <select
              className="w-full border border-gray-300 rounded-md p-2"
              value={device_type}
              onChange={(e) => setDeviceType(e.target.value)}
            >
              <option value="sensor">Sensor</option>
              <option value="actuator">Actuador</option>
            </select>
          </div>
          <div>
            <Label>Descripción</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit}>Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
