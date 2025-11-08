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
django_application = get_asgi_application()

# Configuración de Channels para habilitar WebSockets con autenticación JWT
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from apps.iot_core.routing import websocket_urlpatterns
from .channels_auth import JWTAuthMiddlewareStack

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
