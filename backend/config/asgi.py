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
from channels.security.websocket import AllowedHostsOriginValidator, OriginValidator

# Configurar el módulo de settings de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Inicializar Django ASGI application temprano para asegurar que
# el AppRegistry esté poblado antes de importar código que pueda importar modelos ORM.
django_asgi_app = get_asgi_application()

# Importar el routing de WebSockets después de inicializar Django
from apps.iot_core.routing import websocket_urlpatterns


class CustomOriginValidator(OriginValidator):
    """
    Validador de origen personalizado que permite conexiones desde Render
    y otros orígenes configurados en CORS_ALLOWED_ORIGINS
    """
    def valid_origin(self, parsed_origin):
        from django.conf import settings
        
        # Permitir localhost en desarrollo
        if settings.DEBUG:
            return True
        
        # Construir el origen completo
        origin = f"{parsed_origin[0]}://{parsed_origin[1]}"
        if parsed_origin[2] is not None:
            origin += f":{parsed_origin[2]}"
        
        # Verificar contra CORS_ALLOWED_ORIGINS
        allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        
        # Permitir cualquier subdominio de onrender.com (para Render)
        if '.onrender.com' in parsed_origin[1] or parsed_origin[1].endswith('onrender.com'):
            return True
        
        # Verificar origen exacto
        if origin in allowed_origins:
            return True
        
        # Verificar contra ALLOWED_HOSTS
        allowed_hosts = settings.ALLOWED_HOSTS
        for host in allowed_hosts:
            if host == '*':
                return True
            # Permitir wildcards como .onrender.com
            if host.startswith('.') and parsed_origin[1].endswith(host):
                return True
            if parsed_origin[1] == host:
                return True
        
        return False


# Configuración de la aplicación ASGI
application = ProtocolTypeRouter({
    # Peticiones HTTP tradicionales
    "http": django_asgi_app,
    
    # WebSocket connections
    "websocket": CustomOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        )
    ),
})
