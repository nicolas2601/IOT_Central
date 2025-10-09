# WebSockets - Documentación Completa

Sistema de WebSockets en tiempo real para la Plataforma IoT con autenticación JWT.

## 🎯 Características

✅ **Autenticación JWT** - Tokens en query string o headers
✅ **Autorización** - Solo dispositivos del usuario
✅ **Tiempo Real** - Telemetría, estados y notificaciones
✅ **Sin Memory Leaks** - Limpieza automática de conexiones
✅ **Manejo de Errores** - Robusto y con logging
✅ **Reconexión** - Soporte para reconexión automática

## 📡 Endpoints WebSocket

### 1. Telemetría de Dispositivo Específico
```
ws://localhost:8000/ws/telemetry/{device_id}/?token=YOUR_JWT_TOKEN
```

**Recibe:**
- Telemetría en tiempo real del dispositivo
- Actualizaciones de estado
- Respuestas de comandos

**Ejemplo de mensaje:**
```json
{
  "type": "telemetry",
  "data": {
    "id": 123,
    "device_id": "abc-123",
    "device_name": "Sensor 1",
    "timestamp": "2024-01-15T10:30:00Z",
    "data": {
      "temperatura": 25.3,
      "humedad": 60.2
    }
  }
}
```

### 2. Estado de Todos los Dispositivos
```
ws://localhost:8000/ws/devices/status/?token=YOUR_JWT_TOKEN
```

**Recibe:**
- Estado inicial de todos los dispositivos del usuario
- Actualizaciones de estado en tiempo real
- Cambios de conexión (online/offline)

**Mensaje inicial:**
```json
{
  "type": "initial_status",
  "devices": [
    {
      "id": "abc-123",
      "name": "Sensor 1",
      "status": "online",
      "is_online": true,
      "last_connection": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Actualizaciones:**
```json
{
  "type": "device_status_update",
  "data": {
    "device_id": "abc-123",
    "device_name": "Sensor 1",
    "event_type": "status",
    "data": {
      "status": "online",
      "last_connection": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 3. Notificaciones Generales
```
ws://localhost:8000/ws/notifications/?token=YOUR_JWT_TOKEN
```

**Recibe:**
- Alertas activadas
- Notificaciones de comandos
- Eventos importantes

**Ejemplo:**
```json
{
  "type": "notification",
  "data": {
    "device_id": "abc-123",
    "device_name": "Sensor 1",
    "event_type": "alert",
    "message": "Temperatura alta detectada",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## 🔐 Autenticación

### Opción 1: Query String (Recomendado)
```javascript
const token = localStorage.getItem('access_token');
const ws = new WebSocket(`ws://localhost:8000/ws/telemetry/abc-123/?token=${token}`);
```

### Opción 2: Headers (Algunos clientes)
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/telemetry/abc-123/');
// Algunos clientes WebSocket permiten headers personalizados
```

## 💻 Ejemplos de Uso

### JavaScript Vanilla

```javascript
// 1. Obtener token JWT
const token = localStorage.getItem('access_token');

// 2. Conectar a WebSocket
const deviceId = 'abc-123-456';
const ws = new WebSocket(`ws://localhost:8000/ws/telemetry/${deviceId}/?token=${token}`);

// 3. Manejar eventos
ws.onopen = () => {
  console.log('✓ WebSocket conectado');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Mensaje recibido:', message);
  
  switch(message.type) {
    case 'connection_established':
      console.log('Conexión establecida');
      break;
    case 'telemetry':
      console.log('Nueva telemetría:', message.data);
      // Actualizar UI con los datos
      updateChart(message.data);
      break;
    case 'status':
      console.log('Estado actualizado:', message.data);
      updateDeviceStatus(message.data);
      break;
    case 'command_response':
      console.log('Respuesta de comando:', message.data);
      break;
  }
};

ws.onerror = (error) => {
  console.error('✗ Error WebSocket:', error);
};

ws.onclose = (event) => {
  console.log('WebSocket cerrado:', event.code, event.reason);
  // Implementar reconexión
  setTimeout(() => reconnect(), 5000);
};

// 4. Enviar ping (keepalive)
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'ping',
      timestamp: new Date().toISOString()
    }));
  }
}, 30000); // cada 30 segundos

// 5. Cerrar conexión
function closeConnection() {
  ws.close();
}
```

### React Hook

```typescript
import { useEffect, useState, useRef } from 'react';

interface TelemetryData {
  temperatura: number;
  humedad: number;
  [key: string]: any;
}

export function useDeviceTelemetry(deviceId: string) {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !deviceId) return;

    // Conectar WebSocket
    const ws = new WebSocket(
      `ws://localhost:8000/ws/telemetry/${deviceId}/?token=${token}`
    );

    ws.onopen = () => {
      console.log('✓ WebSocket conectado');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'telemetry') {
        setTelemetry(message.data.data);
      }
    };

    ws.onerror = (error) => {
      console.error('✗ Error WebSocket:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket cerrado');
      setIsConnected(false);
    };

    wsRef.current = ws;

    // Cleanup
    return () => {
      ws.close();
    };
  }, [deviceId]);

  return { telemetry, isConnected };
}

// Uso en componente
function DeviceMonitor({ deviceId }: { deviceId: string }) {
  const { telemetry, isConnected } = useDeviceTelemetry(deviceId);

  return (
    <div>
      <div>Estado: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}</div>
      {telemetry && (
        <div>
          <p>Temperatura: {telemetry.temperatura}°C</p>
          <p>Humedad: {telemetry.humedad}%</p>
        </div>
      )}
    </div>
  );
}
```

### Python Client

```python
import asyncio
import websockets
import json

