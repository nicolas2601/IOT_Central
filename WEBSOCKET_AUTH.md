# 🔐 Autenticación WebSocket - Guía Completa

## 🚨 Problema Actual

El WebSocket está siendo **RECHAZADO** porque:
```
WSREJECT /ws/telemetry/2519a04a-0bd6-440f-897f-c78503a0351d/
```

**Razón**: El usuario no está autenticado. Los consumers de Django Channels requieren autenticación JWT.

---

## ✅ Soluciones

### **Opción 1: Conectar con Token JWT (Recomendado)**

Para conectarte al WebSocket desde el frontend, necesitas enviar el token JWT:

#### **JavaScript/TypeScript**

```javascript
// 1. Obtener el token JWT (después del login)
const token = localStorage.getItem('access_token'); // o donde guardes el token

// 2. Conectar al WebSocket con el token en la URL
const deviceId = '2519a04a-0bd6-440f-897f-c78503a0351d';
const wsUrl = `wss://iot-central.onrender.com/ws/telemetry/${deviceId}/?token=${token}`;

const ws = new WebSocket(wsUrl);

ws.onopen = () => {
    console.log('✅ WebSocket conectado');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('📨 Telemetría recibida:', data);
};

ws.onerror = (error) => {
    console.error('❌ Error WebSocket:', error);
};

ws.onclose = (event) => {
    console.log('🔌 WebSocket cerrado. Código:', event.code);
    if (event.code === 4001) {
        console.error('❌ No autenticado - Token inválido o expirado');
    } else if (event.code === 4003) {
        console.error('❌ Sin permisos para este dispositivo');
    }
};
```

#### **Códigos de Cierre Personalizados**
- `4001`: Usuario no autenticado
- `4003`: Usuario sin permisos para el dispositivo
- `1000`: Cierre normal

---

### **Opción 2: Middleware JWT para WebSocket**

Si prefieres enviar el token en los headers (más seguro), necesitas crear un middleware JWT personalizado.

#### **Crear archivo**: `backend/apps/iot_core/middleware.py`

```python
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        access_token = AccessToken(token_key)
        user_id = access_token['user_id']
        user = User.objects.get(id=user_id)
        return user
    except Exception:
        return AnonymousUser()

class JWTAuthMiddleware:
    """
    Middleware personalizado para autenticar WebSocket con JWT
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # Obtener token de query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()
        
        return await self.app(scope, receive, send)
```

#### **Actualizar**: `backend/config/asgi.py`

```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django_asgi_app = get_asgi_application()

from apps.iot_core.routing import websocket_urlpatterns
from apps.iot_core.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(  # ← Agregar middleware JWT
            URLRouter(
                websocket_urlpatterns
            )
        )
    ),
})
```

---

### **Opción 3: WebSocket Público (Solo para Testing)**

⚠️ **NO RECOMENDADO PARA PRODUCCIÓN**

Si solo quieres probar que el WebSocket funciona, puedes deshabilitar temporalmente la autenticación:

```python
# En backend/apps/iot_core/consumers.py
async def connect(self):
    self.device_id = self.scope['url_route']['kwargs']['device_id']
    self.room_group_name = f'device_{self.device_id}'
    
    # TEMPORAL: Aceptar sin autenticación
    await self.channel_layer.group_add(
        self.room_group_name,
        self.channel_name
    )
    
    await self.accept()
    logger.info(f"WebSocket conectado (sin auth): dispositivo {self.device_id}")
```

---

## 🧪 Prueba de Conexión

### **1. Obtener Token JWT**

```bash
curl -X POST https://iot-central.onrender.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tu_usuario",
    "password": "tu_password"
  }'
```

Respuesta:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### **2. Conectar con wscat (Terminal)**

```bash
# Instalar wscat si no lo tienes
npm install -g wscat

# Conectar con token
wscat -c "wss://iot-central.onrender.com/ws/telemetry/DEVICE_ID/?token=TU_TOKEN_AQUI"
```

### **3. Conectar desde el Navegador (Console)**

```javascript
const token = 'eyJ0eXAiOiJKV1QiLCJhbGc...'; // Tu token JWT
const deviceId = '2519a04a-0bd6-440f-897f-c78503a0351d';
const ws = new WebSocket(`wss://iot-central.onrender.com/ws/telemetry/${deviceId}/?token=${token}`);

ws.onopen = () => console.log('✅ Conectado');
ws.onmessage = (e) => console.log('📨', JSON.parse(e.data));
ws.onerror = (e) => console.error('❌', e);
ws.onclose = (e) => console.log('🔌 Cerrado:', e.code);
```

---

## 🔍 Verificar Logs en Render

Después de implementar el middleware JWT, verás en los logs:

```
[INFO] WebSocket connect attempt - User: <User: username>, Authenticated: True
[INFO] WebSocket conectado: usuario username a dispositivo 2519a04a-0bd6-440f-897f-c78503a0351d
```

Si falla:
```
[WARNING] WebSocket rechazado: usuario no autenticado para dispositivo 2519a04a-0bd6-440f-897f-c78503a0351d
```

---

## 📝 Resumen de Cambios Necesarios

### ✅ Ya Implementado
- ✅ Logs de debugging en consumers
- ✅ Códigos de cierre personalizados (4001, 4003)
- ✅ Configuración de ALLOWED_HOSTS para Render

### 🔧 Por Implementar (Elige una opción)

**Opción A - Middleware JWT (Recomendado)**:
1. Crear `backend/apps/iot_core/middleware.py`
2. Actualizar `backend/config/asgi.py`
3. Conectar desde frontend con `?token=...`

**Opción B - WebSocket Público (Solo Testing)**:
1. Modificar `consumers.py` para aceptar sin auth
2. ⚠️ Recordar revertir antes de producción

---

## 🎯 Próximos Pasos

1. **Implementa el middleware JWT** (Opción 1)
2. **Redeploy en Render**
3. **Prueba la conexión** con el token JWT
4. **Verifica los logs** en Render

---

## 🐛 Troubleshooting

### WebSocket se cierra con código 4001
- **Causa**: Token JWT inválido o expirado
- **Solución**: Obtén un nuevo token haciendo login

### WebSocket se cierra con código 4003
- **Causa**: El usuario no es dueño del dispositivo
- **Solución**: Verifica que el `device_id` pertenezca al usuario autenticado

### WebSocket se cierra inmediatamente sin código
- **Causa**: Error en el servidor o CORS
- **Solución**: Verifica los logs de Render

---

**¿Qué opción prefieres implementar?**
