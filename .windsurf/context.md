# CONTEXTO DEL PROYECTO - PLATAFORMA IOT

## Descripción General
Plataforma IoT open source similar a Azure IoT Central para proyecto final de semestre.
Permite gestionar dispositivos IoT, recibir telemetría en tiempo real, visualizar dashboards y enviar comandos.

## Stack Tecnológico COMPLETO

### Frontend
- Next.js 14 + TypeScript (App Router)
- TailwindCSS para estilos
- ShadCN UI para componentes
- Recharts para gráficas
- React Query (TanStack Query) para data fetching
- Zustand para estado global
- Axios para HTTP
- Lucide React para iconos
- pnpm como package manager

### Backend
- Django 5.0 (Python 3.11+)
- Django REST Framework para APIs REST
- Django Channels para WebSockets
- PostgreSQL 15 como base de datos
- djangorestframework-simplejwt para autenticación
- django-cors-headers para CORS
- paho-mqtt para cliente MQTT
- python-decouple para variables de entorno

### IoT Core
- Eclipse Mosquitto como broker MQTT (puertos 1883, 9001)
- Protocolo MQTT para comunicación
- Topics organizados:
  * dispositivo/{device_id}/telemetria
  * dispositivo/{device_id}/comandos
  * dispositivo/{device_id}/estado
- Simuladores de dispositivos en Python

### Infraestructura
- Docker + Docker Compose
- PostgreSQL en contenedor
- Mosquitto MQTT en contenedor

## Flujo de Datos Completo

1. **Autenticación**: Usuario se registra/login → JWT token
2. **Gestión Dispositivos**: CRUD de dispositivos via REST API
3. **Telemetría**:
   - Dispositivo publica en MQTT → dispositivo/{id}/telemetria
   - Django MQTT client recibe mensaje
   - Guarda en PostgreSQL
   - Emite evento WebSocket a frontend
   - Frontend actualiza gráficas en tiempo real
4. **Comandos**:
   - Frontend envía comando via API REST
   - Backend publica en MQTT → dispositivo/{id}/comandos
   - Dispositivo ejecuta y responde
   - Respuesta guardada en base de datos

## Modelos de Base de Datos

### User (Django Auth)
- id, email, password, username
- company_name, role (admin/user)

### Device
- id (UUID), name, device_type
- description, is_active, last_connection
- metadata (JSONField)
- owner (FK User)
- created_at, updated_at

### Telemetry
- id, device (FK), timestamp
- data (JSONField: {temperatura: 25.3, humedad: 60})
- índices en (device, timestamp)

### Command
- id (UUID), device (FK)
- command_type, payload (JSONField)
- status (pending/sent/executed/failed)
- sent_at, executed_at, response

### Alert (opcional)
- id, device (FK), rule_type
- condition (JSONField), is_active
- last_triggered

## Endpoints API REST

### Autenticación
- POST /api/auth/register/
- POST /api/auth/login/
- POST /api/auth/refresh/
- GET/PUT /api/auth/profile/

### Dispositivos
- GET/POST /api/devices/
- GET/PUT/DELETE /api/devices/{id}/
- GET /api/devices/{id}/telemetry/
- POST /api/devices/{id}/send_command/

### Telemetría
- GET /api/telemetry/?device={id}&start={date}&end={date}
- GET /api/telemetry/latest/{device_id}/
- GET /api/telemetry/statistics/{device_id}/

### Comandos
- GET/POST /api/commands/
- GET /api/commands/{id}/

## WebSocket Endpoints
- ws://localhost:8000/ws/telemetry/{device_id}/ (autenticado con JWT)
- ws://localhost:8000/ws/devices/status/

## Reglas de Desarrollo

1. **Código Completo**: No placeholders, código funcional siempre
2. **Español**: Comentarios, logs y documentación en español
3. **TypeScript**: Tipado estricto en frontend
4. **Type Hints**: Python con type hints en backend
5. **Error Handling**: Try-catch robusto en todo el código
6. **Logging**: Logs detallados en backend
7. **Validación**: Validar datos en frontend Y backend
8. **Seguridad**: JWT en headers, CORS configurado, sanitización de inputs
9. **Performance**: Índices en DB, cache cuando sea posible
10. **Testing**: Tests unitarios básicos al menos

## Convenciones de Código

### Python (Backend)
- PEP 8 compliant
- Snake_case para variables y funciones
- CamelCase para clases
- Docstrings en funciones importantes
- Type hints obligatorio

### TypeScript (Frontend)
- ESLint + Prettier
- camelCase para variables y funciones
- PascalCase para componentes React
- Interfaces para tipos
- Props tipados siempre

### Git
- Commits en español
- Mensajes descriptivos
- Feature branches

## Variables de Entorno Requeridas

### Backend (.env)
DEBUG=True
SECRET_KEY=tu-secret-key-aqui
POSTGRES_DB=iotdb
POSTGRES_USER=iotuser
POSTGRES_PASSWORD=iotuser1234
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000

## sistema operatvio 
arch linux

### frontend (.env)
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws

## Prioridades del Proyecto

1. ✅ MVP Funcional (Fases 1-9)
2. 🎨 UI/UX Polish (Fase 11)
3. ⚡ Performance (Fase 13)
4. 🧪 Testing (Fase 12)
5. 🚀 Deployment (Fase 15)
6. 🔥 Features Extras (Fases 14, 16) - Opcionales

## Notas Importantes

- Usuario ubicado en Bucaramanga, Colombia
- Proyecto para parcial/final de semestre
- Debe ser funcional y presentable
- Open source completo
- Sin costos de servicios cloud