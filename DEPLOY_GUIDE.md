# 🚀 GUÍA COMPLETA DE DESPLIEGUE EN COOLIFY

## Plataforma IoT - Configuración Paso a Paso

---

## 📋 PREPARACIÓN DEL SERVIDOR

### PASO 1: Verificar Instalación de Docker
```bash
# Verificar Docker
docker --version
docker info

# Verificar Docker Compose
docker-compose --version
# O con el comando nuevo
docker compose version
```

### PASO 2: Verificar Coolify Funcionando
```bash
# Verificar que Coolify esté corriendo
systemctl status coolify

# Verificar Traefik de Coolify
docker ps | grep traefik
```

### PASO 3: Clonar Repositorio
```bash
# Clonar el proyecto
git clone <URL_DEL_REPOSITORIO>
cd IOTcentral

# Verificar estructura
ls -la
```

---

## ⚙️ CONFIGURACIÓN DE VARIABLES DE ENTORNO

### PASO 1: Configuración Inicial
```bash
# Ejecutar script de configuración
./setup.sh
```

### PASO 2: Configurar .env Manual
```bash
# Editar archivo .env
nano .env

# O usar tu editor preferido
vim .env
code .env
```

### PASO 3: Configuraciones Críticas

#### 🔹 Dominios de Coolify
```env
# Reemplazar con dominios reales generados por Coolify
FRONTEND_DOMAIN=iotcentral-frontend-abc123.coolify.domain.com
BACKEND_DOMAIN=iotcentral-backend-def456.coolify.domain.com
MQTT_DOMAIN=iotcentral-mqtt-ghi789.coolify.domain.com
```

#### 🔹 Base de Datos Neon PostgreSQL
```env
POSTGRES_DB=tu_base_de_datos
POSTGRES_USER=tu_usuario
POSTGRES_PASSWORD=tu_password_seguro
POSTGRES_HOST=tu-proyecto.neon.tech
POSTGRES_PORT=5432
```

#### 🔹 Seguridad Django
```env
# Generar una clave secreta segura
SECRET_KEY=clave-muy-segura-de-50-caracteres-minimo-con-simbolos
DEBUG=False
```

---

## 🌐 CONFIGURACIÓN EN COOLIFY

### PASO 1: Crear Nuevo Proyecto
1. Acceder al panel de Coolify
2. Clic en **"New Project"**
3. Nombre: `iotcentral-platform`
4. Descripción: `Plataforma IoT - Backend + Frontend + MQTT`

### PASO 2: Importar Repositorio
1. **"Import Repository"**
2. Seleccionar tipo: `Git Repository`
3. URL del repositorio
4. Branch: `main` o `master`
5. **Build Pack**: `Docker Compose`

### PASO 3: Configurar Servicios

#### 🔸 Backend Service
```yaml
Service Name: backend
Build Path: ./backend
Dockerfile: Dockerfile
Port: 8001
Health Check: /api/health/
Domain: Generar automáticamente
```

#### 🔸 Frontend Service  
```yaml
Service Name: frontend
Build Path: ./frontend
Dockerfile: Dockerfile
Port: 3000
Health Check: /api/health
Domain: Generar automáticamente
```

#### 🔸 Mosquitto Service
```yaml
Service Name: mosquitto
Image: eclipse-mosquitto:2.0.18
Ports: 1883, 9001
Config: ./mosquitto/mosquitto.conf
Domain: Generar automáticamente (para WebSocket)
```

### PASO 4: Variables de Entorno en Coolify UI

Para cada servicio, agregar las variables necesarias desde el archivo `.env`:

#### Backend Variables:
```
SECRET_KEY=tu-clave-secreta
DEBUG=False
ALLOWED_HOSTS=dominio-backend,dominio-frontend
POSTGRES_DB=tu-base-datos
POSTGRES_USER=tu-usuario
POSTGRES_PASSWORD=tu-password
POSTGRES_HOST=tu-host.neon.tech
POSTGRES_PORT=5432
MQTT_BROKER_HOST=mosquitto
CORS_ORIGIN=http://dominio-frontend
```

