# 🔧 Solución: WebSocket y Error 500 en /admin

## 📋 Problemas Resueltos

### 1. **WebSocket rechazado en Render**
### 2. **Error 500 en /admin**

---

## ✅ Cambios Implementados

### 1. **Configuración de Channels (Sin Redis)**

**Archivo**: `backend/config/settings.py`

```python
# Usar in-memory channel layer (sin Redis)
# NOTA: En producción con un solo worker de Daphne, esto funciona correctamente
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    },
}
```

**Razón**: InMemoryChannelLayer funciona perfectamente con un solo worker de Daphne en Render. No necesitas Redis para WebSockets si no tienes múltiples workers.

---

### 2. **Configuración de Cache (Sin Redis)**

**Archivo**: `backend/config/settings.py`

```python
# Usar cache en memoria (sin Redis)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}
```

---

### 3. **Sesiones en Base de Datos (Fix Error 500)**

**Archivo**: `backend/config/settings.py`

```python
# Usar sesiones en base de datos (más confiable sin Redis)
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 86400  # 24 horas
SESSION_SAVE_EVERY_REQUEST = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
```

**Razón**: El error 500 en `/admin` era causado por intentar usar sesiones en cache sin Redis configurado. Ahora usa la base de datos PostgreSQL.

---

### 4. **Validador de Origen Mejorado para WebSocket**

**Archivo**: `backend/config/asgi.py`

Se implementó `CustomOriginValidator` que:
- ✅ Permite conexiones desde cualquier subdominio de `onrender.com`
- ✅ Verifica contra `ALLOWED_HOSTS` con soporte para wildcards
- ✅ Verifica contra `CORS_ALLOWED_ORIGINS`
- ✅ Permite localhost en desarrollo

---

### 5. **Configuración de Seguridad para Render**

**Archivo**: `backend/config/settings.py`

```python
if not DEBUG:
    # Permitir el dominio de Render y subdominios
    ALLOWED_HOSTS = ['iot-central.onrender.com', '.onrender.com', 'localhost', '127.0.0.1']
    
    # Django debe confiar en Render para saber si la conexión es HTTPS
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # NO redirigir a HTTPS porque Render maneja esto
    SECURE_SSL_REDIRECT = False
    
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # Configuración adicional para WebSockets en producción
    CSRF_COOKIE_HTTPONLY = False  # Permitir acceso desde JavaScript
    CSRF_COOKIE_SAMESITE = 'Lax'
```

**Cambios clave**:
- `SECURE_SSL_REDIRECT = False` - Render maneja SSL, no Django
- `.onrender.com` en ALLOWED_HOSTS - Permite subdominios

---

### 6. **Archivos Estáticos - Verificación de Directorio**

**Archivo**: `backend/config/settings.py`

```python
# Solo incluir STATICFILES_DIRS si el directorio existe
import os
if os.path.exists(BASE_DIR / 'static'):
    STATICFILES_DIRS = [BASE_DIR / 'static']
else:
    STATICFILES_DIRS = []
```

**Razón**: Evita errores si el directorio `static` no existe.

---

## 🚀 Pasos para Desplegar en Render

### 1. **Variables de Entorno Requeridas**

En el dashboard de Render, configura estas variables:

```bash
# Básicas
DEBUG=False
SECRET_KEY=tu_clave_secreta_muy_segura_aqui
PORT=8000

# Base de Datos PostgreSQL
DATABASE_URL=postgresql://usuario:password@host:5432/database
POSTGRES_DB=neondb
POSTGRES_USER=neondb_owner
POSTGRES_PASSWORD=tu_password
POSTGRES_HOST=tu-host.neon.tech
POSTGRES_PORT=5432

# Seguridad
ALLOWED_HOSTS=iot-central.onrender.com,.onrender.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://tu-frontend.onrender.com,http://localhost:3000

# MQTT (Local - no se despliega)
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
```

### 2. **Configuración del Servicio en Render**

