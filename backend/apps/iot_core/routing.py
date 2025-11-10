"""
Routing de WebSockets para la aplicación IoT Core

Define las rutas WebSocket para:
- Telemetría en tiempo real por dispositivo
- Estado de dispositivos
- Notificaciones generales
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # WebSocket para telemetría de un dispositivo específico
    # ws://localhost:8000/ws/telemetry/{device_id}/
    # Anclas explícitas ^ y $ para asegurar coincidencia exacta
    re_path(
        r'^ws/telemetry/(?P<device_id>[0-9a-fA-F-]+)/$',
        consumers.TelemetryConsumer.as_asgi()
    ),

    # WebSocket para estado de todos los dispositivos del usuario
    # ws://localhost:8000/ws/devices/status/
    re_path(
        r'^ws/devices/status/$',
        consumers.DeviceStatusConsumer.as_asgi()
    ),

    # WebSocket para notificaciones generales
    # ws://localhost:8000/ws/notifications/
    re_path(
        r'^ws/notifications/$',
        consumers.NotificationConsumer.as_asgi()
    ),
]
