# 🚀 Guía de Despliegue en Coolify

Esta guía te ayudará a desplegar la Plataforma IoT en Coolify usando Docker.

## 📋 Requisitos Previos

- ✅ Servidor Ubuntu con Coolify instalado
- ✅ Base de datos PostgreSQL en Neon (ya configurada)
- ✅ Dominio o subdominio apuntando a tu servidor
- ✅ Git instalado en el servidor

## 🏗️ Arquitectura del Despliegue

```
┌─────────────────────────────────────────────────────────┐
│                    COOLIFY SERVER                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   Backend    │  │  Mosquitto   │ │
│  │  (Next.js)   │  │   (Django)   │  │    (MQTT)    │ │
│  │   Port 3000  │  │  Port 8000   │  │  Port 1883   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                 │                  │          │
│         └─────────────────┴──────────────────┘          │
│                           │                              │
└───────────────────────────┼──────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  Neon PostgreSQL │
                  │    (Externo)     │
                  └──────────────────┘
```

## 📦 Paso 1: Preparar el Repositorio

### 1.1 Asegúrate de que todos los archivos estén en Git

```bash
cd /home/nicolas/Documentos/IOTcentral

# Verificar estado
git status

# Agregar cambios
git add .
git commit -m "Configuración para despliegue en Coolify"
git push origin main
```

### 1.2 Archivos importantes creados

- ✅ `backend/Dockerfile` - Imagen optimizada del backend
- ✅ `backend/entrypoint.sh` - Script de inicialización
- ✅ `frontend/Dockerfile` - Imagen optimizada del frontend
- ✅ `docker-compose.yml` - Orquestación de servicios
- ✅ `.env.example` - Plantilla de variables de entorno

## 🔧 Paso 2: Configurar en Coolify

### 2.1 Crear Nuevo Proyecto

1. Accede a tu panel de Coolify
2. Click en **"New Project"**
3. Nombre: `iot-platform`
4. Descripción: `Plataforma IoT con Django y Next.js`

### 2.2 Agregar Servicio - Backend

1. Click en **"Add Service"** → **"Docker Compose"**
2. **Source**: Conecta tu repositorio Git
3. **Branch**: `main` (o tu rama principal)
4. **Docker Compose Location**: `docker-compose.yml`
5. **Service**: Selecciona `backend`

#### Variables de Entorno del Backend:

```env
DEBUG=False
SECRET_KEY=<GENERAR_NUEVA_CLAVE_SECRETA>
POSTGRES_DB=neondb
POSTGRES_USER=neondb_owner
POSTGRES_PASSWORD=npg_t9pTFV0GNXar
POSTGRES_HOST=ep-fancy-bonus-a8h2fj9n-pooler.eastus2.azure.neon.tech
POSTGRES_PORT=5432
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883
ALLOWED_HOSTS=localhost,127.0.0.1,backend,tu-dominio-backend.com
CORS_ALLOWED_ORIGINS=https://tu-dominio-frontend.com,http://localhost:3000
LOG_LEVEL=INFO
TZ=America/Bogota
```

**⚠️ IMPORTANTE**: 
- Genera una nueva `SECRET_KEY` con:
  ```bash
  python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
  ```
- Reemplaza `tu-dominio-backend.com` con tu dominio real
- Reemplaza `tu-dominio-frontend.com` con tu dominio del frontend

#### Configuración de Red:
- **Port Mapping**: `8000:8000`
- **Domain**: Configura tu dominio para el backend (ej: `api.tudominio.com`)
- **SSL**: Habilitar (Coolify lo gestiona automáticamente)

### 2.3 Agregar Servicio - Frontend

1. Click en **"Add Service"** → **"Docker Compose"**
2. **Source**: Mismo repositorio
3. **Service**: Selecciona `frontend`

#### Variables de Entorno del Frontend:

```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api
NEXT_PUBLIC_WS_URL=wss://api.tudominio.com/ws
NODE_ENV=production
```

**⚠️ IMPORTANTE**: 
- Usa `https://` y `wss://` en producción
- Reemplaza con tus dominios reales

#### Configuración de Red:
- **Port Mapping**: `3000:3000`
- **Domain**: Configura tu dominio para el frontend (ej: `app.tudominio.com`)
- **SSL**: Habilitar

### 2.4 Agregar Servicio - Mosquitto (MQTT)

1. Click en **"Add Service"** → **"Docker Compose"**
2. **Service**: Selecciona `mosquitto`

#### Configuración de Red:
- **Port Mapping**: 
  - `1883:1883` (MQTT)
  - `9001:9001` (WebSocket)
- **Domain**: Opcional, si quieres acceso externo

## 🔐 Paso 3: Configuración de Seguridad

### 3.1 Generar SECRET_KEY

```bash
python3 -c "from secrets import token_urlsafe; print(token_urlsafe(50))"
```

### 3.2 Configurar SSL/TLS

Coolify gestiona automáticamente los certificados SSL con Let's Encrypt:
1. Asegúrate de que tus dominios apunten a la IP del servidor
2. Habilita SSL en cada servicio
3. Coolify generará y renovará los certificados automáticamente

### 3.3 Firewall

Asegúrate de que estos puertos estén abiertos en tu servidor:

```bash
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 1883/tcp  # MQTT
sudo ufw allow 9001/tcp  # MQTT WebSocket
```