- **Environment**: Docker
- **Dockerfile Path**: `Dockerfile.render`
- **Docker Build Context**: `.`
- **Auto-Deploy**: Yes

### 3. **Comandos Post-Deploy**

El Dockerfile ya ejecuta:
```bash
daphne -b 0.0.0.0 -p ${PORT:-8000} config.asgi:application
```

### 4. **Verificar Migraciones**

Asegúrate de que las migraciones se ejecuten antes de iniciar Daphne. Puedes modificar el Dockerfile:

```dockerfile
CMD sh -c "python manage.py migrate --noinput && \
           python manage.py collectstatic --noinput && \
           daphne -b 0.0.0.0 -p ${PORT:-8000} config.asgi:application"
```

---

## 🧪 Pruebas de WebSocket

### Desde el Frontend

```javascript
// Conectar a WebSocket de telemetría
const ws = new WebSocket('wss://iot-central.onrender.com/ws/telemetry/DEVICE_ID/');

ws.onopen = () => {
    console.log('✅ WebSocket conectado');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('📨 Mensaje recibido:', data);
};

ws.onerror = (error) => {
    console.error('❌ Error WebSocket:', error);
};

ws.onclose = () => {
    console.log('🔌 WebSocket cerrado');
};
```

### Endpoints WebSocket Disponibles

1. **Telemetría de dispositivo**:
   ```
   wss://iot-central.onrender.com/ws/telemetry/{device_id}/
   ```

2. **Estado de dispositivos**:
   ```
   wss://iot-central.onrender.com/ws/devices/status/
   ```

3. **Notificaciones**:
   ```
   wss://iot-central.onrender.com/ws/notifications/
   ```

---

## 🔍 Verificar que Todo Funciona

### 1. Verificar HTTP
```bash
curl https://iot-central.onrender.com/api/devices/
```

### 2. Verificar Admin
```bash
# Navega a: https://iot-central.onrender.com/admin/
# Deberías ver la página de login sin error 500
```

### 3. Verificar WebSocket
Usa una herramienta como [WebSocket King](https://websocketking.com/) o el código JavaScript anterior.

---

## 📝 Notas Importantes

### ✅ **Sin Redis**
- No necesitas configurar Redis en Render
- InMemoryChannelLayer funciona con un solo worker
- Las sesiones usan PostgreSQL

### ✅ **Sin Mosquitto en Render**
- MQTT se ejecuta localmente
- Los dispositivos IoT se conectan a tu broker local
- El backend en Render solo recibe datos vía HTTP/WebSocket

### ✅ **Escalabilidad**
Si en el futuro necesitas múltiples workers:
1. Agrega un servicio Redis en Render
2. Actualiza `CHANNEL_LAYERS` para usar `channels_redis`
3. Actualiza `CACHES` para usar Redis
4. Actualiza `SESSION_ENGINE` para usar cache

---

## 🐛 Troubleshooting

### WebSocket se cierra inmediatamente
- **Causa**: Usuario no autenticado
- **Solución**: Asegúrate de enviar el token JWT en la conexión

### Error 500 en /admin
- **Causa**: Sesiones mal configuradas
- **Solución**: Ya está arreglado con `SESSION_ENGINE = 'django.contrib.sessions.backends.db'`

### WebSocket rechazado por CORS
- **Causa**: Origen no permitido
- **Solución**: Verifica `ALLOWED_HOSTS` y `CORS_ALLOWED_ORIGINS`

---

## ✨ Resumen

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| Backend Django | ✅ Render | https://iot-central.onrender.com |
| WebSocket | ✅ Render | wss://iot-central.onrender.com/ws/... |
| Admin Panel | ✅ Render | https://iot-central.onrender.com/admin/ |
| PostgreSQL | ✅ Neon | Configurado |
| Redis | ❌ No usado | - |
| Mosquitto MQTT | 🏠 Local | No desplegado |

---

**¡Listo!** Tu aplicación Django con WebSockets debería funcionar correctamente en Render sin Redis.
