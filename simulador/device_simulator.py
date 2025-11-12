#!/usr/bin/env python3
"""
Simulador de Dispositivos IoT (Integrado con Plataforma IoT Central)
-------------------------------------------------------------------

✔ Recibe automáticamente el UUID real desde el backend Django.
✔ Publica telemetría en un broker MQTT remoto.
✔ Se adapta al tipo de dispositivo.
✔ Usa reconexión y logs mejorados.
"""

import json
import time
import random
import argparse
import signal
import sys
import logging
from datetime import datetime
from typing import Dict, Any
import paho.mqtt.client as mqtt
import requests
import socket

# =============================
# ⚙️ CONFIGURACIÓN GLOBAL
# =============================

BACKEND_BASE_URL = "https://iot-central.onrender.com/api"
DEFAULT_BROKER = "broker.hivemq.com"  # o el broker MQTT que uses en tu backend
DEFAULT_PORT = 1883

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger("IoTDeviceSimulator")


# =============================
# 🧠 CLASE PRINCIPAL
# =============================

class IoTDeviceSimulator:
    """Simulador de dispositivo IoT vinculado con el backend."""

    def __init__(self, device_id: str, device_type: str = "sensor",
                 broker_host: str = DEFAULT_BROKER,
                 broker_port: int = DEFAULT_PORT,
                 telemetry_interval: int = 5):
        self.device_id = device_id
        self.device_type = device_type
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.telemetry_interval = telemetry_interval
        self.client = mqtt.Client(client_id=f"simulator_{device_id}")

        self.connected = False
        self.running = False
        self.temperature = 22.0
        self.humidity = 50.0
        self.status = "online"

        # Topics
        self.topic_telemetry = f"devices/{device_id}/telemetry"
        self.topic_commands = f"devices/{device_id}/commands"
        self.topic_response = f"devices/{device_id}/commands/response"
        self.topic_status = f"devices/{device_id}/status"

        # MQTT Callbacks
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

    # =====================================
    # 🔌 CONEXIÓN MQTT
    # =====================================
    def connect(self):
        try:
            logger.info(f"🔗 Conectando al broker MQTT {self.broker_host}:{self.broker_port}")
            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start()
            return True
        except Exception as e:
            logger.error(f"❌ Error conectando al broker: {e}")
            return False

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()
        logger.info("🔌 Desconectado del broker.")

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            logger.info("✅ Conexión MQTT establecida.")
            self.client.subscribe(self.topic_commands)
            self._send_status("online")
        else:
            logger.error(f"❌ Error al conectar (código {rc})")

    def _on_disconnect(self, client, userdata, rc):
        self.connected = False
        if rc != 0:
            logger.warning("⚠️ Desconexión inesperada, intentando reconectar...")
            time.sleep(2)
            self.connect()

    # =====================================
    # 📡 TELEMETRÍA
    # =====================================
    def _send_telemetry(self):
        """Envía datos de telemetría simulados al broker."""
        try:
            # Simulación de sensores
            self.temperature += random.uniform(-0.3, 0.3)
            self.humidity += random.uniform(-1.0, 1.0)

            telemetry = {
                "device_id": self.device_id,
                "temperature": round(self.temperature, 2),
                "humidity": round(self.humidity, 2),
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "hostname": socket.gethostname()
            }

            # Variaciones por tipo
            if self.device_type == "sensor":
                telemetry["pressure"] = round(random.uniform(1000, 1020), 2)
                telemetry["light"] = random.randint(100, 900)
            elif self.device_type == "actuator":
                telemetry["motor_state"] = random.choice(["on", "off"])
                telemetry["speed"] = random.randint(0, 100)

            self.client.publish(self.topic_telemetry, json.dumps(telemetry))
            logger.info(f"📤 Telemetría enviada → {telemetry}")
        except Exception as e:
            logger.error(f"❌ Error enviando telemetría: {e}")

    # =====================================
    # ⚙️ ESTADO DEL DISPOSITIVO
    # =====================================
    def _send_status(self, status: str):
        payload = json.dumps({
            "device_id": self.device_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        })
        self.client.publish(self.topic_status, payload)
        logger.info(f"📶 Estado publicado: {status}")

    # =====================================
    # 🧭 COMANDOS
    # =====================================
    def _on_message(self, client, userdata, msg):
        try:
            command = json.loads(msg.payload.decode())
            logger.info(f"📥 Comando recibido: {command}")
            self._process_command(command)
        except Exception as e:
            logger.error(f"❌ Error procesando comando: {e}")

    def _process_command(self, command: Dict[str, Any]):
        cmd_type = command.get("command_type")
        payload = command.get("payload", {})
        response = {"success": True, "received": True}

        if cmd_type == "restart":
            self.status = "restarting"
            response["message"] = "Dispositivo reiniciado (simulado)"
        elif cmd_type == "calibrate":
            response["message"] = "Calibración completada"
        elif cmd_type == "read_data":
            response.update({
                "temperature": self.temperature,
                "humidity": self.humidity
            })
        else:
            response = {"success": False, "error": f"Comando desconocido: {cmd_type}"}

        self.client.publish(self.topic_response, json.dumps(response))
        logger.info(f"📤 Respuesta enviada: {response}")

    # =====================================
    # 🧾 LOOP PRINCIPAL
    # =====================================
    def run(self):
        if not self.connect():
            return

        self.running = True
        logger.info(f"🚀 Simulador iniciado para {self.device_id} ({self.device_type})")

        try:
            while self.running:
                if self.connected:
                    self._send_telemetry()
                time.sleep(self.telemetry_interval)
        except KeyboardInterrupt:
            logger.info("🛑 Interrupción detectada. Cerrando simulador...")
        finally:
            self._send_status("offline")
            self.disconnect()


# =============================
# 🧩 FUNCIÓN PRINCIPAL
# =============================
def main():
    parser = argparse.ArgumentParser(description="Simulador de Dispositivo IoT")
    parser.add_argument("--device-id", type=str, required=True, help="UUID del dispositivo (desde backend)")
    parser.add_argument("--device-type", type=str, default="sensor", help="Tipo de dispositivo")
    parser.add_argument("--broker", type=str, default=DEFAULT_BROKER, help="Broker MQTT")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Puerto MQTT")
    parser.add_argument("--interval", type=int, default=5, help="Intervalo de envío en segundos")

    args = parser.parse_args()

    # Validar que el device-id exista en el backend antes de iniciar
    try:
        resp = requests.get(f"{BACKEND_BASE_URL}/devices/{args.device_id}/")
        if resp.status_code != 200:
            logger.error(f"❌ El dispositivo {args.device_id} no existe en el backend.")
            sys.exit(1)
    except Exception as e:
        logger.warning(f"⚠️ No se pudo validar el dispositivo: {e}")

    sim = IoTDeviceSimulator(
        device_id=args.device_id,
        device_type=args.device_type,
        broker_host=args.broker,
        broker_port=args.port,
        telemetry_interval=args.interval
    )

    signal.signal(signal.SIGINT, lambda sig, frame: setattr(sim, "running", False))
    sim.run()


if __name__ == "__main__":
    main()
