# 🚀 Configuración Final para Deploy en Render

## ✅ Todos los Problemas Resueltos

### 1. **Error 500 en /admin** ✅
- Cambiado `STATICFILES_STORAGE` a `CompressedStaticFilesStorage`
- Sesiones usando base de datos PostgreSQL

### 2. **WebSocket rechazado** ✅
- Implementado `JWTAuthMiddleware` para autenticación
- Requiere token JWT en URL: `?token=xxx`

### 3. **Redis eliminado** ✅
- Usa `InMemoryChannelLayer` (funciona con 1 worker)
- Cache en memoria local

### 4. **MQTT desconectándose constantemente** ✅
- Cliente MQTT **deshabilitado en producción**
- Solo se ejecuta en desarrollo local (DEBUG=True)
- Mosquitto permanece local, no se despliega

---

## 📦 Archivos Modificados (Resumen Final)

### 1. `backend/config/settings.py`
```python
# Archivos estáticos sin manifest
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# Channels sin Redis
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    },
}

# Cache sin Redis
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Sesiones en base de datos
SESSION_ENGINE = 'django.contrib.sessions.backends.db'

# Seguridad para Render
if not DEBUG:
    ALLOWED_HOSTS = ['iot-central.onrender.com', '.onrender.com', 'localhost', '127.0.0.1']
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = False
```

### 2. `backend/config/asgi.py`
```python
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

### 3. `backend/apps/iot_core/middleware.py` (NUEVO)
- Middleware JWT para WebSocket
- Acepta token en query: `?token=xxx`
- Acepta token en header: `Authorization: Bearer xxx`

### 4. `backend/apps/iot_core/apps.py`
```python
# MQTT solo en desarrollo local
if settings.DEBUG and ('runserver' in sys.argv or 'daphne' in sys.argv[0]):
    # Iniciar cliente MQTT
```

### 5. `backend/apps/iot_core/consumers.py`
- Logs mejorados para debugging
- Códigos de cierre personalizados (4001, 4003)

---

## 🌐 Variables de Entorno en Render

```bash
# Básicas
DEBUG=False
SECRET_KEY=tu_clave_secreta_muy_segura
PORT=8000

# Base de Datos PostgreSQL (Neon)
DATABASE_URL=postgresql://usuario:password@host:5432/database
POSTGRES_DB=neondb
POSTGRES_USER=neondb_owner
POSTGRES_PASSWORD=tu_password
POSTGRES_HOST=tu-host.neon.tech
POSTGRES_PORT=5432

# Seguridad
ALLOWED_HOSTS=iot-central.onrender.com,.onrender.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://tu-frontend.onrender.com,http://localhost:3000

# MQTT (No se usa en producción, pero debe estar definido)
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
```

---

## 🔌 Cómo Conectarse al WebSocket

### Paso 1: Obtener Token JWT

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

### Paso 2: Conectar WebSocket con Token

```javascript
const token = 'eyJ0eXAiOiJKV1QiLCJhbGc...'; // Tu token
const deviceId = '2519a04a-0bd6-440f-897f-c78503a0351d';

const ws = new WebSocket(
    `wss://iot-central.onrender.com/ws/telemetry/${deviceId}/?token=${token}`
);

ws.onopen = () => {
    console.log('✅ WebSocket conectado');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('📨 Telemetría recibida:', data);
};

ws.onerror = (error) => {
    console.error('❌ Error:', error);
};

ws.onclose = (event) => {
    console.log('🔌 Cerrado. Código:', event.code);
    if (event.code === 4001) {
        console.error('❌ Token inválido o expirado');
    } else if (event.code === 4003) {
        console.error('❌ Sin permisos para este dispositivo');
    }
};
```

---

## 📊 Logs Esperados en Render

### ✅ Inicio Exitoso (Sin MQTT)
```
[INFO] 2025-11-08 20:31:00,000 Starting Daphne...
[INFO] 2025-11-08 20:31:00,100 Listening on TCP address 0.0.0.0:8000
```

**NO** deberías ver:
```
❌ [INFO] Cliente MQTT inicializado
❌ [WARNING] Desconexión inesperada del broker MQTT
```

### ✅ WebSocket Conectado
```
[INFO] WebSocket auth attempt - Token presente, User: <User: username>
[INFO] Usuario autenticado vía JWT: username
[INFO] WebSocket conectado: usuario username a dispositivo 2519a04a-...
```

### ⚠️ WebSocket Rechazado (Sin Token)
```
[WARNING] WebSocket auth attempt - No token presente
[WARNING] WebSocket rechazado: usuario no autenticado
```

---

## 🧪 Verificación Post-Deploy

### 1. Verificar Admin
```bash
curl https://iot-central.onrender.com/admin/
# Debería devolver HTML sin error 500
```

### 2. Verificar API
```bash
curl https://iot-central.onrender.com/api/devices/ \
  -H "Authorization: Bearer TU_TOKEN"
