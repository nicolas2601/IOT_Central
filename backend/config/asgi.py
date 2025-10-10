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
from django.core.asgi import get_asgi_application

# Configurar el módulo de settings de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Inicializar Django ASGI application
application = get_asgi_application()

# Configuración para Channels (comentado temporalmente para solucionar el error)
"""
# Solo descomentar cuando se haya configurado correctamente Channels
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

# Importar el routing de WebSockets después de inicializar Django
try:
    from apps.iot_core.routing import websocket_urlpatterns
    
    # Configuración de la aplicación ASGI con Channels
    application = ProtocolTypeRouter({
        # Peticiones HTTP tradicionales
        "http": application,
        
        # WebSocket connections
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(
                URLRouter(
                    websocket_urlpatterns
                )
            )
        ),
    })
except ImportError:
    # Si no se puede importar el routing, solo usar HTTP
    pass
"""
