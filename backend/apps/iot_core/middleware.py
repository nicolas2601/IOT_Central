"""
Middleware personalizado para autenticación JWT en WebSockets
"""
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


@database_sync_to_async
def get_user_from_token(token_key):
    """
    Obtiene el usuario desde un token JWT
    """
    try:
        access_token = AccessToken(token_key)
        user_id = access_token['user_id']
        user = User.objects.get(id=user_id)
        logger.info(f"Usuario autenticado vía JWT: {user.username}")
        return user
    except Exception as e:
        logger.warning(f"Error autenticando token JWT: {str(e)}")
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    Middleware personalizado para autenticar WebSocket con JWT
    
    Acepta el token JWT de dos formas:
    1. Query parameter: ?token=xxx
    2. Subprotocol header (para compatibilidad con algunos clientes)
    """
    
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # Intentar obtener token de query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        # Si no hay token en query, intentar obtenerlo de headers
        if not token:
            headers = dict(scope.get('headers', []))
            # Buscar en Authorization header
            auth_header = headers.get(b'authorization', b'').decode()
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]  # Remover 'Bearer '
        
        # Autenticar usuario si hay token
        if token:
            scope['user'] = await get_user_from_token(token)
            logger.info(f"WebSocket auth attempt - Token presente, User: {scope['user']}")
        else:
            scope['user'] = AnonymousUser()
            logger.warning("WebSocket auth attempt - No token presente")
        
        return await self.app(scope, receive, send)
