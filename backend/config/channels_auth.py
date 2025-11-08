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
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Default to anonymous user
        scope['user'] = AnonymousUser()

        try:
            query_string = scope.get('query_string', b'').decode()
            params = parse_qs(query_string)
            token = params.get('token', [None])[0]

            if token:
                auth = JWTAuthentication()
                validated_token = auth.get_validated_token(token)
                user = auth.get_user(validated_token)
                scope['user'] = user
        except Exception:
            # Silently ignore invalid tokens; connection will be closed in consumer
            pass

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Wrap the default AuthMiddlewareStack with JWT support, so session auth
    continues to work while also supporting `?token=...` for WebSockets.
    """
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))