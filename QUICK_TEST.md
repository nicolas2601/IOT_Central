# ⚡ Prueba Rápida: Simulación Automática

## 🚀 Inicio Rápido (5 minutos)

### Terminal 1: Backend
```bash
cd /home/nicolas/Documentos/IOTcentral/backend
python manage.py runserver
```

### Terminal 2: Frontend
```bash
cd /home/nicolas/Documentos/IOTcentral/frontend
pnpm dev
```

### Terminal 3: Broker MQTT
```bash
mosquitto
```

---

## 📋 Pasos de Prueba

### 1️⃣ Abre el Frontend
- Ve a `http://localhost:3000`
- Inicia sesión

### 2️⃣ Crea un Dispositivo con Simulación Automática
1. Ve a **Gestión de Dispositivos**
2. Haz clic en **"Nuevo Dispositivo"**
3. **Paso 1**: Selecciona **"Usar plantilla"**
4. **Paso 2**: 
   - Elige cualquier plantilla (ej: "Hobo MX-100")
   - **Activa el toggle** ✅ "Simular automáticamente por el servidor"
5. **Paso 3**:
   - Nombre: `Sensor Test`
   - Descripción: `Prueba de simulación automática`
6. Haz clic en **"Crear"**

### 3️⃣ Verifica en la Consola del Navegador (F12)
Deberías ver:
```
✓ Simulador iniciado automáticamente para Sensor Test
```

### 4️⃣ Verifica en los Logs del Backend
Deberías ver:
```
✓ Simulador iniciado automáticamente para Sensor Test (PID 12345)
```

### 5️⃣ Verifica que el Dispositivo está Online
1. En **Gestión de Dispositivos**, busca "Sensor Test"
2. Deberías ver estado: **online** (verde)
3. El contador de telemetría debería estar aumentando

### 6️⃣ (Opcional) Monitorea MQTT
```bash
# En otra terminal
mosquitto_sub -t "dispositivo/+/telemetria" -v
```

Deberías ver mensajes llegando cada 5 segundos.

---

## ✅ Criterios de Éxito

- ✅ El dispositivo aparece en la lista
- ✅ El estado es **"online"**
- ✅ Hay telemetría llegando (contador aumenta)
- ✅ En la consola del navegador ves el mensaje de éxito
- ✅ En los logs del backend ves que el simulador se inició

---

## ❌ Si Algo Falla

### El dispositivo no aparece como online
```bash
# Verifica que Mosquitto está corriendo
mosquitto_sub -t "test" -h localhost
```

### No hay telemetría
```bash
# Verifica que el simulador está corriendo
ps aux | grep device_simulator

# O intenta iniciarlo manualmente
python /home/nicolas/Documentos/IOTcentral/simulador/device_simulator.py \
  --device-id test-123 \
  --device-type sensor \
  --interval 5
```

### El toggle no aparece
- Asegúrate de que estés usando una plantilla (Paso 1: "Usar plantilla")
- Si usas "Crear uno propio", el toggle no aparecerá

---

## 🎯 Resumen del Flujo

```
Creas dispositivo con toggle activado
         ↓
Backend detecta autoServer: true
         ↓
Backend lanza device_simulator.py
         ↓
Simulador se conecta a MQTT
         ↓
Telemetría llega cada 5 segundos
         ↓
Frontend muestra datos en tiempo real
```

---

## 📝 Notas

- El simulador se lanza en **background** (no bloquea)
- Los datos se envían cada **5 segundos**
- El dispositivo se marca como **online** automáticamente
- Puedes ver los logs en el backend para debugging
