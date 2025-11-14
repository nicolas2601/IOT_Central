import { DeviceTemplate, TelemetryProperty, DEVICE_TEMPLATES, findTemplate } from './deviceTemplates';

export type ValidationResult = { valid: boolean; reason?: string };

export function getTemplateById(id?: string): DeviceTemplate | undefined {
  return id ? findTemplate(id) : undefined;
}

export function validateValue(prop: TelemetryProperty, value: unknown): ValidationResult {
  const type = prop.type ?? 'number';
  if (type === 'boolean') {
    const isBool = typeof value === 'boolean' || value === 0 || value === 1 || value === 'true' || value === 'false';
    return isBool ? { valid: true } : { valid: false, reason: 'Se esperaba booleano' };
  }
  if (type === 'string') {
    return typeof value === 'string' ? { valid: true } : { valid: false, reason: 'Se esperaba texto' };
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return { valid: false, reason: 'Valor no numérico' };
  if (typeof prop.min === 'number' && num < prop.min) return { valid: false, reason: `Menor a mínimo (${prop.min})` };
  if (typeof prop.max === 'number' && num > prop.max) return { valid: false, reason: `Mayor a máximo (${prop.max})` };
  return { valid: true };
}

export function validateTelemetry(templateId: string | undefined, payload: Record<string, unknown>): { ok: boolean; errors: Record<string, string> } {
  const tpl = getTemplateById(templateId);
  if (!tpl || tpl.properties.length === 0) return { ok: true, errors: {} };

  const propMap = new Map<string, TelemetryProperty>(tpl.properties.map(p => [p.name, p]));
  const errors: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    const prop = propMap.get(key);
    if (!prop) {
      errors[key] = 'Propiedad no definida en la plantilla';
      continue;
    }
    const result = validateValue(prop, value);
    if (!result.valid) errors[key] = result.reason ?? 'Valor inválido';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export const LISTED_TEMPLATES = DEVICE_TEMPLATES;