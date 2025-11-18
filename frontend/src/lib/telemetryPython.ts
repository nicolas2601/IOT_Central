// Generador de script Python para simular telemetría vía MQTT.
// No depende de plantillas; acepta una lista de campos de telemetría.
export type TelemetryField = {
  displayName: string;
  name: string;
  unit?: string;
  min?: number;
  max?: number;
  type?: 'number' | 'boolean' | 'string';
  notes?: string;
};

const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9_]/g, "_");

function pythonValueForProperty(prop: TelemetryField): string {
  const name = sanitizeName(prop.name);
  const t = prop.type ?? "number";
  if (t === "boolean") return `random.choice([True, False])`;
  if (t === "string") return `"sample_" + str(random.randint(1, 100))`;
  // number
  const min = typeof prop.min === "number" ? prop.min : 0;
  const max = typeof prop.max === "number" ? prop.max : 100;
  // choose decimals heuristic
  const unit = (prop.unit || "").toLowerCase();
  const decimals = (() => {
    if (name.toLowerCase() === "ph") return 1;
    if (unit.includes("°c") || name.toLowerCase().includes("temperature")) return 1;
    if (unit.includes("%") || name.toLowerCase().includes("humidity")) return 0;
    if (unit.includes("v")) return 2;
    if (unit.includes("dbm")) return 2;
    return 2;
  })();
  return `round(random.uniform(${min}, ${max}), ${decimals})`;
}

export function buildPythonSimulatorScript(fields: TelemetryField[], deviceId: string): string {
  const lines: string[] = [];
  lines.push("#!/usr/bin/env python3");
  lines.push("# -*- coding: utf-8 -*-");
  lines.push("\n# Simulador de telemetría para Plataforma IoT");
  lines.push("# Generado a partir de las métricas definidas\n");
  lines.push("import json");
  lines.push("import time");
  lines.push("import random");
  lines.push("import argparse");
  lines.push("import sys");
  lines.push("try:\n    import paho.mqtt.client as mqtt\nexcept ImportError:\n    print('✗ paho-mqtt no está instalado. Ejecuta: pip install paho-mqtt')\n    sys.exit(1)\n");

  lines.push("\nDEFAULT_BROKER_HOST = 'iotcentral.duckdns.org'");
  lines.push("DEFAULT_BROKER_PORT = 1883");
  lines.push("DEFAULT_INTERVAL = 3  # segundos\n");

  lines.push("def build_sample():");
  lines.push("    " + "# Construye una muestra de telemetría basada en las métricas definidas");
  lines.push("    sample = {}");
  for (const prop of fields) {
    const key = sanitizeName(prop.name);
    const valueExpr = pythonValueForProperty(prop);
    lines.push(`    sample['${key}'] = ${valueExpr}`);
  }
  lines.push("    return sample\n");

  lines.push("def main():");
  lines.push("    parser = argparse.ArgumentParser(description='Simulador de telemetría MQTT')");
  lines.push("    parser.add_argument('--device-id', type=str, default='" + deviceId + "', help='ID del dispositivo (UUID)')");
  lines.push("    parser.add_argument('--broker-host', type=str, default=DEFAULT_BROKER_HOST, help='Host del broker MQTT')");
  lines.push("    parser.add_argument('--broker-port', type=int, default=DEFAULT_BROKER_PORT, help='Puerto del broker MQTT')");
  lines.push("    parser.add_argument('--interval', type=float, default=DEFAULT_INTERVAL, help='Intervalo de envío en segundos')");
  lines.push("    args = parser.parse_args()\n");

  lines.push("    device_id = args.device_id");
  lines.push("    topic = f'dispositivo/{device_id}/telemetria'\n");

  lines.push("    client = mqtt.Client(client_id=f'simulator_${device_id}')");
  lines.push("    try:");
  lines.push("        client.connect(args.broker_host, args.broker_port, keepalive=60)");
  lines.push("        print(f'✓ Conectado al broker MQTT: {args.broker_host}:{args.broker_port}')");
  lines.push("    except Exception as e:");
  lines.push("        print(f'✗ Error conectando al broker MQTT: {e}')");
  lines.push("        sys.exit(1)\n");

  lines.push("    print(f'→ Publicando en topic: {topic}')");
  lines.push("    try:");
  lines.push("        while True:");
  lines.push("            sample = build_sample()");
  lines.push("            payload = json.dumps(sample)");
  lines.push("            result = client.publish(topic, payload, qos=1)");
  lines.push("            if result.rc == mqtt.MQTT_ERR_SUCCESS:");
  lines.push("                print(f'✔ Enviado: {payload}')");
  lines.push("            else:");
  lines.push("                print(f'✗ Error enviando telemetría (código {result.rc})')");
  lines.push("            time.sleep(args.interval)\n");
  lines.push("    except KeyboardInterrupt:");
  lines.push("        print('⏹ Detenido por usuario')");
  lines.push("    finally:");
  lines.push("        try:\n            client.disconnect()\n        except Exception:\n            pass\n");

  lines.push("\nif __name__ == '__main__':");
  lines.push("    main()\n");

  return lines.join("\n");
}