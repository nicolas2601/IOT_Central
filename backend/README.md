# Backend - Plataforma IoT

Backend Django con REST API, WebSockets y cliente MQTT para la plataforma IoT.

## 🏗️ Estructura del Proyecto

```
backend/
├── config/                 # Configuración del proyecto Django
│   ├── __init__.py
│   ├── settings.py        # Configuración principal
│   ├── urls.py           # URLs principales
│   ├── asgi.py           # Configuración ASGI (WebSockets)
│   └── wsgi.py           # Configuración WSGI
│
├── apps/                  # Aplicaciones Django
│   ├── accounts/         # Autenticación y usuarios
│   │   ├── models.py     # Modelo User personalizado
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── admin.py
│   │
│   └── iot_core/         # Core IoT (dispositivos, telemetría, comandos)
│       ├── models.py     # Device, Telemetry, Command, Alert
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       ├── admin.py
│       ├── mqtt_client.py    # Cliente MQTT
│       ├── consumers.py      # WebSocket consumers
│       └── routing.py        # WebSocket routing
│
├── static/               # Archivos estáticos
├── media/                # Archivos de usuario
├── templates/            # Templates Django
├── logs/                 # Logs de la aplicación
├── requirements.txt      # Dependencias Python
├── manage.py            # CLI de Django
└── Dockerfile           # Dockerfile para contenedor
```

## 🚀 Instalación Local (sin Docker)

### 1. Crear entorno virtual

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Asegúrate de que el archivo `.env` en la raíz del proyecto tenga las variables correctas.

### 4. Ejecutar migraciones

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Crear superusuario

```bash
python manage.py createsuperuser
```

### 6. Ejecutar servidor de desarrollo

```bash
# Para desarrollo con Daphne (soporta WebSockets)
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# O con runserver (solo HTTP, sin WebSockets)
python manage.py runserver
```

## 🐳 Instalación con Docker

Ver el archivo `docker-compose.yml` en la raíz del proyecto.

```bash
# Desde la raíz del proyecto
docker-compose up -d backend
```

## 📡 API Endpoints

### Autenticación

- `POST /api/auth/register/` - Registrar usuario
- `POST /api/auth/login/` - Login (retorna JWT tokens)
- `POST /api/auth/refresh/` - Renovar access token
- `POST /api/auth/logout/` - Logout (blacklist token)
- `GET /api/auth/profile/` - Obtener perfil
- `PUT /api/auth/profile/update/` - Actualizar perfil

### Dispositivos

- `GET /api/devices/` - Listar dispositivos
- `POST /api/devices/` - Crear dispositivo
- `GET /api/devices/{id}/` - Obtener dispositivo
- `PUT /api/devices/{id}/` - Actualizar dispositivo
- `DELETE /api/devices/{id}/` - Eliminar dispositivo
- `GET /api/devices/{id}/telemetry/` - Telemetría del dispositivo
- `POST /api/devices/{id}/send-command/` - Enviar comando

### Telemetría

- `GET /api/telemetry/` - Listar telemetría (con filtros)
- `POST /api/telemetry/` - Crear telemetría
- `GET /api/telemetry/latest/{device_id}/` - Última telemetría
- `GET /api/telemetry/statistics/{device_id}/` - Estadísticas

### Comandos

- `GET /api/commands/` - Listar comandos
- `POST /api/commands/` - Crear comando
- `GET /api/commands/{id}/` - Obtener comando

### Alertas

- `GET /api/alerts/` - Listar alertas
- `POST /api/alerts/` - Crear alerta
- `GET /api/alerts/{id}/` - Obtener alerta
- `PUT /api/alerts/{id}/` - Actualizar alerta
- `DELETE /api/alerts/{id}/` - Eliminar alerta

### Dashboard

- `GET /api/dashboard/stats/` - Estadísticas del dashboard

## 🔌 WebSocket Endpoints

- `ws://localhost:8000/ws/telemetry/{device_id}/` - Telemetría en tiempo real
- `ws://localhost:8000/ws/devices/status/` - Estado de dispositivos
- `ws://localhost:8000/ws/notifications/` - Notificaciones

### Ejemplo de conexión WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/telemetry/device-uuid/');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Telemetría recibida:', data);
};
```

## 📊 Modelos de Base de Datos

### User (accounts.User)
- Usuario personalizado extendido de AbstractUser
- Campos: username, email, password, first_name, last_name, company_name, role, phone, avatar

### Device (iot_core.Device)
- Dispositivos IoT
- Campos: id (UUID), name, device_type, description, is_active, status, last_connection, metadata, owner, location

### Telemetry (iot_core.Telemetry)
- Datos de telemetría
- Campos: id, device, timestamp, data (JSON), received_at

### Command (iot_core.Command)
- Comandos a dispositivos
- Campos: id (UUID), device, command_type, payload (JSON), status, created_at, sent_at, executed_at, response, created_by

### Alert (iot_core.Alert)
- Alertas y reglas
- Campos: id (UUID), device, name, rule_type, condition (JSON), severity, is_active, notify_email, notify_webhook

## 🔧 Comandos Útiles

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar tests
python manage.py test

# Shell interactivo
python manage.py shell

# Colectar archivos estáticos
python manage.py collectstatic

# Ver logs en Docker
docker-compose logs -f backend
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
python manage.py test

# Tests de una app específica
python manage.py test apps.accounts
python manage.py test apps.iot_core

# Con coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

## 📝 Notas Importantes

1. **Modelo User Personalizado**: Se usa `AUTH_USER_MODEL = 'accounts.User'`
2. **JWT Authentication**: Tokens de acceso válidos por 1 hora, refresh por 7 días
3. **MQTT Client**: Se inicia automáticamente con el servidor
4. **WebSockets**: Requieren autenticación JWT
5. **CORS**: Configurado para `http://localhost:5173` (frontend)

## 🔐 Seguridad

- JWT tokens con blacklist
- CORS configurado
- Rate limiting en API
- Validación de permisos en todos los endpoints
- Contraseñas hasheadas con Django

## 📚 Documentación Adicional

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django Channels](https://channels.readthedocs.io/)
- [Paho MQTT](https://www.eclipse.org/paho/index.php?page=clients/python/index.php)
