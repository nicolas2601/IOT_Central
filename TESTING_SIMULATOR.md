# 🧪 Guía de Prueba: Automatización de Simulación de Dispositivos

## Requisitos Previos

1. **Backend corriendo** en `http://localhost:8000`
2. **Frontend corriendo** en `http://localhost:3000`
3. **Broker MQTT** disponible en `localhost:1883`
4. **Usuario autenticado** en el frontend

---

## Paso 1: Verificar que el Backend está Corriendo

```bash
# En una terminal, ve al backend
cd /home/nicolas/Documentos/IOTcentral/backend

# Inicia el servidor Django
python manage.py runserver
```

Deberías ver:
```
Starting development server at http://127.0.0.1:8000/
```

---

## Paso 2: Verificar que el Frontend está Corriendo

```bash
# En otra terminal, ve al frontend
cd /home/nicolas/Documentos/IOTcentral/frontend

# Inicia el servidor Next.js
pnpm dev
```

Deberías ver:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

---

## Paso 3: Verificar que el Broker MQTT está Corriendo

```bash
# En otra terminal, verifica si Mosquitto está corriendo
mosquitto -v
```

O si está instalado como servicio:
```bash
sudo systemctl status mosquitto
```

Si no está corriendo, inicia:
```bash
mosquitto
```

---

## Paso 4: Prueba Manual en el Frontend

### 4.1 Accede al Dashboard

1. Abre `http://localhost:3000` en tu navegador
2. Inicia sesión con tus credenciales
3. Ve a **Gestión de Dispositivos** (en el menú lateral)

### 4.2 Crea un Dispositivo con Simulación Automática

1. Haz clic en **"Nuevo Dispositivo"**
2. En el **Paso 1**: Selecciona **"Usar plantilla"**
3. En el **Paso 2**: 
   - Selecciona cualquier plantilla (ej: "Hobo MX-100" o "Sensor de Calidad de Aire")
   - **Activa el toggle** "Simular automáticamente por el servidor" ✅
4. En el **Paso 3**:
   - Ingresa un nombre (ej: "Sensor Test 01")
   - Ingresa una descripción (opcional)
5. Haz clic en **"Crear"**

### 4.3 Observa los Logs

Abre la consola del navegador (F12 → Console) y deberías ver:
```
✓ Simulador iniciado automáticamente para Sensor Test 01
```

---

## Paso 5: Verifica que el Simulador está Corriendo

### 5.1 Revisa los Logs del Backend

En la terminal donde corre Django, deberías ver algo como:
```
✓ Simulador iniciado automáticamente para Sensor Test 01 (PID 12345)
```

### 5.2 Verifica que el Dispositivo está Online

1. En el frontend, ve a **Gestión de Dispositivos**
2. Busca el dispositivo que acabas de crear
3. Deberías ver que el estado es **"online"** (verde)
4. El contador de telemetría debería estar aumentando

### 5.3 Monitorea los Mensajes MQTT (Opcional)

Si tienes `mosquitto_sub` instalado, puedes monitorear los mensajes:

```bash
# En una nueva terminal
mosquitto_sub -t "dispositivo/+/telemetria" -v
```

Deberías ver mensajes como:
```
dispositivo/abc-123-sensor/telemetria {"temperatura": 22.5, "humedad": 55.2, "timestamp": "2025-01-17T10:30:45Z"}
dispositivo/abc-123-sensor/telemetria {"temperatura": 22.3, "humedad": 55.5, "timestamp": "2025-01-17T10:30:50Z"}
```

---

## Paso 6: Verifica la Telemetría en el Frontend

1. Haz clic en el dispositivo creado para ver sus detalles
2. Ve a la sección de **Telemetría**
3. Deberías ver datos llegando en tiempo real (temperatura, humedad, etc.)

---

## Paso 7: Prueba sin Simulación Automática (Control)

Para verificar que el toggle funciona correctamente:

1. Crea otro dispositivo **SIN** activar el toggle de simulación
2. Verifica que el dispositivo queda en estado **"offline"**
3. Verifica que NO hay telemetría llegando

---

## Troubleshooting

### ❌ El simulador no inicia

**Síntomas:**
- El dispositivo queda en estado "offline"
- No hay telemetría
- No hay logs en el backend

**Soluciones:**
1. Verifica que `device_simulator.py` existe en `/home/nicolas/Documentos/IOTcentral/simulador/`
2. Verifica que el broker MQTT está corriendo: `mosquitto_sub -t "test" -h localhost`
3. Revisa los logs del backend para errores
4. Intenta iniciar el simulador manualmente:
   ```bash
   python /home/nicolas/Documentos/IOTcentral/simulador/device_simulator.py \
     --device-id test-123 \
     --device-type sensor \
     --interval 5
   ```

### ❌ El dispositivo no aparece como online

**Síntomas:**
- El dispositivo aparece en la lista pero con estado "offline"

**Soluciones:**
1. Verifica que el broker MQTT está corriendo
2. Verifica que el simulador está corriendo: `ps aux | grep device_simulator`
3. Revisa los logs del backend

### ❌ La telemetría no llega

**Síntomas:**
- El dispositivo está online pero no hay datos en la sección de telemetría

**Soluciones:**
1. Verifica que el simulador está enviando mensajes: `mosquitto_sub -t "dispositivo/+/telemetria"`
2. Verifica que el backend está recibiendo los mensajes (revisa los logs)
3. Intenta refrescar la página (F5)

---

## Paso 8: Prueba Automatizada (Opcional)

Si quieres automatizar las pruebas, puedes usar `curl`:

```bash
# 1. Obtén el token de autenticación
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"tu_usuario","password":"tu_contraseña"}' \
  | jq -r '.access')

# 2. Crea un dispositivo con simulación automática
curl -X POST http://localhost:8000/api/devices/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sensor Automatizado",
    "device_type": "sensor",
    "description": "Prueba automatizada",
    "metadata": {
      "template": {
        "id": "hobo-mx-100",
        "name": "Hobo MX-100",
        "deviceType": "sensor",
        "properties": []
      },
      "simulation": {
        "autoServer": true
      }
    }
  }'

# 3. Verifica que el dispositivo está online
curl -X GET http://localhost:8000/api/devices/ \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | {name, status, is_online}'
```

---

## Resumen del Flujo

```
Usuario crea dispositivo con "Simular automáticamente"
         ↓
Frontend envía POST /devices/ con metadata.simulation.autoServer: true
         ↓
Backend recibe y crea el dispositivo
         ↓
Backend detecta autoServer: true
         ↓
Backend lanza device_simulator.py en subproceso
         ↓
Simulador se conecta al broker MQTT
         ↓
Simulador envía telemetría cada 5 segundos
         ↓
Backend recibe telemetría vía MQTT
         ↓
Frontend muestra datos en tiempo real
```

---

## Notas Importantes

- ✅ El simulador se lanza en un **subproceso independiente** (no bloquea la creación del dispositivo)
- ✅ El simulador usa `start_new_session=True` para que no se cierre cuando termina la solicitud HTTP
- ✅ El frontend también intenta iniciar el simulador como **respaldo** (redundancia)
- ✅ Los logs se escriben en el logger de Django para debugging
- ✅ El intervalo de telemetría es configurable (default: 5 segundos)

---

## Próximos Pasos

1. **Gestión de procesos**: Implementar endpoint para detener simuladores
2. **Persistencia**: Guardar PIDs de procesos en la base de datos
3. **Monitoreo**: Dashboard para ver simuladores activos
4. **Configuración**: Permitir cambiar intervalo de telemetría desde el frontend