#### Frontend Variables:
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://dominio-backend/api
NEXT_PUBLIC_WS_URL=http://dominio-backend/ws
```

### PASO 5: Configurar Health Checks
- **Backend**: `GET /api/health/` cada 30s
- **Frontend**: `GET /api/health` cada 30s  
- **Mosquitto**: Puerto 1883 disponible

---

## 🚀 PROCESO DE DESPLIEGUE

### PASO 1: Despliegue Automático
```bash
# Ejecutar script de despliegue
./deploy.sh
```

### PASO 2: Despliegue Manual (si prefieres)
```bash
# 1. Construir imágenes
docker-compose build --no-cache

# 2. Ejecutar migraciones
docker-compose run --rm backend python manage.py migrate

# 3. Crear superusuario (opcional)
docker-compose run --rm backend python manage.py createsuperuser

# 4. Iniciar servicios
docker-compose up -d

# 5. Verificar estado
docker-compose ps
```

### PASO 3: Orden de Despliegue en Coolify
1. **Mosquitto** (primero - otros servicios dependen de él)
2. **Backend** (segundo - frontend necesita la API)
3. **Frontend** (último - necesita backend funcionando)

---

## 🔍 VERIFICACIÓN POST-DESPLIEGUE

### PASO 1: Verificar Contenedores
```bash
# Ver estado de servicios
docker-compose ps

# Ver logs de servicios
docker-compose logs mosquitto
docker-compose logs backend
docker-compose logs frontend

# Ver logs en tiempo real
docker-compose logs -f backend
```

### PASO 2: Probar Endpoints

#### 🔹 Health Checks Locales
```bash
# Backend health check
curl http://localhost:8001/api/health/

# Frontend health check  
curl http://localhost:3000/api/health

# MQTT test
mosquitto_pub -h localhost -t "test/deploy" -m "test_message"
```

#### 🔹 Health Checks Públicos
```bash
# Reemplazar con tus dominios reales
curl http://backend-domain.coolify.com/api/health/
curl http://frontend-domain.coolify.com/api/health
```

### PASO 3: Verificar Traefik
```bash
# Ver logs de Traefik en Coolify
docker logs coolify-traefik

# Verificar rutas detectadas
# Acceder al dashboard de Traefik si está habilitado
```

### PASO 4: Probar Funcionalidad Completa

#### 🔸 Frontend
- ✅ Página de login carga correctamente
- ✅ Puede registrar/autenticar usuarios  
- ✅ Dashboard muestra sin errores de consola
- ✅ Conexión WebSocket establece correctamente

#### 🔸 Backend API
- ✅ `GET /api/health/` retorna 200
- ✅ `POST /api/auth/login/` funciona
- ✅ `GET /api/devices/` (con auth) funciona
- ✅ Admin Django accesible

#### 🔸 MQTT Broker
- ✅ Puerto 1883 acepta conexiones MQTT
- ✅ Puerto 9001 acepta conexiones WebSocket
- ✅ Pub/Sub funciona correctamente

---

## 🛠️ TROUBLESHOOTING

### ❌ Error: "Gateway Timeout" o "Bad Gateway"

**Causas Posibles:**
- Contenedor no está corriendo
- Health check falla
- Puerto incorrecto configurado

**Soluciones:**
```bash
# Verificar estado
docker-compose ps

# Ver logs del servicio problemático
docker-compose logs [servicio]

# Reiniciar servicio específico
docker-compose restart [servicio]

# Verificar puertos
netstat -tulpn | grep [puerto]
```

### ❌ Error: "Traefik no reconoce el servicio"

**Causas Posibles:**
- Labels de Traefik incorrectos
- Servicio no está corriendo
- Red Docker no configurada

**Soluciones:**
```bash
# Verificar labels en docker-compose.yml
docker-compose config

# Verificar red de Traefik
docker network ls
docker network inspect [nombre_red]

