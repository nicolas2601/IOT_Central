"""
JWT authentication middleware for Django Channels.

Allows WebSocket clients to authenticate using a JWT `token`
provided via the query string, e.g.:
  ws://host/ws/telemetry/<device_id>/?token=<ACCESS_TOKEN>

If the token is valid, `scope['user']` will be set to the authenticated user.
Otherwise, it will default to `AnonymousUser`.
"""
from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
import logging

logger = logging.getLogger(__name__)


@database_sync_to_async
def get_user_from_token(token):
    """
    Valida el token JWT y retorna el usuario autenticado.
    """
    try:
        auth = JWTAuthentication()
        validated_token = auth.get_validated_token(token)
        user = auth.get_user(validated_token)
        logger.info(f"✓ Usuario autenticado vía JWT: {user.username}")
        return user
    except Exception as e:
        logger.warning(f"✗ Token JWT inválido: {str(e)}")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Default to anonymous user
        scope['user'] = AnonymousUser()

        try:
            query_string = scope.get('query_string', b'').decode()
            params = parse_qs(query_string)
            token = params.get('token', [None])[0]

            if token:
                scope['user'] = await get_user_from_token(token)
            else:
                logger.warning("✗ No se proporcionó token JWT en la conexión WebSocket")
        except Exception as e:
            logger.error(f"✗ Error procesando token JWT: {str(e)}")
            pass

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Wrap the default AuthMiddlewareStack with JWT support, so session auth
    continues to work while also supporting `?token=...` for WebSockets.
    """
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))