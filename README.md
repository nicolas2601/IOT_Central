# 🌐 Plataforma IoT Open Source

Plataforma completa de gestión de dispositivos IoT similar a Azure IoT Central, desarrollada como proyecto final de semestre. Permite gestionar dispositivos, recibir telemetría en tiempo real, visualizar dashboards interactivos y enviar comandos a dispositivos remotos.

## 📋 Características

- ✅ **Gestión de Dispositivos**: CRUD completo de dispositivos IoT
- 📊 **Telemetría en Tiempo Real**: Visualización de datos con WebSockets
- 📈 **Dashboards Interactivos**: Gráficas y estadísticas en tiempo real
- 🎮 **Control Remoto**: Envío de comandos a dispositivos
- 🔐 **Autenticación JWT**: Sistema seguro de autenticación
- 🔔 **Alertas**: Sistema de notificaciones basado en reglas
- 📱 **Responsive**: Interfaz adaptable a todos los dispositivos

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + TypeScript
- **Vite** - Build tool ultrarrápido
- **TailwindCSS** - Estilos modernos
- **ShadCN UI** - Componentes de alta calidad
- **Recharts** - Visualización de datos
- **React Query** - Gestión de estado del servidor
- **Zustand** - Estado global
- **Lucide React** - Iconos modernos

### Backend
- **Django 5.0** + Python 3.11+
- **Django REST Framework** - APIs REST
- **Django Channels** - WebSockets en tiempo real
- **PostgreSQL 15** - Base de datos relacional
- **Redis** - Cache y Channels layer
- **JWT** - Autenticación segura

### IoT Core
- **Eclipse Mosquitto** - Broker MQTT
- **Protocolo MQTT** - Comunicación IoT estándar
- **WebSockets** - Soporte para navegadores

### Infraestructura
- **Docker** + Docker Compose
- **Nginx** (producción)

## 📁 Estructura del Proyecto

```
meroprompt/
├── backend/                    # Backend Django
│   ├── config/                # Configuración del proyecto
│   ├── apps/                  # Aplicaciones Django
│   │   ├── authentication/    # Autenticación y usuarios
│   │   ├── devices/          # Gestión de dispositivos
│   │   ├── telemetry/        # Telemetría y datos
│   │   └── commands/         # Comandos a dispositivos
│   ├── requirements.txt      # Dependencias Python
│   ├── manage.py
│   └── Dockerfile
│
├── frontend/                  # Frontend React
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/           # Páginas de la aplicación
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # Servicios API
│   │   ├── store/           # Estado global (Zustand)
│   │   └── types/           # TypeScript types
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── mosquitto/                # Configuración MQTT
│   └── mosquitto.conf
│
├── simulators/               # Simuladores de dispositivos
│   └── device_simulator.py
│
├── docker-compose.yml        # Orquestación de servicios
├── .env                      # Variables de entorno
├── .env.example             # Ejemplo de variables
├── .gitignore
└── README.md
```

## 🚀 Instalación y Configuración

### Prerequisitos

- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Git**

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/meroprompt.git
cd meroprompt
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones si es necesario
```

3. **Construir y levantar los servicios**
```bash
# Construir las imágenes
docker-compose build

# Levantar todos los servicios
docker-compose up -d
```

4. **Verificar que los servicios estén corriendo**
```bash
docker-compose ps
```

Deberías ver todos los servicios en estado "Up":
- `iot_postgres` - PostgreSQL (puerto 5432)
- `iot_redis` - Redis (puerto 6379)
- `iot_mosquitto` - MQTT Broker (puertos 1883, 9001)
- `iot_backend` - Django (puerto 8000)
- `iot_frontend` - React (puerto 5173)

5. **Crear superusuario de Django**
```bash
docker-compose exec backend python manage.py createsuperuser
```

## 🎯 Uso

### Acceder a la aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Admin Django**: http://localhost:8000/admin
- **MQTT Broker**: mqtt://localhost:1883
- **MQTT WebSocket**: ws://localhost:9001

### Comandos útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend

# Reiniciar un servicio
docker-compose restart backend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ elimina datos)
docker-compose down -v

# Ejecutar migraciones
docker-compose exec backend python manage.py migrate

# Crear migraciones
docker-compose exec backend python manage.py makemigrations

# Acceder al shell de Django
docker-compose exec backend python manage.py shell

# Acceder a PostgreSQL
docker-compose exec postgres psql -U iotuser -d iotdb

# Ejecutar tests del backend
docker-compose exec backend python manage.py test

# Ejecutar tests del frontend
docker-compose exec frontend pnpm test
```