# Reiniciar con recreación
docker-compose down
docker-compose up -d --force-recreate
```

### ❌ Error: "No se puede conectar a la base de datos"

**Causas Posibles:**
- Credenciales incorrectas
- Host/puerto incorrecto
- Firewall bloqueando conexión

**Soluciones:**
```bash
# Probar conexión directa
docker run --rm postgres:15-alpine \
  pg_isready -h HOST -p PORT -U USER -d DATABASE

# Verificar variables de entorno
docker-compose exec backend env | grep POSTGRES

# Ver logs detallados
docker-compose logs backend | grep -i database
```

### ❌ Error: "CORS bloqueado"

**Causas Posibles:**
- CORS_ORIGIN mal configurado
- Dominios no coinciden
- Headers faltantes

**Soluciones:**
```bash
# Verificar configuración CORS
docker-compose exec backend python manage.py shell
>>> from django.conf import settings
>>> print(settings.CORS_ALLOWED_ORIGINS)

# Actualizar .env con dominios correctos
CORS_ORIGIN=http://dominio-frontend-real.coolify.com
```

### ❌ Error: "MQTT no conecta"

**Causas Posibles:**
- Mosquitto no está corriendo
- Puertos no accesibles
- Configuración incorrecta

**Soluciones:**
```bash
# Verificar Mosquitto
docker-compose logs mosquitto

# Probar conexión MQTT
mosquitto_pub -h localhost -p 1883 -t "test" -m "hello"

# Probar WebSocket
# Usar cliente de prueba en browser o herramientas específicas
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Pre-Despliegue
- [ ] Docker y Docker Compose instalados
- [ ] Coolify funcionando correctamente  
- [ ] Conexión a Neon PostgreSQL verificada
- [ ] Repositorio clonado en servidor
- [ ] Archivo `.env` configurado con valores reales
- [ ] Dominios autogenerados obtenidos de Coolify
- [ ] Puertos 8001, 3000, 1883, 9001 disponibles

### Durante Despliegue
- [ ] Backend desplegado sin errores
- [ ] Frontend desplegado sin errores
- [ ] Mosquitto desplegado sin errores
- [ ] Todos los contenedores en estado "Up"
- [ ] Health checks pasando
- [ ] Traefik detecta todos los servicios
- [ ] Migraciones de Django ejecutadas

### Post-Despliegue
- [ ] Frontend accesible vía HTTP público
- [ ] Backend API responde correctamente
- [ ] Admin Django accesible
- [ ] MQTT acepta conexiones puerto 1883
- [ ] MQTT WebSocket funciona puerto 9001
- [ ] Frontend se comunica con Backend
- [ ] Backend se comunica con Neon
- [ ] Sin errores 502/503/504 en navegador
- [ ] Logs limpios sin errores críticos
- [ ] WebSocket del frontend conecta correctamente

---

## 🔧 COMANDOS ÚTILES

### Gestión de Servicios
```bash
# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f [servicio]

# Reiniciar servicio
docker-compose restart [servicio]

# Rebuild y restart
docker-compose up -d --build [servicio]

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

### Mantenimiento
```bash
# Limpiar sistema Docker
docker system prune -f

# Ver uso de espacio
docker system df

# Backup de volúmenes importantes
docker run --rm -v iotcentral_mosquitto_data:/data -v $(pwd):/backup alpine tar czf /backup/mosquitto_backup.tar.gz -C /data .
```

### Debugging
```bash
# Ejecutar comandos en contenedor
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py dbshell

# Acceder a shell del contenedor
docker-compose exec backend bash
docker-compose exec frontend sh
```

---

## 🎯 OBJETIVO FINAL ALCANZADO

✅ **Backend Django** ejecutándose con **daphne en puerto 8001**
✅ **Frontend Next.js** en producción con standalone output
✅ **Mosquitto MQTT** con puertos 1883 y 9001 funcionales
✅ **Labels Traefik perfectos** para Coolify
✅ **Health checks** configurados para todos los servicios
✅ **Variables de entorno** completamente configuradas
✅ **Base de datos Neon** conectada y funcionando
✅ **Scripts automatizados** para despliegue sin errores
✅ **Documentación completa** paso a paso

🚀 **¡Plataforma IoT desplegada exitosamente en Coolify sin errores!**