## 🚀 Paso 4: Desplegar

### 4.1 Orden de Despliegue

1. **Mosquitto** (primero)
2. **Backend** (segundo, depende de Mosquitto)
3. **Frontend** (último, depende del Backend)

### 4.2 Iniciar Despliegue

Para cada servicio:
1. Click en **"Deploy"**
2. Espera a que el build termine
3. Verifica los logs

### 4.3 Verificar Despliegue

#### Backend:
```bash
curl https://api.tudominio.com/api/health/
```

Debería responder con estado 200.

#### Frontend:
Abre `https://app.tudominio.com` en tu navegador.

#### Mosquitto:
```bash
mosquitto_sub -h tudominio.com -p 1883 -t test
```

## 🔍 Paso 5: Verificación y Testing

### 5.1 Verificar Logs

En Coolify, para cada servicio:
1. Click en el servicio
2. Ve a la pestaña **"Logs"**
3. Verifica que no haya errores

### 5.2 Crear Superusuario

El script `entrypoint.sh` crea automáticamente un superusuario:
- **Email**: `admin@iotplatform.com`
- **Usuario**: `admin`
- **Contraseña**: `admin123`

**⚠️ IMPORTANTE**: Cambia esta contraseña inmediatamente después del primer login.

### 5.3 Testing de Funcionalidades

1. **Login**: Accede con el superusuario
2. **Crear Dispositivo**: Prueba crear un dispositivo IoT
3. **MQTT**: Verifica que el broker MQTT esté funcionando
4. **WebSocket**: Verifica las actualizaciones en tiempo real
5. **Telemetría**: Envía datos de prueba

## 📊 Paso 6: Monitoreo

### 6.1 Logs en Coolify

Coolify proporciona logs en tiempo real para cada servicio.

### 6.2 Métricas

Coolify muestra:
- Uso de CPU
- Uso de memoria
- Uso de disco
- Estado de contenedores

### 6.3 Alertas

Configura alertas en Coolify para:
- Contenedor caído
- Alto uso de recursos
- Errores en logs

## 🔄 Paso 7: Actualizaciones

### 7.1 Actualizar Código

```bash
# En tu máquina local
git add .
git commit -m "Actualización"
git push origin main
```

### 7.2 Redesplegar en Coolify

1. Ve al servicio en Coolify
2. Click en **"Redeploy"**
3. Coolify hará pull del código y reconstruirá

### 7.3 Rollback

Si algo sale mal:
1. Click en **"Deployments"**
2. Selecciona un despliegue anterior
3. Click en **"Rollback"**

## 🐛 Troubleshooting

### Backend no inicia

**Problema**: Error de conexión a PostgreSQL

**Solución**:
```bash
# Verifica las credenciales de Neon
# Verifica que POSTGRES_HOST sea accesible desde el contenedor
```

### Frontend no carga

**Problema**: Error de CORS

**Solución**:
```env
# Asegúrate de que CORS_ALLOWED_ORIGINS incluya tu dominio del frontend
CORS_ALLOWED_ORIGINS=https://app.tudominio.com
```

### Mosquitto no conecta

**Problema**: Puerto bloqueado

**Solución**:
```bash
sudo ufw allow 1883/tcp
sudo ufw allow 9001/tcp
```

### WebSocket no funciona

**Problema**: Proxy inverso no configurado para WebSocket

**Solución**:
- Coolify debería manejar esto automáticamente
- Verifica que uses `wss://` en producción

## 📝 Comandos Útiles

### Ver logs del backend
```bash
docker logs -f iot_backend
```

### Ver logs del frontend
```bash
docker logs -f iot_frontend
```

### Ver logs de Mosquitto
```bash
docker logs -f iot_mosquitto
```

### Ejecutar comando en el backend
```bash
docker exec -it iot_backend python manage.py <comando>
```

### Crear superusuario manualmente
```bash
docker exec -it iot_backend python manage.py createsuperuser
```

### Ejecutar migraciones
```bash
docker exec -it iot_backend python manage.py migrate
```

## 🔒 Mejores Prácticas de Seguridad

1. **Cambiar credenciales por defecto**
   - Cambia la contraseña del superusuario
   - Genera una nueva SECRET_KEY

2. **Usar HTTPS/WSS**
   - Siempre usa SSL en producción
   - Configura HSTS

3. **Limitar acceso**
   - Configura ALLOWED_HOSTS correctamente
   - Configura CORS_ALLOWED_ORIGINS correctamente

4. **Backups**
   - Neon hace backups automáticos de PostgreSQL
   - Haz backup de volúmenes de Docker periódicamente

5. **Actualizar dependencias**
   - Mantén las dependencias actualizadas
   - Revisa vulnerabilidades con `pip audit`

## 📚 Recursos Adicionales

- [Documentación de Coolify](https://coolify.io/docs)
- [Documentación de Django](https://docs.djangoproject.com/)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Mosquitto](https://mosquitto.org/documentation/)
- [Neon PostgreSQL](https://neon.tech/docs)

## 🎉 ¡Listo!

Tu Plataforma IoT debería estar funcionando en Coolify. Si tienes problemas, revisa los logs y la sección de troubleshooting.

---

**Autor**: Plataforma IoT  
**Versión**: 1.0  
**Fecha**: 2024
