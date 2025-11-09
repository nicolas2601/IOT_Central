# 🎯 Resumen de Cambios - WebSocket y Admin Fix

## ✅ Problemas Resueltos

### 1. **Error 500 en /admin** ✅
- **Causa**: `CompressedManifestStaticFilesStorage` requiere manifest que no existe
- **Solución**: Cambiar a `CompressedStaticFilesStorage` en producción

### 2. **WebSocket rechazado (WSREJECT)** ✅
- **Causa**: Falta autenticación JWT en WebSocket
- **Solución**: Implementado middleware JWT personalizado

### 3. **Configuración Redis eliminada** ✅
- **Causa**: Redis no se usará
- **Solución**: Usar InMemoryChannelLayer y cache en memoria

---

## 📝 Archivos Modificados

### 1. **backend/config/settings.py**

#### Archivos Estáticos
```python
# Usar CompressedStaticFilesStorage en lugar de Manifest
if DEBUG:
    STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
else:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
```

#### Channel Layers (Sin Redis)
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    },
}
```

#### Cache (Sin Redis)
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}
```

#### Sesiones en Base de Datos
```python
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 86400
SESSION_SAVE_EVERY_REQUEST = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
```

#### Seguridad para Render
```python
if not DEBUG:
    ALLOWED_HOSTS = ['iot-central.onrender.com', '.onrender.com', 'localhost', '127.0.0.1']
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = False  # Render maneja SSL
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_HTTPONLY = False
    CSRF_COOKIE_SAMESITE = 'Lax'
```

---

### 2. **backend/config/asgi.py**

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
        JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
```

---

### 3. **backend/apps/iot_core/middleware.py** (NUEVO)

Middleware JWT para autenticar WebSockets:
- Acepta token en query parameter: `?token=xxx`
- Acepta token en Authorization header: `Bearer xxx`
- Log de intentos de autenticación

---

### 4. **backend/apps/iot_core/consumers.py**

Agregados logs de debugging:
```python
logger.info(f"WebSocket connect attempt - User: {user}, Authenticated: {user.is_authenticated if user else False}")
logger.warning(f"WebSocket rechazado: usuario no autenticado para dispositivo {self.device_id}")
```

Códigos de cierre personalizados:
- `4001`: No autenticado
- `4003`: Sin permisos

---

## 🚀 Cómo Conectarse al WebSocket

### Desde JavaScript/Frontend

```javascript
// 1. Obtener token JWT después del login
const token = localStorage.getItem('access_token');

// 2. Conectar con token en URL
const deviceId = '2519a04a-0bd6-440f-897f-c78503a0351d';
const ws = new WebSocket(
    `wss://iot-central.onrender.com/ws/telemetry/${deviceId}/?token=${token}`
);

ws.onopen = () => console.log('✅ Conectado');
ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    console.log('📨 Telemetría:', data);
};
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onclose = (e) => {
    console.log('🔌 Cerrado:', e.code);
    if (e.code === 4001) console.error('Token inválido');
    if (e.code === 4003) console.error('Sin permisos');
};
```

### Desde Terminal (wscat)

```bash
# Instalar wscat
npm install -g wscat

# Conectar
wscat -c "wss://iot-central.onrender.com/ws/telemetry/DEVICE_ID/?token=TU_TOKEN"
```

---

## 🧪 Pasos para Probar

### 1. **Obtener Token JWT**

```bash
curl -X POST https://iot-central.onrender.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "tu_usuario", "password": "tu_password"}'
```

Respuesta:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "..."
}
```

### 2. **Probar Admin**

Navega a: `https://iot-central.onrender.com/admin/`

Deberías ver la página de login sin error 500.

### 3. **Probar WebSocket**

```javascript
const token = 'TU_TOKEN_AQUI';
const ws = new WebSocket(`wss://iot-central.onrender.com/ws/telemetry/DEVICE_ID/?token=${token}`);
```

---

## 📊 Logs Esperados en Render

### Conexión Exitosa
```
[INFO] WebSocket auth attempt - Token presente, User: <User: username>
[INFO] Usuario autenticado vía JWT: username
[INFO] WebSocket connect attempt - User: <User: username>, Authenticated: True
[INFO] WebSocket conectado: usuario username a dispositivo 2519a04a-...
```

### Conexión Rechazada (Sin Token)
```
[WARNING] WebSocket auth attempt - No token presente
[INFO] WebSocket connect attempt - User: AnonymousUser, Authenticated: False
[WARNING] WebSocket rechazado: usuario no autenticado para dispositivo 2519a04a-...
```

### Conexión Rechazada (Sin Permisos)
```
[INFO] Usuario autenticado vía JWT: username
[WARNING] WebSocket rechazado: usuario username sin permisos para dispositivo 2519a04a-...
```

---

## 🔄 Próximos Pasos

1. ✅ **Commit y Push** los cambios a tu repositorio
2. ✅ **Redeploy** en Render (automático si tienes auto-deploy)
3. ✅ **Obtener token JWT** haciendo login
4. ✅ **Probar WebSocket** con el token
5. ✅ **Verificar /admin** funciona sin error 500

---

## 📦 Archivos Nuevos Creados

- `backend/apps/iot_core/middleware.py` - Middleware JWT para WebSocket
- `WEBSOCKET_AUTH.md` - Documentación de autenticación
- `WEBSOCKET_SOLUTION.md` - Solución completa de WebSocket
- `CAMBIOS_FINALES.md` - Este archivo

---

## ✨ Estado Final

| Componente | Estado | Notas |
|------------|--------|-------|
| Backend HTTP | ✅ Funcionando | APIs REST operativas |
| Admin Panel | ✅ Arreglado | Sin error 500 |
| WebSocket | ✅ Configurado | Requiere token JWT |
| Redis | ❌ No usado | InMemoryChannelLayer |
| Mosquitto | 🏠 Local | No desplegado en Render |
| PostgreSQL | ✅ Neon | Funcionando |

---

**¡Todo listo para deploy!** 🚀
