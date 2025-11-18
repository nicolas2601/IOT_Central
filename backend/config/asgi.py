"""
Configuración ASGI para el proyecto Plataforma IoT.

Expone el callable ASGI como una variable a nivel de módulo llamada ``application``.

Para más información sobre este archivo, ver:
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/

ASGI (Asynchronous Server Gateway Interface) permite manejar:
- Peticiones HTTP tradicionales
- WebSockets para comunicación en tiempo real
- Otros protocolos asíncronos
"""

import os
import threading
import logging
from django.core.asgi import get_asgi_application

# Configurar el módulo de settings de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Inicializar Django ASGI application
django_application = get_asgi_application()

# Configuración de Channels para habilitar WebSockets con autenticación JWT
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from apps.iot_core.routing import websocket_urlpatterns
from .channels_auth import JWTAuthMiddlewareStack

logger = logging.getLogger(__name__)

# Iniciar MQTT listener en background
def start_mqtt_listener():
    """Inicia el listener MQTT en un thread separado"""
    try:
        from apps.iot_core.mqtt_client import MQTTClient
        
        mqtt_client = MQTTClient()
        
        def mqtt_loop():
            """Loop del cliente MQTT"""
            import time
            attempt = 0
            max_attempts = 0  # Infinito
            
            while True:
                try:
                    if not mqtt_client.connected:
                        attempt += 1
                        
                        if max_attempts > 0 and attempt > max_attempts:
                            logger.error("MQTT: Número máximo de intentos alcanzado")
                            break
                        
                        logger.info(f"MQTT: Intento de conexión #{attempt}...")
                        success = mqtt_client.connect()
                        
                        if success:
                            logger.info("✓ MQTT listener iniciado automáticamente")
                            attempt = 0
                        else:
                            logger.warning("MQTT: Error conectando. Reintentando en 5s...")
                            time.sleep(5)
                            continue
                    
                    time.sleep(1)
                    
                except Exception as e:
                    logger.error(f"Error en MQTT listener: {e}")
                    time.sleep(5)
        
        # Iniciar en thread daemon
        mqtt_thread = threading.Thread(target=mqtt_loop, daemon=True)
        mqtt_thread.start()
        logger.info("Thread MQTT listener iniciado")
        
    except Exception as e:
        logger.error(f"Error iniciando MQTT listener: {e}")

# Iniciar MQTT listener cuando se carga ASGI
start_mqtt_listener()

# Configuración de la aplicación ASGI con soporte HTTP y WebSocket
application = ProtocolTypeRouter({
    # Peticiones HTTP tradicionales
    "http": django_application,

    # Conexiones WebSocket (con validación de host y JWT auth)
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