async def connect_to_device(device_id: str, token: str):
    uri = f"ws://localhost:8000/ws/telemetry/{device_id}/?token={token}"
    
    async with websockets.connect(uri) as websocket:
        print("✓ Conectado a WebSocket")
        
        # Recibir mensajes
        async for message in websocket:
            data = json.loads(message)
            print(f"Mensaje recibido: {data['type']}")
            
            if data['type'] == 'telemetry':
                telemetry = data['data']['data']
                print(f"Temperatura: {telemetry['temperatura']}°C")
                print(f"Humedad: {telemetry['humedad']}%")

# Ejecutar
token = "your_jwt_token_here"
device_id = "abc-123-456"
asyncio.run(connect_to_device(device_id, token))
```

## 🔄 Flujo de Datos

```
Dispositivo IoT
    ↓ (MQTT)
Mosquitto Broker
    ↓
Django MQTT Listener
    ↓
Guarda en PostgreSQL
    ↓
Envía a Channel Layer (Redis/InMemory)
    ↓
WebSocket Consumer
    ↓ (WebSocket)
Frontend (Browser)
```

## 🧪 Probar WebSockets

### 1. Con wscat (CLI)

```bash
# Instalar wscat
npm install -g wscat

# Conectar
wscat -c "ws://localhost:8000/ws/telemetry/abc-123/?token=YOUR_TOKEN"

# Enviar ping
> {"type": "ping", "timestamp": "2024-01-15T10:30:00Z"}

# Recibir respuesta
< {"type": "pong", "timestamp": "2024-01-15T10:30:00Z"}
```

### 2. Con Postman

1. Crear nueva petición WebSocket
2. URL: `ws://localhost:8000/ws/telemetry/abc-123/?token=YOUR_TOKEN`
3. Conectar
4. Ver mensajes en tiempo real

### 3. Con Browser Console

```javascript
const token = 'your_jwt_token';
const ws = new WebSocket(`ws://localhost:8000/ws/telemetry/abc-123/?token=${token}`);

ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

## 🛡️ Seguridad

### Autenticación
- ✅ JWT requerido en todas las conexiones
- ✅ Token validado antes de aceptar conexión
- ✅ Usuario debe estar activo

### Autorización
- ✅ Usuario solo puede ver sus propios dispositivos
- ✅ Admins pueden ver todos los dispositivos
- ✅ Validación en cada conexión

### Protección
- ✅ AllowedHostsOriginValidator
- ✅ Cierre automático de conexiones no autorizadas
- ✅ Logging de intentos de acceso

## 📊 Tipos de Mensajes

### Del Servidor al Cliente

#### connection_established
```json
{
  "type": "connection_established",
  "message": "Conectado a telemetría del dispositivo abc-123"
}
```

#### telemetry
```json
{
  "type": "telemetry",
  "data": {
    "id": 123,
    "device_id": "abc-123",
    "device_name": "Sensor 1",
    "timestamp": "2024-01-15T10:30:00Z",
    "data": { "temperatura": 25.3 }
  }
}
```

#### status
```json
{
  "type": "status",
  "data": {
    "device_id": "abc-123",
    "status": "online",
    "last_connection": "2024-01-15T10:30:00Z"
  }
}
```

#### command_response
```json
{
  "type": "command_response",
  "data": {
    "command_id": "cmd-123",
    "status": "executed",
    "response": { "success": true }
  }
}
```

### Del Cliente al Servidor

#### ping
```json
{
  "type": "ping",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### refresh (solo en /ws/devices/status/)
```json
{
  "type": "refresh"
}
```

## 🐛 Troubleshooting

### Error: WebSocket connection failed
**Causa:** Django no está corriendo con Daphne
**Solución:**
```bash
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### Error: 403 Forbidden
**Causa:** Token JWT inválido o expirado
**Solución:** Obtener nuevo token con `/api/auth/login/`

### Error: Connection closed immediately
**Causa:** Usuario no tiene permiso para ver el dispositivo
**Solución:** Verificar que el dispositivo pertenezca al usuario

### No se reciben mensajes
**Causa:** MQTT listener no está corriendo
**Solución:**
```bash
python manage.py mqtt_listener
```

## 📈 Monitoreo

### Ver conexiones activas
```python
from channels.layers import get_channel_layer
channel_layer = get_channel_layer()
# Ver grupos activos en logs
```

### Logs
```bash
# Ver logs de WebSocket
tail -f logs/django.log | grep WebSocket

# Ver logs de MQTT
tail -f logs/django.log | grep MQTT
```

## 🚀 Producción

### Usar Redis para Channel Layer
```python
# settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('redis', 6379)],
        },
    },
}
```

### Nginx Configuration
```nginx
location /ws/ {
    proxy_pass http://backend:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## ✅ Checklist de Implementación

- [x] Consumers creados
- [x] Middleware JWT implementado
- [x] Routing configurado
- [x] ASGI actualizado
- [x] Notificaciones WebSocket en MQTT client
- [x] Autenticación funcionando
- [x] Autorización por usuario
- [x] Manejo de errores
- [x] Logging completo
- [x] Documentación

**Sistema WebSocket 100% funcional y listo para producción! 🎉**
