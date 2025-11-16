import type { DeviceTemplate, TelemetryProperty } from "@/lib/deviceTemplates";

type Schema = "double" | "boolean" | "string";

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function inferSchema(prop: TelemetryProperty): Schema {
  const t = prop.type ?? "number";
  if (t === "boolean") return "boolean";
  if (t === "string") return "string";
  return "double";
}

function inferDecimals(prop: TelemetryProperty): number | undefined {
  const unit = (prop.unit || "").toLowerCase();
  const name = prop.name.toLowerCase();
  // Heurísticas comunes para precisión visual
  if (name === "ph") return 1;
  if (unit.includes("°c") || name.includes("temperature")) return 1;
  if (unit.includes("%") || name.includes("humidity")) return 0;
  if (unit.includes("v")) return 2;
  if (unit.includes("dbm")) return 2;
  // Por defecto, 2 decimales para números
  return prop.type === "number" || !prop.type ? 2 : undefined;
}

function propertyToTemplate(prop: TelemetryProperty, baseId: string) {
  const schema = inferSchema(prop);
  const decimals = inferDecimals(prop);
  return {
    id: `${baseId}:${prop.name};1`,
    kind: "Telemetry" as const,
    name: prop.name,
    displayName: prop.displayName,
    schema,
    unit: prop.unit,
    min: typeof prop.min === "number" ? prop.min : undefined,
    max: typeof prop.max === "number" ? prop.max : undefined,
    decimals,
    notes: prop.notes,
  };
}

export function buildTelemetryTemplate(template: DeviceTemplate, deviceName: string) {
  const ifaceId = `iotc-local:${toSlug(deviceName)}:${template.id};1`;
  const baseId = `iotc-local:${toSlug(deviceName)}:${template.id}`;
  const telemetries = template.properties.map((p) => propertyToTemplate(p, baseId));

  const model = {
    templateVersion: 1,
    interface: {
      id: ifaceId,
      type: "Interface",
      displayName: deviceName,
      deviceType: template.deviceType,
    },
    telemetries,
    origin: {
      source: "template-catalog",
      templateId: template.id,
      templateName: template.name,
    },
  };

  return JSON.stringify(model, null, 2);
}