## 🧪 Simulador de Dispositivos

Para probar la plataforma, puedes usar el simulador de dispositivos:

```bash
# Instalar dependencias del simulador
pip install paho-mqtt

# Ejecutar simulador
python simulators/device_simulator.py
```

El simulador enviará datos de telemetría simulados al broker MQTT.

## 📡 Protocolo MQTT

### Topics

- **Telemetría**: `dispositivo/{device_id}/telemetria`
- **Comandos**: `dispositivo/{device_id}/comandos`
- **Estado**: `dispositivo/{device_id}/estado`

### Formato de mensajes

**Telemetría**:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "temperatura": 25.3,
  "humedad": 60.5,
  "presion": 1013.25
}
```

**Comando**:
```json
{
  "command_type": "set_temperature",
  "payload": {
    "target_temperature": 22.0
  }
}
```

## 🔐 Autenticación

La API usa JWT (JSON Web Tokens) para autenticación:

1. **Registro**: `POST /api/auth/register/`
2. **Login**: `POST /api/auth/login/` → Retorna `access` y `refresh` tokens
3. **Refresh**: `POST /api/auth/refresh/` → Renueva el access token
4. **Usar token**: Incluir en headers: `Authorization: Bearer {access_token}`

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/register/` - Registrar usuario
- `POST /api/auth/login/` - Iniciar sesión
- `POST /api/auth/refresh/` - Renovar token
- `GET /api/auth/profile/` - Obtener perfil
- `PUT /api/auth/profile/` - Actualizar perfil

### Dispositivos
- `GET /api/devices/` - Listar dispositivos
- `POST /api/devices/` - Crear dispositivo
- `GET /api/devices/{id}/` - Obtener dispositivo
- `PUT /api/devices/{id}/` - Actualizar dispositivo
- `DELETE /api/devices/{id}/` - Eliminar dispositivo
- `GET /api/devices/{id}/telemetry/` - Telemetría del dispositivo
- `POST /api/devices/{id}/send_command/` - Enviar comando

### Telemetría
- `GET /api/telemetry/` - Listar telemetría (con filtros)
- `GET /api/telemetry/latest/{device_id}/` - Última telemetría
- `GET /api/telemetry/statistics/{device_id}/` - Estadísticas

### Comandos
- `GET /api/commands/` - Listar comandos
- `POST /api/commands/` - Crear comando
- `GET /api/commands/{id}/` - Obtener comando

## 🔌 WebSocket Endpoints

- `ws://localhost:8000/ws/telemetry/{device_id}/` - Telemetría en tiempo real
- `ws://localhost:8000/ws/devices/status/` - Estado de dispositivos

## 🧪 Testing

```bash
# Backend tests
docker-compose exec backend python manage.py test

# Frontend tests
docker-compose exec frontend pnpm test

# Coverage backend
docker-compose exec backend coverage run --source='.' manage.py test
docker-compose exec backend coverage report
```

## 🐛 Troubleshooting

### Los contenedores no inician

```bash
# Ver logs detallados
docker-compose logs

# Reconstruir imágenes
docker-compose build --no-cache
docker-compose up -d
```

### Error de conexión a PostgreSQL

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Error de conexión a MQTT

```bash
# Verificar configuración de Mosquitto
cat mosquitto/mosquitto.conf

# Ver logs de Mosquitto
docker-compose logs mosquitto

# Probar conexión MQTT
mosquitto_sub -h localhost -p 1883 -t "test/#" -v
```

## 📝 Desarrollo

### Agregar dependencias Python

```bash
# Agregar al requirements.txt
echo "nueva-libreria==1.0.0" >> backend/requirements.txt

# Reconstruir el contenedor
docker-compose build backend
docker-compose up -d backend
```

### Agregar dependencias Node.js

```bash
# Entrar al contenedor
docker-compose exec frontend sh

# Instalar con pnpm
pnpm add nombre-libreria
```

## 🤝 Contribución

Este es un proyecto académico open source. Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es open source y está disponible bajo la licencia MIT.

## 👨‍💻 Autor

Desarrollado como proyecto final de semestre en Bucaramanga, Colombia.

## 🙏 Agradecimientos

- Eclipse Mosquitto por el broker MQTT
- Django y React por los frameworks
- La comunidad open source

---

**¿Necesitas ayuda?** Abre un issue en el repositorio.

**⭐ Si te gusta el proyecto, dale una estrella en GitHub!**
