export type TelemetryProperty = {
  displayName: string;
  name: string;
  semantic?: string;
  unit?: string;
  min?: number;
  max?: number;
  type?: 'number' | 'boolean' | 'string';
  notes?: string;
};

export type DeviceTemplate = {
  id: string;
  name: string;
  description?: string;
  deviceType: 'sensor' | 'actuator' | 'gateway';
  properties: TelemetryProperty[];
};

// Catálogo de plantillas inspirado en Azure IoT Central
export const DEVICE_TEMPLATES: DeviceTemplate[] = [
  {
    id: 'boton-panico',
    name: 'Botón de Pánico',
    description: 'Dispositivo con evento de pánico (presionado/no).',
    deviceType: 'sensor',
    properties: [
      { displayName: 'Presionado', name: 'pressed', type: 'boolean', semantic: 'None' },
    ],
  },
  {
    id: 'hobo-mx-100',
    name: 'Hobo MX-100',
    description: 'Datalogger de temperatura/ambiente. Valores típicos de entorno.',
    deviceType: 'sensor',
    properties: [
      { displayName: 'Temperatura', name: 'temperature', semantic: 'Temperature', unit: '°C', type: 'number', min: -20, max: 60 },
      { displayName: 'Humedad relativa', name: 'humidity', semantic: 'None', unit: '%', type: 'number', min: 0, max: 100 },
    ],
  },
  {
    id: 'nivel-ruido',
    name: 'Nivel de Ruido',
    description: 'Medición acústica en dB.',
    deviceType: 'sensor',
    properties: [
      { displayName: 'Ruido', name: 'noise_db', semantic: 'None', unit: 'dB', type: 'number', min: 30, max: 130 },
    ],
  },
  {
    id: 'calidad-agua',
    name: 'Sensor de Calidad de Agua',
    description: 'Control de parámetros de agua.',
    deviceType: 'sensor',
    properties: [
      { displayName: 'pH', name: 'ph', semantic: 'None', type: 'number', min: 0, max: 14 },
      { displayName: 'Turbidez', name: 'turbidity', semantic: 'None', unit: 'NTU', type: 'number', min: 0, max: 100 },
      { displayName: 'Temperatura', name: 'temperature', semantic: 'Temperature', unit: '°C', type: 'number', min: 0, max: 50 },
    ],
  },
  {
    id: 'calidad-aire',
    name: 'Sensor de Calidad de Aire',
    description: 'Medición de calidad del aire (CO₂, PM2.5).',
    deviceType: 'sensor',
    properties: [
      { displayName: 'CO₂', name: 'co2', semantic: 'None', unit: 'ppm', type: 'number', min: 400, max: 5000 },
      { displayName: 'PM2.5', name: 'pm25', semantic: 'None', unit: 'µg/m³', type: 'number', min: 0, max: 500 },
    ],
  },
  {
    id: 'consumo-energetico',
    name: 'Sensor de Consumo Energético',
    description: 'Medición de potencia instantánea.',
    deviceType: 'sensor',
    properties: [
      { displayName: 'Potencia', name: 'power_w', semantic: 'None', unit: 'W', type: 'number', min: 0, max: 10000 },
    ],
  },
  {
    id: 'nivel-agua',
    name: 'Sensor de Nivel de Agua',
    description: 'Nivel de agua en depósitos/canales.',
    deviceType: 'sensor',
    properties: [
      { displayName: 'Nivel', name: 'water_level', semantic: 'None', unit: 'm', type: 'number', min: 0, max: 10 },
    ],
  },
  {
    id: 'presencia',
    name: 'Sensor de Presencia',
    description: 'Detección de presencia (pir).',
    deviceType: 'sensor',
    properties: [
      { displayName: 'Presencia', name: 'presence', semantic: 'None', type: 'boolean' },
    ],
  },
];

export const findTemplate = (id?: string): DeviceTemplate | undefined =>
  DEVICE_TEMPLATES.find((t) => t.id === id);