#!/usr/bin/env python3
"""
Simulador de Dispositivos IoT - Integrado en Backend

Simula dispositivos IoT que envían telemetría vía MQTT.
Se ejecuta como subproceso desde Django.
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

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('DeviceSimulator')


class IoTDeviceSimulator:
    """Simulador de dispositivo IoT con MQTT"""
    
    def __init__(
        self,
        device_id: str,
        device_type: str = 'sensor',
        broker_host: str = 'localhost',
        broker_port: int = 1883,
        telemetry_interval: int = 5,
        template_properties: list = None
    ):
        self.device_id = device_id
        self.device_type = device_type
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.telemetry_interval = telemetry_interval
        self.template_properties = template_properties or []
        
        self.running = False
        self.connected = False
        self.status = 'online'
        
        # Inicializar valores según plantilla
        self.telemetry_values = self._init_telemetry_values()
        
        self.client = mqtt.Client(client_id=f"simulator_{device_id}")
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
        
        self.topic_telemetry = f"dispositivo/{device_id}/telemetria"
        self.topic_commands = f"dispositivo/{device_id}/comandos"
        self.topic_status = f"dispositivo/{device_id}/estado"
        self.topic_command_response = f"dispositivo/{device_id}/comandos/respuesta"
        
        logger.info(f"✓ Simulador inicializado: {device_id} ({device_type})")
    
    def _init_telemetry_values(self) -> dict:
        """Inicializa valores de telemetría según la plantilla"""
        values = {'timestamp': None}
        
        # Si hay propiedades en la plantilla, usarlas
        if self.template_properties:
            for prop in self.template_properties:
                prop_name = prop.get('name', '')
                prop_type = prop.get('type', 'number')
                
                # Valores iniciales según el tipo de propiedad
                if 'co2' in prop_name.lower():
                    values[prop_name] = random.uniform(400, 1000)
                elif 'pm' in prop_name.lower() or 'pm2.5' in prop_name.lower():
                    values[prop_name] = random.uniform(5, 50)
                elif 'temperatura' in prop_name.lower() or 'temperature' in prop_name.lower():
                    values[prop_name] = 20.0
                elif 'humedad' in prop_name.lower() or 'humidity' in prop_name.lower():
                    values[prop_name] = 50.0
                elif 'ph' in prop_name.lower():
                    values[prop_name] = random.uniform(6.5, 7.5)
                elif 'turbidez' in prop_name.lower() or 'turbidity' in prop_name.lower():
                    values[prop_name] = random.uniform(0, 10)
                elif 'ruido' in prop_name.lower() or 'noise' in prop_name.lower():
                    values[prop_name] = random.uniform(30, 80)
                elif 'potencia' in prop_name.lower() or 'power' in prop_name.lower():
                    values[prop_name] = random.uniform(100, 5000)
                elif 'nivel' in prop_name.lower() or 'level' in prop_name.lower():
                    values[prop_name] = random.uniform(0, 100)
                elif 'presencia' in prop_name.lower() or 'presence' in prop_name.lower():
                    values[prop_name] = random.choice([True, False])
                elif 'presionado' in prop_name.lower() or 'pressed' in prop_name.lower():
                    values[prop_name] = random.choice([True, False])
                else:
                    # Valor genérico
                    values[prop_name] = random.uniform(0, 100) if prop_type == 'number' else 'default'
        else:
            # Valores por defecto si no hay plantilla
            values['temperatura'] = 20.0
            values['humedad'] = 50.0
        
        return values
    
    def connect(self) -> bool:
        try:
            logger.info(f"→ Conectando a {self.broker_host}:{self.broker_port}...")
            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start()
            return True
        except Exception as e:
            logger.error(f"✗ Error conectando: {e}")
            return False
    
    def disconnect(self):
        try:
            self.running = False
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("✓ Desconectado del broker")
        except Exception as e:
            logger.error(f"✗ Error desconectando: {e}")
    
    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            logger.info("✓ Conectado al broker MQTT")
            client.subscribe(self.topic_commands, qos=1)
            logger.info(f"✓ Suscrito a: {self.topic_commands}")
            self._send_status('online')
        else:
            self.connected = False
            logger.error(f"✗ Error de conexión (código {rc})")
    
    def _on_disconnect(self, client, userdata, rc):
        self.connected = False
        if rc != 0:
            logger.warning(f"⚠ Desconexión inesperada (código {rc})")
        else:
            logger.info("✓ Desconectado limpiamente")
    
    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode('utf-8'))
            logger.info(f"← Comando recibido: {msg.topic}")
            logger.info(f"   Payload: {payload}")
            self._process_command(payload)
        except Exception as e:
            logger.error(f"✗ Error procesando mensaje: {e}")
    
    def _process_command(self, command: Dict[str, Any]):
        try:
            command_id = command.get('command_id')
            command_type = command.get('command_type')
            payload = command.get('payload', {})
            
            logger.info(f"→ Ejecutando comando: {command_type}")
            time.sleep(0.5)
            
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
            
            self._send_command_response(command_id, status, response)
            
        except Exception as e:
            logger.error(f"✗ Error procesando comando: {e}")
            self._send_command_response(
                command.get('command_id'),
                'failed',
                {'success': False, 'error': str(e)}
            )
    
    def _send_telemetry(self):
        try:
            telemetry = {}
            
            # Usar valores de plantilla si existen
            if self.template_properties:
                for prop in self.template_properties:
                    prop_name = prop.get('name', '')
                    current_val = self.telemetry_values.get(prop_name)
                    
                    if isinstance(current_val, bool):
                        # Alternar booleanos cada 2 ciclos
                        new_val = not current_val if random.random() > 0.7 else current_val
                        self.telemetry_values[prop_name] = new_val
                        telemetry[prop_name] = new_val
                    elif isinstance(current_val, (int, float)):
                        # Variar el valor ligeramente
                        if 'co2' in prop_name.lower():
                            new_val = current_val + random.uniform(-20, 20)
                            new_val = max(400, min(1200, new_val))
                        elif 'pm' in prop_name.lower():
                            new_val = current_val + random.uniform(-2, 2)
                            new_val = max(0, min(100, new_val))
                        elif 'temperatura' in prop_name.lower():
                            new_val = current_val + random.uniform(-0.5, 0.5)
                            new_val = max(15.0, min(35.0, new_val))
                        elif 'humedad' in prop_name.lower():
                            new_val = current_val + random.uniform(-1, 1)
                            new_val = max(30.0, min(80.0, new_val))
                        elif 'ph' in prop_name.lower():
                            new_val = current_val + random.uniform(-0.1, 0.1)
                            new_val = max(6.0, min(8.0, new_val))
                        elif 'turbidez' in prop_name.lower():
                            new_val = current_val + random.uniform(-0.5, 0.5)
                            new_val = max(0, min(20, new_val))
                        elif 'ruido' in prop_name.lower():
                            new_val = current_val + random.uniform(-2, 2)
                            new_val = max(20, min(100, new_val))
                        elif 'potencia' in prop_name.lower():
                            new_val = current_val + random.uniform(-100, 100)
                            new_val = max(0, min(10000, new_val))
                        elif 'nivel' in prop_name.lower():
                            new_val = current_val + random.uniform(-2, 2)
                            new_val = max(0, min(100, new_val))
                        else:
                            new_val = current_val + random.uniform(-5, 5)
                        
                        self.telemetry_values[prop_name] = new_val
                        telemetry[prop_name] = round(new_val, 2)
                    else:
                        telemetry[prop_name] = current_val
            else:
                # Fallback a valores genéricos
                telemetry['temperatura'] = 20.0
                telemetry['humedad'] = 50.0
            
            telemetry['timestamp'] = datetime.utcnow().isoformat() + 'Z'
            
            payload = json.dumps(telemetry)
            result = self.client.publish(
                self.topic_telemetry,
                payload,
                qos=1
            )
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"→ Telemetría enviada: {json.dumps(telemetry)}")
            else:
                logger.error(f"✗ Error enviando telemetría (código {result.rc})")
                
        except Exception as e:
            logger.error(f"✗ Error generando telemetría: {e}")
    
    def _send_status(self, status: str):
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
        
        if not self.connect():
            logger.error("✗ No se pudo conectar al broker")
            return
        
        time.sleep(2)
        
        if not self.connected:
            logger.error("✗ No se estableció la conexión")
            return
        
        logger.info("✓ Simulador en ejecución (Ctrl+C para detener)")
        logger.info("")
        
        last_telemetry = time.time()
        
        try:
            while self.running:
                current_time = time.time()
                
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
    parser = argparse.ArgumentParser(
        description='Simulador de Dispositivo IoT',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python device_simulator.py --device-id sensor-001 --device-type sensor
  python device_simulator.py --device-id actuator-001 --device-type actuator --interval 10
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
    
    parser.add_argument(
        '--template-properties',
        type=str,
        default='[]',
        help='Propiedades de plantilla en JSON (default: [])'
    )
    
    args = parser.parse_args()
    
    # Parsear propiedades de plantilla
    try:
        template_properties = json.loads(args.template_properties)
    except json.JSONDecodeError:
        logger.warning("No se pudo parsear template-properties, usando vacío")
        template_properties = []
    
    simulator = IoTDeviceSimulator(
        device_id=args.device_id,
        device_type=args.device_type,
        broker_host=args.broker,
        broker_port=args.port,
        telemetry_interval=args.interval,
        template_properties=template_properties
    )
    
    def signal_handler(sig, frame):
        logger.info("")
        logger.info("⚠ Señal de terminación recibida")
        simulator.running = False
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    simulator.run()


if __name__ == '__main__':
    main()
