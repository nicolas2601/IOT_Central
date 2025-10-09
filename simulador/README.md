# Simulador de Dispositivos IoT

Simulador de dispositivos IoT para probar la plataforma. Simula sensores, actuadores y gateways que envían telemetría y responden a comandos vía MQTT.

## 🚀 Instalación

```bash
cd simulador
pip install -r requirements.txt
```

O si usas el entorno virtual del backend:
```bash
cd simulador
source ../backend/venv/bin/activate
pip install paho-mqtt
```

## 📋 Uso

### Simular un dispositivo

```bash
python device_simulator.py --device-id sensor-001 --device-type sensor
```

### Opciones disponibles

```bash
python device_simulator.py --help
```

**Argumentos:**
- `--device-id`: ID único del dispositivo (requerido)
- `--device-type`: Tipo de dispositivo (sensor, actuator, gateway, controller)
- `--broker`: Host del broker MQTT (default: localhost)
- `--port`: Puerto del broker MQTT (default: 1883)
- `--interval`: Intervalo de telemetría en segundos (default: 5)

### Ejemplos

**Sensor de temperatura:**
```bash
python device_simulator.py \
  --device-id abc-123-sensor \
  --device-type sensor \
  --interval 5
```

**Actuador:**
```bash
python device_simulator.py \
  --device-id xyz-456-actuator \
  --device-type actuator \
  --interval 10
```

**Gateway:**
```bash
python device_simulator.py \
  --device-id gateway-001 \
  --device-type gateway \
  --broker localhost \
  --port 1883
```

## 🔄 Múltiples Dispositivos

Para simular varios dispositivos a la vez:

```bash
python run_multiple_devices.py --count 5 --interval 5
```

**Opciones:**
- `--count`: Número de dispositivos a simular (default: 3)
- `--interval`: Intervalo de telemetría (default: 5)
- `--broker`: Host del broker MQTT (default: localhost)
- `--port`: Puerto del broker MQTT (default: 1883)

## 📡 Telemetría Generada

### Sensor
```json
{
  "temperatura": 25.3,
  "humedad": 60.2,
  "presion": 1013.25,
  "luz": 450,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Actuator
```json
{
  "temperatura": 22.1,
  "humedad": 55.0,
  "estado_motor": "on",
  "velocidad": 75,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Gateway
```json
{
  "temperatura": 23.5,
  "humedad": 58.0,
  "dispositivos_conectados": 5,
  "señal_wifi": -45,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🎮 Comandos Soportados

El simulador responde a los siguientes comandos:

### 1. set_temperature
```json
{
  "command_type": "set_temperature",
  "payload": {
    "target": 22.0
  }
}
```

### 2. set_humidity
```json
{
  "command_type": "set_humidity",
  "payload": {
    "target": 60.0
  }
}
```

### 3. restart
```json
{
  "command_type": "restart",
  "payload": {}
}
```

### 4. get_status
```json
{
  "command_type": "get_status",
  "payload": {}
}
```

## 🧪 Probar el Sistema Completo

### 1. Iniciar Mosquitto (broker MQTT)
```bash
mosquitto -v
```

### 2. Iniciar Django MQTT Listener
```bash
cd backend
python manage.py mqtt_listener
```

### 3. Iniciar el simulador
```bash
cd simulador
python device_simulator.py --device-id test-device-001 --device-type sensor
```

### 4. Enviar comando desde la API
```bash
curl -X POST http://localhost:8000/api/devices/test-device-001/send-command/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command_type": "set_temperature",
    "payload": {"target": 25.0}
  }'
```

### 5. Ver logs en tiempo real
```bash
# En otra terminal
mosquitto_sub -t "dispositivo/#" -v
```

## 📊 Monitoreo

### Ver todos los mensajes MQTT
```bash
mosquitto_sub -t "#" -v
```

### Ver solo telemetría
```bash
mosquitto_sub -t "dispositivo/+/telemetria" -v
```

### Ver solo comandos
```bash
mosquitto_sub -t "dispositivo/+/comandos" -v
```

### Ver respuestas de comandos
```bash
mosquitto_sub -t "dispositivo/+/comandos/respuesta" -v
```

## 🔧 Troubleshooting

### Error: Connection refused
```
✗ Error conectando: [Errno 111] Connection refused
```
**Solución:** Asegúrate de que Mosquitto esté corriendo:
```bash
mosquitto -v
```

### El dispositivo no aparece en la plataforma
1. Verifica que el `device_id` exista en la base de datos
2. Crea el dispositivo primero desde la API:
```bash
curl -X POST http://localhost:8000/api/devices/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sensor Test",
    "device_type": "sensor"
  }'
```
3. Usa el UUID retornado como `--device-id`

### No se reciben mensajes
1. Verifica que el listener MQTT esté corriendo
2. Revisa los logs de Django
3. Verifica la configuración del broker en `settings.py`

## 📝 Notas

- El simulador genera datos aleatorios pero realistas
- La temperatura varía entre 15°C y 35°C
- La humedad varía entre 30% y 80%
- Los valores cambian gradualmente para simular condiciones reales
- Cada dispositivo mantiene su estado entre comandos

## 🎯 Casos de Uso

### Prueba de carga
```bash
# Simular 10 dispositivos enviando datos cada 2 segundos
python run_multiple_devices.py --count 10 --interval 2
```

### Prueba de comandos
```bash
# 1. Iniciar simulador
python device_simulator.py --device-id cmd-test-001 --device-type sensor

# 2. Enviar comando desde Postman o cURL
# 3. Ver la respuesta en los logs del simulador
```

### Demo en vivo
```bash
# Terminal 1: Broker
mosquitto -v

# Terminal 2: Django Listener
python manage.py mqtt_listener

# Terminal 3: Simuladores
python run_multiple_devices.py --count 5

# Terminal 4: Monitor
mosquitto_sub -t "#" -v
```

## 🚀 Próximos Pasos

Después de probar el simulador:
1. Ver telemetría en el dashboard del frontend
2. Enviar comandos desde la interfaz web
3. Configurar alertas basadas en telemetría
4. Visualizar gráficas en tiempo real
