#!/usr/bin/env python3
"""
Simulador de Dispositivos IoT

Simula dispositivos IoT que envían telemetría y responden a comandos
vía MQTT para probar la plataforma.

Uso:
    python device_simulator.py --device-id abc-123 --device-type sensor
    python device_simulator.py --help
"""
import json
import time
import random
import argparse
import signal
import sys
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import paho.mqtt.client as mqtt

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('DeviceSimulator')


class IoTDeviceSimulator:
    """
    Simulador de dispositivo IoT.
    
    Características:
    - Envía telemetría periódicamente
    - Responde a comandos
    - Reporta estado
    - Reconexión automática
    """
    
    def __init__(
        self,
        device_id: str,
        device_type: str = 'sensor',
        broker_host: str = 'localhost',
        broker_port: int = 1883,
        telemetry_interval: int = 5
    ):
        """
        Inicializa el simulador.
        
        Args:
            device_id: ID único del dispositivo
            device_type: Tipo de dispositivo (sensor, actuator, gateway)
            broker_host: Host del broker MQTT
            broker_port: Puerto del broker MQTT
            telemetry_interval: Intervalo de envío de telemetría (segundos)
        """
        self.device_id = device_id
        self.device_type = device_type
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.telemetry_interval = telemetry_interval
        
        # Estado del dispositivo
        self.running = False
        self.connected = False
        self.temperature = 20.0  # Temperatura inicial
        self.humidity = 50.0     # Humedad inicial
        self.status = 'online'
        
        # Cliente MQTT
        self.client = mqtt.Client(client_id=f"simulator_{device_id}")
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
        
        # Topics
        self.topic_telemetry = f"dispositivo/{device_id}/telemetria"
        self.topic_commands = f"dispositivo/{device_id}/comandos"
        self.topic_status = f"dispositivo/{device_id}/estado"
        self.topic_command_response = f"dispositivo/{device_id}/comandos/respuesta"
        
        logger.info(f"✓ Simulador inicializado: {device_id} ({device_type})")
    
    def connect(self) -> bool:
        """Conecta al broker MQTT"""
        try:
            logger.info(f"→ Conectando a {self.broker_host}:{self.broker_port}...")
            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start()
            return True
        except Exception as e:
            logger.error(f"✗ Error conectando: {e}")
            return False
    
    def disconnect(self):
        """Desconecta del broker MQTT"""
        try:
            self.running = False
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("✓ Desconectado del broker")
        except Exception as e:
            logger.error(f"✗ Error desconectando: {e}")
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback cuando se conecta al broker"""
        if rc == 0:
            self.connected = True
            logger.info("✓ Conectado al broker MQTT")
            
            # Suscribirse a comandos
            client.subscribe(self.topic_commands, qos=1)
            logger.info(f"✓ Suscrito a: {self.topic_commands}")
            
            # Enviar estado inicial
            self._send_status('online')
        else:
            self.connected = False
            logger.error(f"✗ Error de conexión (código {rc})")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback cuando se desconecta del broker"""
        self.connected = False
        if rc != 0:
            logger.warning(f"⚠ Desconexión inesperada (código {rc})")
        else:
            logger.info("✓ Desconectado limpiamente")
    
    def _on_message(self, client, userdata, msg):
        """Callback cuando se recibe un mensaje"""
        try:
            payload = json.loads(msg.payload.decode('utf-8'))
            logger.info(f"← Comando recibido: {msg.topic}")
            logger.info(f"   Payload: {payload}")
            
            # Procesar comando
            self._process_command(payload)
            
        except Exception as e:
            logger.error(f"✗ Error procesando mensaje: {e}")
    
    def _process_command(self, command: Dict[str, Any]):
        """
        Procesa un comando recibido.
        
        Args:
            command: Diccionario con el comando
        """
        try:
            command_id = command.get('command_id')
            command_type = command.get('command_type')
            payload = command.get('payload', {})
            
            logger.info(f"→ Ejecutando comando: {command_type}")
            
            # Simular procesamiento
            time.sleep(0.5)
            
            # Procesar según el tipo de comando
            response = {}
            status = 'executed'
            
            if command_type == 'set_temperature':
                target = payload.get('target', 20.0)
                self.temperature = target
                response = {
                    'success': True,
                    'temperature': self.temperature,
                    'message': f'Temperatura ajustada a {target}°C'
                }
                logger.info(f"✓ Temperatura ajustada a {target}°C")
            
            elif command_type == 'set_humidity':
                target = payload.get('target', 50.0)
                self.humidity = target
                response = {
                    'success': True,
                    'humidity': self.humidity,
                    'message': f'Humedad ajustada a {target}%'
                }
                logger.info(f"✓ Humedad ajustada a {target}%")
            
            elif command_type == 'restart':
                response = {
                    'success': True,
                    'message': 'Dispositivo reiniciado'
                }
                logger.info("✓ Dispositivo reiniciado (simulado)")
            
            elif command_type == 'get_status':
                response = {
                    'success': True,
                    'status': self.status,
                    'temperature': self.temperature,
                    'humidity': self.humidity,
                    'uptime': time.time()
                }
                logger.info("✓ Estado enviado")
            
            else:
                status = 'failed'
                response = {
                    'success': False,
                    'error': f'Comando desconocido: {command_type}'
                }
                logger.warning(f"⚠ Comando desconocido: {command_type}")
            
            # Enviar respuesta
            self._send_command_response(command_id, status, response)
            
        except Exception as e:
            logger.error(f"✗ Error procesando comando: {e}")
            # Enviar respuesta de error
            self._send_command_response(
                command.get('command_id'),
                'failed',
                {'success': False, 'error': str(e)}
            )
    
    def _send_telemetry(self):
        """Envía telemetría al broker"""
        try:
            # Simular variación de sensores
            self.temperature += random.uniform(-0.5, 0.5)
            self.humidity += random.uniform(-1.0, 1.0)
            
            # Mantener en rangos realistas
            self.temperature = max(15.0, min(35.0, self.temperature))
            self.humidity = max(30.0, min(80.0, self.humidity))
            
            # Crear payload de telemetría
            telemetry = {
                'temperatura': round(self.temperature, 2),
                'humedad': round(self.humidity, 2),
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
            
            # Agregar datos adicionales según el tipo de dispositivo
            if self.device_type == 'sensor':
                telemetry['presion'] = round(random.uniform(1010, 1020), 2)
                telemetry['luz'] = random.randint(100, 1000)
            elif self.device_type == 'actuator':
                telemetry['estado_motor'] = random.choice(['on', 'off'])
                telemetry['velocidad'] = random.randint(0, 100)
            elif self.device_type == 'gateway':
                telemetry['dispositivos_conectados'] = random.randint(1, 10)
                telemetry['señal_wifi'] = random.randint(-80, -30)
            
            # Publicar telemetría
            payload = json.dumps(telemetry)
            result = self.client.publish(
                self.topic_telemetry,
                payload,
                qos=1
            )
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"→ Telemetría enviada: T={telemetry['temperatura']}°C, H={telemetry['humedad']}%")
            else:
                logger.error(f"✗ Error enviando telemetría (código {result.rc})")
                
        except Exception as e:
            logger.error(f"✗ Error generando telemetría: {e}")
    
    def _send_status(self, status: str):
        """Envía estado del dispositivo"""
        try:
            status_data = {
                'status': status,
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'device_type': self.device_type
            }
            
            payload = json.dumps(status_data)
            self.client.publish(self.topic_status, payload, qos=1)
            logger.info(f"→ Estado enviado: {status}")
            
        except Exception as e:
            logger.error(f"✗ Error enviando estado: {e}")
    
    def _send_command_response(
        self,
        command_id: str,
        status: str,
        response: Dict[str, Any]
    ):
        """Envía respuesta a un comando"""
        try:
            response_data = {
                'command_id': command_id,
                'status': status,
                'response': response,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
            
            payload = json.dumps(response_data)
            self.client.publish(
                self.topic_command_response,
                payload,
                qos=1
            )
            logger.info(f"→ Respuesta de comando enviada: {status}")
            
        except Exception as e:
            logger.error(f"✗ Error enviando respuesta: {e}")
    
    def run(self):
        """Ejecuta el simulador"""
        self.running = True
        logger.info("=" * 70)
        logger.info(f"  Simulador de Dispositivo IoT")
        logger.info("=" * 70)
        logger.info(f"  Device ID: {self.device_id}")
        logger.info(f"  Tipo: {self.device_type}")
        logger.info(f"  Broker: {self.broker_host}:{self.broker_port}")
        logger.info(f"  Intervalo: {self.telemetry_interval}s")
        logger.info("=" * 70)
        logger.info("")
        
        # Conectar
        if not self.connect():
            logger.error("✗ No se pudo conectar al broker")
            return
        
        # Esperar conexión
        time.sleep(2)
        
        if not self.connected:
            logger.error("✗ No se estableció la conexión")
            return
        
        logger.info("✓ Simulador en ejecución (Ctrl+C para detener)")
        logger.info("")
        
        # Loop principal
        last_telemetry = time.time()
        
        try:
            while self.running:
                current_time = time.time()
                
                # Enviar telemetría periódicamente
                if current_time - last_telemetry >= self.telemetry_interval:
                    if self.connected:
                        self._send_telemetry()
                    last_telemetry = current_time
                
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            logger.info("")
            logger.info("⚠ Interrupción detectada...")
        finally:
            self._send_status('offline')
            self.disconnect()
            logger.info("")
            logger.info("=" * 70)
            logger.info("  Simulador detenido")
            logger.info("=" * 70)


def main():
    """Función principal"""
    parser = argparse.ArgumentParser(
        description='Simulador de Dispositivo IoT',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python device_simulator.py --device-id sensor-001 --device-type sensor
  python device_simulator.py --device-id actuator-001 --device-type actuator --interval 10
  python device_simulator.py --device-id gateway-001 --device-type gateway --broker mosquitto
        """
    )
    
    parser.add_argument(
        '--device-id',
        type=str,
        required=True,
        help='ID único del dispositivo (UUID o string)'
    )
    
    parser.add_argument(
        '--device-type',
        type=str,
        choices=['sensor', 'actuator', 'gateway', 'controller'],
        default='sensor',
        help='Tipo de dispositivo (default: sensor)'
    )
    
    parser.add_argument(
        '--broker',
        type=str,
        default='localhost',
        help='Host del broker MQTT (default: localhost)'
    )
    
    parser.add_argument(
        '--port',
        type=int,
        default=1883,
        help='Puerto del broker MQTT (default: 1883)'
    )
    
    parser.add_argument(
        '--interval',
        type=int,
        default=5,
        help='Intervalo de telemetría en segundos (default: 5)'
    )
    
    args = parser.parse_args()
    
    # Crear y ejecutar simulador
    simulator = IoTDeviceSimulator(
        device_id=args.device_id,
        device_type=args.device_type,
        broker_host=args.broker,
        broker_port=args.port,
        telemetry_interval=args.interval
    )
    
    # Manejar señales
    def signal_handler(sig, frame):
        logger.info("")
        logger.info("⚠ Señal de terminación recibida")
        simulator.running = False
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Ejecutar
    simulator.run()


if __name__ == '__main__':
    main()
