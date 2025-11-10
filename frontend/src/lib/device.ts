import type { Device } from "@/types";

// Lógica de descripción idéntica a la usada en la página de detalle:
// description del dispositivo, o metadata.description; si no hay, "Sin descripción".
export function resolveDeviceDescription(device: Device): string {
  const raw = (device?.description ?? (device as any)?.metadata?.description ?? "");
  const str = typeof raw === "string" ? raw : String(raw ?? "");
  const trimmed = str.trim();
  return trimmed || "Sin descripción";
}