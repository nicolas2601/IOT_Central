"""
Consumers de WebSocket para la aplicación IoT Core

Define los consumers para:
- Telemetría en tiempo real
- Estado de dispositivos
- Notificaciones
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)


class TelemetryConsumer(AsyncWebsocketConsumer):
    """
    Consumer para telemetría en tiempo real de un dispositivo específico.
    
    Permite a los clientes recibir actualizaciones de telemetría en tiempo real
    de un dispositivo específico.
    """
    
    async def connect(self):
        """Maneja la conexión WebSocket"""
        self.device_id = self.scope['url_route']['kwargs']['device_id']
        self.room_group_name = f'device_{self.device_id}'
        
        # Verificar autenticación
        user = self.scope.get('user')
        
        # Log para debugging
        logger.info(f"WebSocket connect attempt - User: {user}, Authenticated: {user.is_authenticated if user else False}")
        
        if not user or not user.is_authenticated:
            logger.warning(f"WebSocket rechazado: usuario no autenticado para dispositivo {self.device_id}")
            await self.close(code=4001)  # Código personalizado para "no autenticado"
            return
        
        # Verificar permisos del dispositivo
        has_permission = await self.check_device_permission(user, self.device_id)
        if not has_permission:
            logger.warning(f"WebSocket rechazado: usuario {user.username} sin permisos para dispositivo {self.device_id}")
            await self.close(code=4003)  # Código personalizado para "sin permisos"
            return
        
        # Unirse al grupo del dispositivo
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket conectado: usuario {user.username} a dispositivo {self.device_id}")
        
        # Enviar mensaje de bienvenida
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Conectado a telemetría del dispositivo {self.device_id}'
        }))
    
    async def disconnect(self, close_code):
        """Maneja la desconexión WebSocket"""
        # Salir del grupo
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"WebSocket desconectado: dispositivo {self.device_id}")
    
    async def receive(self, text_data):
        """Maneja mensajes recibidos del cliente"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', '')
            
            # Responder a ping
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
        except json.JSONDecodeError:
            logger.error(f"Error parseando mensaje WebSocket: {text_data}")
    
    async def device_update(self, event):
        """
        Maneja actualizaciones del dispositivo desde el grupo.
        Llamado por el MQTT client cuando hay nueva telemetría.
        """
        # Enviar mensaje al WebSocket
        await self.send(text_data=json.dumps({
            'type': event['event_type'],
            'data': event['data']
        }))
    
    @database_sync_to_async
    def check_device_permission(self, user, device_id):
        """Verifica si el usuario tiene permiso para ver el dispositivo"""
        try:
            from .models import Device
            device = Device.objects.get(id=device_id)
            return device.owner == user or user.is_admin
        except Device.DoesNotExist:
            return False


class DeviceStatusConsumer(AsyncWebsocketConsumer):
    """
    Consumer para estado de todos los dispositivos del usuario.
    
    Permite recibir actualizaciones de estado de todos los dispositivos
    del usuario en tiempo real.
    """
    
    async def connect(self):
        """Maneja la conexión WebSocket"""
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return
        
        self.user_id = user.id
        self.room_group_name = f'user_devices_{self.user_id}'
        
        # Unirse al grupo del usuario
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket conectado: estado de dispositivos para usuario {user.username}")
        
        # Enviar estado inicial de dispositivos
        devices_status = await self.get_user_devices_status(user)
        await self.send(text_data=json.dumps({
            'type': 'initial_status',
            'devices': devices_status
        }))
    
    async def disconnect(self, close_code):
        """Maneja la desconexión WebSocket"""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"WebSocket desconectado: estado de dispositivos")
    
    async def receive(self, text_data):
        """Maneja mensajes recibidos del cliente"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', '')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            elif message_type == 'refresh':
                # Enviar estado actualizado
                user = self.scope.get('user')
                devices_status = await self.get_user_devices_status(user)
                await self.send(text_data=json.dumps({
                    'type': 'status_update',
                    'devices': devices_status
                }))
        except json.JSONDecodeError:
            logger.error(f"Error parseando mensaje WebSocket: {text_data}")
    
    async def device_status_update(self, event):
        """Maneja actualizaciones de estado de dispositivos"""
        await self.send(text_data=json.dumps({
            'type': 'device_status_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_user_devices_status(self, user):
        """Obtiene el estado de todos los dispositivos del usuario"""
        from .models import Device
        from django.utils import timezone
        from datetime import timedelta
        
        devices = Device.objects.filter(owner=user, is_active=True)
        
        status_list = []
        for device in devices:
            is_online = False
            if device.last_connection:
                time_diff = timezone.now() - device.last_connection
                is_online = time_diff.total_seconds() < 300  # 5 minutos
            
            status_list.append({
                'id': str(device.id),
                'name': device.name,
                'status': device.status,
                'is_online': is_online,
                'last_connection': device.last_connection.isoformat() if device.last_connection else None
            })
        
        return status_list


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Consumer para notificaciones generales del usuario.
    
    Permite recibir alertas, notificaciones de comandos, etc.
    """
    
    async def connect(self):
        """Maneja la conexión WebSocket"""
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return
        
        self.user_id = user.id
        self.room_group_name = f'user_notifications_{self.user_id}'
        
        # Unirse al grupo de notificaciones del usuario
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket conectado: notificaciones para usuario {user.username}")
        
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Conectado a notificaciones'
        }))
    
    async def disconnect(self, close_code):
        """Maneja la desconexión WebSocket"""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"WebSocket desconectado: notificaciones")
    
    async def receive(self, text_data):
        """Maneja mensajes recibidos del cliente"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', '')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
        except json.JSONDecodeError:
            logger.error(f"Error parseando mensaje WebSocket: {text_data}")
    
    async def notification(self, event):
        """Maneja notificaciones enviadas al usuario"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': event['data']
        }))
    
    async def alert_triggered(self, event):
        """Maneja alertas activadas"""
        await self.send(text_data=json.dumps({
            'type': 'alert',
            'data': event['data']
        }))
