"""
Cliente MQTT para comunicación con dispositivos IoT

Maneja:
- Conexión al broker MQTT con reconexión automática
- Suscripción a topics de telemetría
- Publicación de comandos
- Procesamiento de mensajes thread-safe
"""
import json
import logging
import threading
import time
from typing import Optional, Dict, Any
import paho.mqtt.client as mqtt
from django.conf import settings
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


class MQTTClient:
    """
    Cliente MQTT Singleton thread-safe para la plataforma IoT.
    
    Características:
    - Patrón Singleton
    - Thread-safe con locks
    - Reconexión automática
    - Manejo robusto de errores
    - Logging detallado
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        """Implementa patrón Singleton thread-safe"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(MQTTClient, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Inicializa el cliente MQTT"""
        if self._initialized:
            return
        
        with self._lock:
            if self._initialized:
                return
            
            # Configuración del broker
            self.broker_host = getattr(settings, 'MQTT_BROKER_HOST', 'localhost')
            self.broker_port = getattr(settings, 'MQTT_BROKER_PORT', 1883)
            self.keepalive = getattr(settings, 'MQTT_KEEPALIVE', 60)
            self.client_id = getattr(settings, 'MQTT_CLIENT_ID', 'django_iot_platform')
            
            # Estado de conexión
            self.connected = False
            self.reconnect_delay = 5  # segundos
            self.max_reconnect_delay = 300  # 5 minutos
            
            # Crear cliente MQTT con protocolo v5 si está disponible
            try:
                self._client = mqtt.Client(
                    client_id=self.client_id,
                    protocol=mqtt.MQTTv311,
                    clean_session=True
                )
            except Exception as e:
                logger.error(f"Error creando cliente MQTT: {e}")
                self._client = mqtt.Client(client_id=self.client_id)
            
            # Configurar callbacks
            self._client.on_connect = self._on_connect
            self._client.on_disconnect = self._on_disconnect
            self._client.on_message = self._on_message
            self._client.on_subscribe = self._on_subscribe
            self._client.on_publish = self._on_publish
            self._client.on_log = self._on_log
            
            # Configurar will (mensaje de última voluntad)
            self._client.will_set(
                'plataforma/status',
                payload=json.dumps({'status': 'offline', 'timestamp': timezone.now().isoformat()}),
                qos=1,
                retain=True
            )
            
            self._initialized = True
            logger.info(f"Cliente MQTT inicializado: {self.client_id}")
    
    def connect(self) -> bool:
        """
        Conecta al broker MQTT con reintentos.
        
        Returns:
            bool: True si la conexión fue exitosa
        """
        if self.connected:
            logger.warning("Ya conectado al broker MQTT")
            return True
        
        try:
            logger.info(f"Conectando a broker MQTT: {self.broker_host}:{self.broker_port}")
            self._client.connect(
                self.broker_host,
                self.broker_port,
                self.keepalive
            )
            self._client.loop_start()
            
            # Esperar un momento para confirmar conexión
            time.sleep(2)
            
            if self.connected:
                logger.info("[OK] Conexión MQTT establecida exitosamente")
                return True
            else:
                logger.warning("Conexión MQTT iniciada pero no confirmada")
                return False
                
        except ConnectionRefusedError:
            logger.error(f"✗ Conexión rechazada por {self.broker_host}:{self.broker_port}")
            return False
        except Exception as e:
            logger.error(f"✗ Error conectando a broker MQTT: {type(e).__name__}: {str(e)}")
            return False
    
    def disconnect(self) -> bool:
        """
        Desconecta del broker MQTT de forma segura.
        
        Returns:
            bool: True si la desconexión fue exitosa
        """
        try:
            if self._client and self.connected:
                self._client.loop_stop()
                self._client.disconnect()
                self.connected = False
                logger.info("[OK] Desconectado del broker MQTT")
                return True
            return False
        except Exception as e:
            logger.error(f"✗ Error desconectando del broker MQTT: {str(e)}")
            return False
    
    def _on_connect(self, client, userdata, flags, rc):
        """
        Callback cuando se conecta al broker.
        
        Args:
            rc: Código de resultado de conexión
                0: Conexión exitosa
                1: Versión de protocolo incorrecta
                2: Identificador de cliente inválido
                3: Servidor no disponible
                4: Usuario/contraseña incorrectos
                5: No autorizado
        """
        if rc == 0:
            self.connected = True
            logger.info("[OK] Conectado exitosamente al broker MQTT")
            
            # Suscribirse a todos los topics necesarios
            topics = [
                ("dispositivo/+/telemetria", 1),
                ("dispositivo/+/estado", 1),
                ("dispositivo/+/comandos/respuesta", 1),
            ]
            
            for topic, qos in topics:
                result = client.subscribe(topic, qos)
                if result[0] == mqtt.MQTT_ERR_SUCCESS:
                    logger.info(f"[OK] Suscrito a topic: {topic} (QoS {qos})")
                else:
                    logger.error(f"✗ Error suscribiéndose a topic: {topic}")
            
            # Publicar estado online
            self._publish_platform_status('online')
            
        else:
            self.connected = False
            error_messages = {
                1: "Versión de protocolo incorrecta",
                2: "Identificador de cliente inválido",
                3: "Servidor no disponible",
                4: "Usuario/contraseña incorrectos",
                5: "No autorizado"
            }
            error_msg = error_messages.get(rc, f"Error desconocido (código {rc})")
            logger.error(f"✗ Error conectando al broker MQTT: {error_msg}")
    
    def _on_disconnect(self, client, userdata, rc):
        """
        Callback cuando se desconecta del broker.
        
        Args:
            rc: Código de desconexión
                0: Desconexión limpia
                Otro: Desconexión inesperada
        """
        self.connected = False
        
        if rc != 0:
            logger.warning(f"⚠ Desconexión inesperada del broker MQTT (código {rc})")
            logger.info("Intentando reconectar...")
            # El cliente intentará reconectar automáticamente
        else:
            logger.info("✓ Desconectado limpiamente del broker MQTT")
    
    def _on_subscribe(self, client, userdata, mid, granted_qos):
        """Callback cuando se completa una suscripción"""
        logger.debug(f"Suscripción confirmada (mid: {mid}, QoS: {granted_qos})")
    
    def _on_publish(self, client, userdata, mid):
        """Callback cuando se completa una publicación"""
        logger.debug(f"Publicación confirmada (mid: {mid})")
    
    def _on_log(self, client, userdata, level, buf):
        """Callback para logs del cliente MQTT"""
        # Solo logear en modo debug
        if level == mqtt.MQTT_LOG_ERR:
            logger.error(f"MQTT Error: {buf}")
        elif level == mqtt.MQTT_LOG_WARNING:
            logger.warning(f"MQTT Warning: {buf}")
        elif level == mqtt.MQTT_LOG_DEBUG:
            logger.debug(f"MQTT Debug: {buf}")
    
    def _publish_platform_status(self, status: str):
        """Publica el estado de la plataforma"""
        try:
            payload = {
                'status': status,
                'timestamp': timezone.now().isoformat(),
                'client_id': self.client_id
            }
            self.publish('plataforma/status', payload, qos=1)
            logger.debug(f"Estado de plataforma publicado: {status}")
        except Exception as e:
            logger.error(f"Error publicando estado de plataforma: {e}")
    
    def _on_message(self, client, userdata, msg):
        """
        Callback cuando se recibe un mensaje MQTT.
        Procesa telemetría, estado y respuestas de comandos.
        """
        try:
            topic = msg.topic
            payload = msg.payload.decode('utf-8')
            
            logger.debug(f"Mensaje recibido en topic {topic}: {payload}")
            
            # Parsear topic para extraer device_id
            topic_parts = topic.split('/')
            if len(topic_parts) < 3:
                logger.warning(f"Topic inválido: {topic}")
                return
            
            device_id = topic_parts[1]
            message_type = topic_parts[2]
            
            # Parsear payload JSON
            try:
                data = json.loads(payload)
            except json.JSONDecodeError:
                logger.error(f"Error parseando JSON: {payload}")
                return
            
            # Procesar según el tipo de mensaje
            if message_type == 'telemetria':
                self._process_telemetry(device_id, data)
            elif message_type == 'estado':
                self._process_status(device_id, data)
            elif message_type == 'comandos' and len(topic_parts) > 3 and topic_parts[3] == 'respuesta':
                self._process_command_response(device_id, data)
            
        except Exception as e:
            logger.error(f"Error procesando mensaje MQTT: {str(e)}")
    
    def _process_telemetry(self, device_id, data):
        """
        Procesa telemetría recibida de un dispositivo.
        Guarda en base de datos y notifica vía WebSocket.
        """
        try:
            from .models import Device, Telemetry
            
            # Buscar dispositivo
            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                logger.warning(f"Dispositivo no encontrado: {device_id}")
                return
            
            # Crear registro de telemetría
            telemetry = Telemetry.objects.create(
                device=device,
                timestamp=timezone.now(),
                data=data
            )
            
            # Actualizar última conexión del dispositivo
            device.update_last_connection()
            
            logger.info(f"Telemetría guardada para dispositivo {device.name}")
            
            # Notificar vía WebSocket
            self._notify_websocket(device_id, 'telemetry', {
                'id': telemetry.id,
                'device_id': str(device_id),
                'device_name': device.name,
                'timestamp': telemetry.timestamp.isoformat(),
                'data': data
            })
            
        except Exception as e:
            logger.error(f"Error procesando telemetría: {str(e)}")
    
    def _process_status(self, device_id, data):
        """Procesa actualización de estado de un dispositivo"""
        try:
            from .models import Device
            
            device = Device.objects.get(id=device_id)
            
            # Actualizar estado si viene en el payload
            if 'status' in data:
                device.status = data['status']
                device.save(update_fields=['status'])
            
            device.update_last_connection()
            
            logger.info(f"Estado actualizado para dispositivo {device.name}")
            
            # Notificar vía WebSocket
            self._notify_websocket(device_id, 'status', {
                'device_id': str(device_id),
                'status': device.status,
                'last_connection': device.last_connection.isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error procesando estado: {str(e)}")
    
    def _process_command_response(self, device_id, data):
        """Procesa respuesta de comando de un dispositivo"""
        try:
            from .models import Command
            
            command_id = data.get('command_id')
            status = data.get('status', 'executed')
            response = data.get('response', {})
            
            if not command_id:
                logger.warning("Respuesta de comando sin command_id")
                return
            
            # Buscar comando
            try:
                command = Command.objects.get(id=command_id)
            except Command.DoesNotExist:
                logger.warning(f"Comando no encontrado: {command_id}")
                return
            
            # Actualizar comando
            if status == 'executed':
                command.mark_as_executed(response)
            else:
                command.mark_as_failed(response.get('error', 'Error desconocido'))
            
            logger.info(f"Comando {command_id} actualizado: {status}")
            
            # Notificar vía WebSocket
            self._notify_websocket(device_id, 'command_response', {
                'command_id': str(command_id),
                'status': status,
                'response': response
            })
            
        except Exception as e:
            logger.error(f"Error procesando respuesta de comando: {str(e)}")
    
    def _notify_websocket(self, device_id, event_type, data):
        """
        Envía notificación a clientes WebSocket.
        Notifica tanto al grupo del dispositivo como al grupo del usuario propietario.
        """
        try:
            from .models import Device
            channel_layer = get_channel_layer()
            
            # Notificar al grupo del dispositivo específico
            device_group = f"device_{device_id}"
            async_to_sync(channel_layer.group_send)(
                device_group,
                {
                    'type': 'device_update',
                    'event_type': event_type,
                    'data': data
                }
            )
            
            # Obtener el dispositivo para notificar también al usuario propietario
            try:
                device = Device.objects.select_related('owner').get(id=device_id)
                user_group = f"user_devices_{device.owner.id}"
                
                # Notificar al grupo de dispositivos del usuario
                async_to_sync(channel_layer.group_send)(
                    user_group,
                    {
                        'type': 'device_status_update',
                        'data': {
                            'device_id': str(device_id),
                            'device_name': device.name,
                            'event_type': event_type,
                            'data': data
                        }
                    }
                )
                
                # Si es una alerta o evento importante, notificar también al canal de notificaciones
                if event_type in ['alert', 'error', 'command_failed']:
                    notification_group = f"user_notifications_{device.owner.id}"
                    async_to_sync(channel_layer.group_send)(
                        notification_group,
                        {
                            'type': 'notification',
                            'data': {
                                'device_id': str(device_id),
                                'device_name': device.name,
                                'event_type': event_type,
                                'message': data.get('message', f'Evento {event_type} en {device.name}'),
                                'timestamp': timezone.now().isoformat()
                            }
                        }
                    )
                
            except Device.DoesNotExist:
                logger.warning(f"Dispositivo no encontrado para notificación WebSocket: {device_id}")
            
            logger.debug(f"Notificación WebSocket enviada: {event_type} para {device_id}")
            
        except Exception as e:
            logger.error(f"Error enviando notificación WebSocket: {str(e)}")
    
    def send_command(self, command):
        """
        Envía un comando a un dispositivo vía MQTT.
        
        Args:
            command: Instancia del modelo Command
        """
        try:
            topic = f"dispositivo/{command.device.id}/comandos"
            
            payload = {
                'command_id': str(command.id),
                'command_type': command.command_type,
                'payload': command.payload,
                'timestamp': timezone.now().isoformat()
            }
            
            # Publicar mensaje
            result = self._client.publish(
                topic,
                json.dumps(payload),
                qos=1  # Al menos una vez
            )
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"Comando enviado: {command.command_type} a {command.device.name}")
                return True
            else:
                logger.error(f"Error enviando comando. Código: {result.rc}")
                return False
                
        except Exception as e:
            logger.error(f"Error enviando comando: {str(e)}")
            return False
    
    def publish(self, topic, payload, qos=0):
        """
        Publica un mensaje en un topic MQTT.
        
        Args:
            topic: Topic MQTT
            payload: Payload del mensaje (dict o string)
            qos: Quality of Service (0, 1, o 2)
        """
        try:
            if isinstance(payload, dict):
                payload = json.dumps(payload)
            
            result = self._client.publish(topic, payload, qos=qos)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.debug(f"Mensaje publicado en {topic}")
                return True
            else:
                logger.error(f"Error publicando mensaje. Código: {result.rc}")
                return False
                
        except Exception as e:
            logger.error(f"Error publicando mensaje: {str(e)}")
            return False
