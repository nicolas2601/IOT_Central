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
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

# Configurar el módulo de settings de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Inicializar Django ASGI application temprano para asegurar que
# el AppRegistry esté poblado antes de importar código que pueda importar modelos ORM.
django_asgi_app = get_asgi_application()

# Importar el routing de WebSockets después de inicializar Django
from apps.iot_core.routing import websocket_urlpatterns


# Configuración de la aplicación ASGI
application = ProtocolTypeRouter({
    # Peticiones HTTP tradicionales
    "http": django_asgi_app,
    
    # WebSocket connections - AllowedHostsOriginValidator usa ALLOWED_HOSTS
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        )
    ),
})