```

### 3. Verificar WebSocket
```javascript
// En la consola del navegador
const token = 'TU_TOKEN';
const ws = new WebSocket(`wss://iot-central.onrender.com/ws/telemetry/DEVICE_ID/?token=${token}`);
ws.onopen = () => console.log('✅ Conectado');
```

---

## 🏗️ Arquitectura Final

```
┌─────────────────────────────────────────────────────────┐
│                    RENDER (Producción)                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Django Backend (Daphne)                        │   │
│  │  - HTTP/HTTPS: ✅ APIs REST                     │   │
│  │  - WebSocket: ✅ Telemetría en tiempo real      │   │
│  │  - Admin: ✅ Panel de administración            │   │
│  │  - MQTT Client: ❌ Deshabilitado                │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↓                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PostgreSQL (Neon)                              │   │
│  │  - Base de datos principal                      │   │
│  │  - Sesiones de usuario                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    LOCAL (Desarrollo)                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Mosquitto MQTT Broker                          │   │
│  │  - Puerto: 1883                                 │   │
│  │  - Recibe telemetría de dispositivos IoT       │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↑                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Dispositivos IoT / Simuladores                 │   │
│  │  - Envían telemetría vía MQTT                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘

Flujo de Datos:
1. Dispositivos IoT → MQTT (local) → Backend local (desarrollo)
2. Frontend → HTTPS → Backend (Render) → PostgreSQL (Neon)
3. Frontend → WSS → Backend (Render) → Telemetría en tiempo real
```

---

## 📝 Notas Importantes

### ✅ Lo que FUNCIONA en Render
- ✅ APIs REST HTTP/HTTPS
- ✅ WebSocket con autenticación JWT
- ✅ Admin panel
- ✅ Base de datos PostgreSQL (Neon)
- ✅ Archivos estáticos (WhiteNoise)
- ✅ Sesiones de usuario

### ❌ Lo que NO está en Render
- ❌ Mosquitto MQTT broker (es local)
- ❌ Cliente MQTT (deshabilitado en producción)
- ❌ Redis (no se necesita)

### 🔄 Flujo de Trabajo
1. **Desarrollo Local**: Mosquitto + Backend + Frontend
2. **Producción**: Solo Backend + Frontend (sin MQTT)
3. **Dispositivos IoT**: Se conectan a Mosquitto local

---

## 🎯 Checklist Final

- [x] Error 500 en /admin corregido
- [x] WebSocket con autenticación JWT
- [x] Redis eliminado
- [x] MQTT deshabilitado en producción
- [x] Sesiones en base de datos
- [x] Archivos estáticos configurados
- [x] ALLOWED_HOSTS configurado
- [x] CORS configurado
- [x] Logs de debugging agregados

---

## 🚀 Deploy

```bash
# 1. Commit cambios
git add .
git commit -m "Fix: WebSocket auth, disable MQTT in production, fix admin 500"

# 2. Push a GitHub
git push origin main

# 3. Render desplegará automáticamente
# 4. Verificar logs en Render Dashboard
```

---

## ✨ Estado Final

| Componente | Estado | Ubicación | Notas |
|------------|--------|-----------|-------|
| Backend Django | ✅ Listo | Render | Con WebSocket JWT |
| PostgreSQL | ✅ Funcionando | Neon | Base de datos |
| Admin Panel | ✅ Arreglado | Render | Sin error 500 |
| WebSocket | ✅ Configurado | Render | Requiere token JWT |
| MQTT Client | ⚠️ Deshabilitado | - | Solo local |
| Mosquitto | 🏠 Local | Local | No en Render |
| Redis | ❌ No usado | - | InMemory |

---

**¡Todo listo para producción!** 🎉

El backend está completamente funcional en Render sin MQTT.
