/**
 * Tipos TypeScript para la Plataforma IoT
 */

// ============================================
// TIPOS DE AUTENTICACIÓN
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  company_name?: string;
  role: 'admin' | 'user' | 'viewer';
  phone?: string;
  avatar?: string;
  is_active: boolean;
  device_count: number;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  phone?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  message: string;
  access: string;
  refresh: string;
  user: User;
}

// ============================================
// TIPOS DE DISPOSITIVOS
// ============================================

export type DeviceType = 'sensor' | 'actuator' | 'gateway' | 'controller' | 'other';
export type DeviceStatus = 'online' | 'offline' | 'error' | 'maintenance';

export interface Device {
  id: string;
  name: string;
  device_type: DeviceType;
  description?: string;
  is_active: boolean;
  status: DeviceStatus;
  last_connection?: string;
  metadata: Record<string, any>;
  owner: number;
  owner_username: string;
  owner_email: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  telemetry_count: number;
  command_count: number;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviceCreateData {
  name: string;
  device_type: DeviceType;
  description?: string;
  metadata?: Record<string, any>;
  location?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================
// TIPOS DE TELEMETRÍA
// ============================================

export interface Telemetry {
  id: number;
  device: string;
  device_name: string;
  device_type: DeviceType;
  timestamp: string;
  data: Record<string, any>;
  received_at: string;
}

export interface TelemetryStats {
  device_id: string;
  device_name: string;
  start_date: string;
  end_date: string;
  total_records: number;
  metrics: Record<string, {
    avg: number;
    min: number;
    max: number;
    count: number;
  }>;
}

// ============================================
// TIPOS DE COMANDOS
// ============================================

export type CommandStatus = 'pending' | 'sent' | 'executed' | 'failed' | 'timeout';

export interface Command {
  id: string;
  device: string;
  device_name: string;
  command_type: string;
  payload: Record<string, any>;
  status: CommandStatus;
  created_at: string;
  sent_at?: string;
  executed_at?: string;
  response?: Record<string, any>;
  created_by: number;
  created_by_username: string;
  execution_time?: number;
}

export interface CommandCreateData {
  device: string;
  command_type: string;
  payload: Record<string, any>;
}

// ============================================
// TIPOS DE ALERTAS
// ============================================

export type RuleType = 'threshold' | 'range' | 'change' | 'offline';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  device: string;
  device_name: string;
  name: string;
  rule_type: RuleType;
  condition: Record<string, any>;
  severity: Severity;
  is_active: boolean;
  notify_email: boolean;
  notify_webhook?: string;
  created_at: string;
  last_triggered?: string;
  triggered_count: number;
}

export interface AlertCreateData {
  device: string;
  name: string;
  rule_type: RuleType;
  condition: Record<string, any>;
  severity: Severity;
  notify_email?: boolean;
  notify_webhook?: string;
}

// ============================================
// TIPOS DE DASHBOARD
// ============================================

export interface DashboardStats {
  total_devices: number;
  active_devices: number;
  online_devices: number;
  offline_devices: number;
  devices_by_type: Array<{
    device_type: DeviceType;
    count: number;
  }>;
  recent_telemetry_24h: number;
  recent_commands_24h: number;
  active_alerts: number;
  timestamp: string;
}

// ============================================
// TIPOS DE API
// ============================================

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// ============================================
// TIPOS DE WEBSOCKET
// ============================================

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface TelemetryWebSocketMessage {
  type: 'telemetry' | 'status' | 'command_response';
  data: {
    id?: number;
    device_id: string;
    device_name?: string;
    timestamp?: string;
    data?: Record<string, any>;
    status?: DeviceStatus;
    last_connection?: string;
    command_id?: string;
    response?: Record<string, any>;
  };
}
