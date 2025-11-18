#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Simulador de telemetría para Plataforma IoT
# Generado a partir de las métricas definidas

import json
import time
import random
import argparse
import sys
try:
    import paho.mqtt.client as mqtt
except ImportError:
    print('✗ paho-mqtt no está instalado. Ejecuta: pip install paho-mqtt')
    sys.exit(1)


DEFAULT_BROKER_HOST = 'localhost'
DEFAULT_BROKER_PORT = 1883
DEFAULT_INTERVAL = 3  # segundos

def build_sample():
    # Construye una muestra de telemetría basada en las métricas definidas
    sample = {}
    sample['temperature'] = round(random.uniform(-40, 85), 1)
    sample['boton_panico'] = random.choice([True, False])
    sample['ph_agua'] = round(random.uniform(-39, 85), 2)
    return sample

def main():
    parser = argparse.ArgumentParser(description='Simulador de telemetría MQTT')
    parser.add_argument('--device-id', type=str, default='72741128-52f8-4490-bb1e-a386da75892f', help='ID del dispositivo (UUID)')
    parser.add_argument('--broker-host', type=str, default=DEFAULT_BROKER_HOST, help='Host del broker MQTT')
    parser.add_argument('--broker-port', type=int, default=DEFAULT_BROKER_PORT, help='Puerto del broker MQTT')
    parser.add_argument('--interval', type=float, default=DEFAULT_INTERVAL, help='Intervalo de envío en segundos')
    args = parser.parse_args()

    device_id = args.device_id
    topic = f'dispositivo/{device_id}/telemetria'

    client = mqtt.Client(client_id=f'simulator_${device_id}')
    try:
        client.connect(args.broker_host, args.broker_port, keepalive=60)
        print(f'✓ Conectado al broker MQTT: {args.broker_host}:{args.broker_port}')
    except Exception as e:
        print(f'✗ Error conectando al broker MQTT: {e}')
        sys.exit(1)

    print(f'→ Publicando en topic: {topic}')
    try:
        while True:
            sample = build_sample()
            payload = json.dumps(sample)
            result = client.publish(topic, payload, qos=1)
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f'✔ Enviado: {payload}')
            else:
                print(f'✗ Error enviando telemetría (código {result.rc})')
            time.sleep(args.interval)

    except KeyboardInterrupt:
        print('⏹ Detenido por usuario')
    finally:
        try:
            client.disconnect()
        except Exception:
            pass


if __name__ == '__main__':
    main()
