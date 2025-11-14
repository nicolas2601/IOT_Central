import type { Device, Alert, PaginatedResponse } from '@/types';
import { DEVICE_TEMPLATES } from './deviceTemplates';

const nowIso = () => new Date().toISOString();

export const mockDevices: Device[] = [
  {
    id: 'mock-1',
    name: 'Sensor Granja 01',
    device_type: 'sensor',
    description: 'Dispositivo demo (offline)',
    is_active: true,
    status: 'online',
    last_connection: nowIso(),
    metadata: {
      template: {
        ...DEVICE_TEMPLATES[0],
      },
    },
    owner: 1,
    owner_username: 'demo',
    owner_email: 'demo@example.com',
    location: 'Granja A',
    latitude: 0,
    longitude: 0,
    telemetry_count: 0,
    command_count: 0,
    is_online: true,
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    id: 'mock-2',
    name: 'Sensor Granja 02',
    device_type: 'sensor',
    description: 'Dispositivo demo (offline)',
    is_active: true,
    status: 'offline',
    last_connection: nowIso(),
    metadata: {
      template: {
        ...DEVICE_TEMPLATES[0],
      },
    },
    owner: 1,
    owner_username: 'demo',
    owner_email: 'demo@example.com',
    location: 'Granja B',
    latitude: 0,
    longitude: 0,
    telemetry_count: 0,
    command_count: 0,
    is_online: false,
    created_at: nowIso(),
    updated_at: nowIso(),
  },
];

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    device: 'mock-1',
    device_name: 'Sensor Granja 01',
    name: 'Temperatura alta',
    rule_type: 'threshold',
    condition: { metric: 'temperatura', operator: '>', value: 30 },
    severity: 'medium',
    is_active: true,
    notify_email: false,
    created_at: nowIso(),
    last_triggered: undefined,
    triggered_count: 0,
  },
];

export const paginated = <T,>(items: T[]): PaginatedResponse<T> => ({
  count: items.length,
  next: undefined,
  previous: undefined,
  results: items,
});