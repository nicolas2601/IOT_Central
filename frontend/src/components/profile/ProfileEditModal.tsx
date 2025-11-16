"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/types";

type ProfileEditModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSave: (data: Partial<User>) => Promise<void> | void;
};

export function ProfileEditModal({ open, onOpenChange, user, onSave }: ProfileEditModalProps) {
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
    company_name: user?.company_name || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        username: user?.username || "",
        email: user?.email || "",
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        phone: user?.phone || "",
        company_name: user?.company_name || "",
      });
    }
  }, [open, user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave({
        username: form.username.trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || undefined,
        company_name: form.company_name.trim() || undefined,
      });
      onOpenChange(false);
    } catch (e) {
      // En un futuro: mostrar notificación/toast
      console.error("Error al guardar el perfil", e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/80 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div>
            <Label className="text-white/80">Usuario</Label>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="bg-black/60 text-white border-white/10" />
          </div>
          <div>
            <Label className="text-white/80">Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-black/60 text-white border-white/10" />
          </div>
          <div>
            <Label className="text-white/80">Nombre</Label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="bg-black/60 text-white border-white/10" />
          </div>
          <div>
            <Label className="text-white/80">Apellido</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="bg-black/60 text-white border-white/10" />
          </div>
          <div>
            <Label className="text-white/80">Teléfono</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-black/60 text-white border-white/10" />
          </div>
          <div>
            <Label className="text-white/80">Empresa</Label>
            <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="bg-black/60 text-white border-white/10" />
          </div>
        </div>
        <DialogFooter className="flex gap-3">
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={saving} className="border-white/20 text-white">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}