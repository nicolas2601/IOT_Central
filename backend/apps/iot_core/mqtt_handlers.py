"""
Handlers para procesar mensajes MQTT

Contiene la lógica de negocio para procesar diferentes tipos
de mensajes recibidos de dispositivos IoT.
"""
import logging
from typing import Dict, Any, Optional
from django.utils import timezone
from django.db import transaction
from .models import Device, Telemetry, Command

logger = logging.getLogger(__name__)


class MQTTMessageHandler:
    """
    Clase para manejar mensajes MQTT de forma robusta.
    
    Proporciona métodos para procesar telemetría, comandos y estados
    con validación y manejo de errores completo.
    """
    
    @staticmethod
    def validate_device_exists(device_id: str) -> Optional[Device]:
        """
        Valida que un dispositivo exista y esté activo.
        
        Args:
            device_id: UUID del dispositivo
            
        Returns:
            Device si existe y está activo, None en caso contrario
        """
        try:
            device = Device.objects.get(id=device_id, is_active=True)
            return device
        except Device.DoesNotExist:
            logger.warning(f"Dispositivo no encontrado o inactivo: {device_id}")
            return None
        except Exception as e:
            logger.error(f"Error validando dispositivo {device_id}: {e}")
            return None
    
    @staticmethod
    def validate_telemetry_data(data: Dict[str, Any]) -> bool:
        """
        Valida que los datos de telemetría sean correctos.
        
        Args:
            data: Diccionario con datos de telemetría
            
        Returns:
            True si los datos son válidos
        """
        if not isinstance(data, dict):
            logger.error("Datos de telemetría no son un diccionario")
            return False
        
        if not data:
            logger.error("Datos de telemetría vacíos")
            return False
        
        # Validar que los valores sean serializables
        try:
            import json
            json.dumps(data)
            return True
        except (TypeError, ValueError) as e:
            logger.error(f"Datos de telemetría no serializables: {e}")
            return False
    
    @staticmethod
    @transaction.atomic
    def process_telemetry(device_id: str, data: Dict[str, Any]) -> Optional[Telemetry]:
        """
        Procesa y guarda telemetría de un dispositivo.
        
        Args:
            device_id: UUID del dispositivo
            data: Datos de telemetría
            
        Returns:
            Instancia de Telemetry si se guardó exitosamente, None en caso contrario
        """
        try:
            # Validar dispositivo
            device = MQTTMessageHandler.validate_device_exists(device_id)
            if not device:
                return None
            
            # Validar datos
            if not MQTTMessageHandler.validate_telemetry_data(data):
                return None
            
            # Crear registro de telemetría
            telemetry = Telemetry.objects.create(
                device=device,
                timestamp=timezone.now(),
                data=data
            )
            
            # Actualizar última conexión del dispositivo
            device.update_last_connection()
            
            logger.info(f"[OK] Telemetría guardada: {device.name} "
                f"(ID: {telemetry.id}, Métricas: {len(data)})"
            )
            
            return telemetry
            
        except Exception as e:
            logger.error(f"✗ Error procesando telemetría de {device_id}: {e}", exc_info=True)
            return None
    
    @staticmethod
    @transaction.atomic
    def process_device_status(device_id: str, status_data: Dict[str, Any]) -> bool:
        """
        Procesa actualización de estado de un dispositivo.
        
        Args:
            device_id: UUID del dispositivo
            status_data: Datos de estado
            
        Returns:
            True si se actualizó exitosamente
        """
        try:
            # Validar dispositivo
            device = MQTTMessageHandler.validate_device_exists(device_id)
            if not device:
                return False
            
            # Actualizar estado si viene en el payload
            if 'status' in status_data:
                new_status = status_data['status']
                
                # Validar que el estado sea válido
                valid_statuses = ['online', 'offline', 'error', 'maintenance']
                if new_status not in valid_statuses:
                    logger.warning(f"Estado inválido: {new_status}")
                    new_status = 'online'
                
                device.status = new_status
                device.save(update_fields=['status'])
                
                logger.info(f"[OK] Estado actualizado: {device.name} → {new_status}")
            
            # Actualizar última conexión
            device.update_last_connection()
            
            return True
            
        except Exception as e:
            logger.error(f"✗ Error procesando estado de {device_id}: {e}", exc_info=True)
            return False
    
    @staticmethod
    @transaction.atomic
    def process_command_response(
        device_id: str,
        response_data: Dict[str, Any]
    ) -> Optional[Command]:
        """
        Procesa respuesta de comando de un dispositivo.
        
        Args:
            device_id: UUID del dispositivo
            response_data: Datos de respuesta del comando
            
        Returns:
            Instancia de Command actualizado, None en caso contrario
        """
        try:
            # Validar que venga el command_id
            command_id = response_data.get('command_id')
            if not command_id:
                logger.error("Respuesta de comando sin command_id")
                return None
            
            # Buscar comando
            try:
                command = Command.objects.select_related('device').get(id=command_id)
            except Command.DoesNotExist:
                logger.warning(f"Comando no encontrado: {command_id}")
                return None
            
            # Validar que el dispositivo coincida
            if str(command.device.id) != str(device_id):
                logger.error(
                    f"Dispositivo no coincide: esperado {command.device.id}, "
                    f"recibido {device_id}"
                )
                return None
            
            # Obtener estado y respuesta
            status = response_data.get('status', 'executed')
            response = response_data.get('response', {})
            
            # Actualizar comando según el estado
            if status == 'executed':
                command.mark_as_executed(response)
                logger.info(
                    f"✓ Comando ejecutado: {command.command_type} "
                    f"en {command.device.name}"
                )
            elif status == 'failed':
                error_msg = response.get('error', 'Error desconocido')
                command.mark_as_failed(error_msg)
                logger.warning(
                    f"⚠ Comando fallido: {command.command_type} "
                    f"en {command.device.name} - {error_msg}"
                )
            else:
                logger.warning(f"Estado de comando desconocido: {status}")
                command.mark_as_failed(f"Estado desconocido: {status}")
            
            return command
            
        except Exception as e:
            logger.error(
                f"✗ Error procesando respuesta de comando de {device_id}: {e}",
                exc_info=True
            )
            return None
    
    @staticmethod
    def validate_command_payload(payload: Dict[str, Any]) -> bool:
        """
        Valida el payload de un comando.
        
        Args:
            payload: Payload del comando
            
        Returns:
            True si es válido
        """
        if not isinstance(payload, dict):
            logger.error("Payload de comando no es un diccionario")
            return False
        
        # Validar que sea serializable
        try:
            import json
            json.dumps(payload)
            return True
        except (TypeError, ValueError) as e:
            logger.error(f"Payload de comando no serializable: {e}")
            return False
    
    @staticmethod
    def log_message_received(topic: str, payload_size: int):
        """
        Registra la recepción de un mensaje MQTT.
        
        Args:
            topic: Topic del mensaje
            payload_size: Tamaño del payload en bytes
        """
        logger.debug(
            f"← Mensaje MQTT recibido: {topic} ({payload_size} bytes)"
        )
    
    @staticmethod
    def log_message_sent(topic: str, payload_size: int):
        """
        Registra el envío de un mensaje MQTT.
        
        Args:
            topic: Topic del mensaje
            payload_size: Tamaño del payload en bytes
        """
        logger.debug(
            f"→ Mensaje MQTT enviado: {topic} ({payload_size} bytes)"
        )
