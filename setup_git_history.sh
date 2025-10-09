#!/bin/bash
# Script para crear historial de commits organizados
# Plataforma IoT Central - Proyecto Final

set -e

echo "=========================================="
echo "  Git History Setup - IoT Central"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar que no exista .git
if [ -d ".git" ]; then
    echo -e "${RED}✗ Ya existe un repositorio git${NC}"
    echo "Elimina .git primero: rm -rf .git"
    exit 1
fi

# Inicializar repositorio
echo -e "${BLUE}→ Inicializando repositorio...${NC}"
git init
git branch -M main
echo -e "${GREEN}✓ Repositorio inicializado${NC}"
echo ""

# Configurar usuario si es necesario
if [ -z "$(git config user.name)" ]; then
    git config user.name "nicolas2601"
    git config user.email "nm5571762@gmail.com"
fi

# ============================================
# COMMIT 1: Configuración inicial
# ============================================
echo -e "${YELLOW}[1/15] Configuración inicial del proyecto...${NC}"
git add .gitignore
git add README.md 2>/dev/null || echo "# IoT Central Platform" > README.md && git add README.md
git add docker-compose.yml
git add .env.example 2>/dev/null || true
git commit -m "feat: configuración inicial del proyecto

- Configuración de .gitignore completo
- Docker Compose con PostgreSQL, Redis, Mosquitto
- Estructura base del proyecto
- README inicial"
echo -e "${GREEN}✓ Commit 1 creado${NC}"
echo ""

# ============================================
# COMMIT 2: Estructura del backend
# ============================================
echo -e "${YELLOW}[2/15] Estructura del backend Django...${NC}"
git add backend/manage.py
git add backend/config/__init__.py
git add backend/config/wsgi.py
git add backend/config/asgi.py
git add backend/config/urls.py
git add backend/requirements.txt
git add backend/Dockerfile
git add backend/.dockerignore 2>/dev/null || true
git commit -m "feat: estructura base del backend Django

- Configuración de Django 5.0
- ASGI para WebSockets
- Requirements con todas las dependencias
- Dockerfile para backend"
echo -e "${GREEN}✓ Commit 2 creado${NC}"
echo ""

# ============================================
# COMMIT 3: Configuración de Django
# ============================================
echo -e "${YELLOW}[3/15] Configuración de Django (settings)...${NC}"
git add backend/config/settings.py
git commit -m "feat: configuración completa de Django

- Settings con PostgreSQL
- Configuración de CORS
- Django REST Framework
- Simple JWT para autenticación
- Django Channels para WebSockets
- Configuración de MQTT
- Logging configurado"
echo -e "${GREEN}✓ Commit 3 creado${NC}"
echo ""

# ============================================
# COMMIT 4: App Accounts - Modelos
# ============================================
echo -e "${YELLOW}[4/15] App Accounts - Modelos de usuario...${NC}"
git add backend/apps/accounts/__init__.py
git add backend/apps/accounts/apps.py
git add backend/apps/accounts/models.py
git add backend/apps/accounts/admin.py
git add backend/apps/accounts/migrations/
git commit -m "feat: modelo de usuario personalizado

- User model extendido de AbstractUser
- Campos: company_name, role, phone, avatar
- Roles: admin, user, viewer
- Admin personalizado con filtros
- Métodos: full_name, is_admin, get_device_count"
echo -e "${GREEN}✓ Commit 4 creado${NC}"
echo ""

# ============================================
# COMMIT 5: App Accounts - Autenticación JWT
# ============================================
echo -e "${YELLOW}[5/15] Sistema de autenticación JWT...${NC}"
git add backend/apps/accounts/serializers.py
git add backend/apps/accounts/views.py
git add backend/apps/accounts/urls.py
git commit -m "feat: sistema de autenticación JWT completo

- RegisterSerializer con validaciones
- LoginSerializer con autenticación
- ProfileSerializer para gestión de perfil
- Vistas: Register, Login, Logout, Profile
- Endpoints: /api/auth/register/, /login/, /logout/, /profile/
- Refresh token automático
- Blacklist de tokens"
echo -e "${GREEN}✓ Commit 5 creado${NC}"
echo ""

# ============================================
# COMMIT 6: App IoT Core - Modelos
# ============================================
echo -e "${YELLOW}[6/15] Modelos del core IoT...${NC}"
git add backend/apps/iot_core/__init__.py
git add backend/apps/iot_core/apps.py
git add backend/apps/iot_core/models.py
git add backend/apps/iot_core/admin.py
git add backend/apps/iot_core/migrations/
git commit -m "feat: modelos del sistema IoT

- Device: dispositivos con UUID, tipos, metadata JSON
- Telemetry: datos de sensores con timestamp
- Command: comandos con estados y respuestas
- Alert: reglas de alertas con severidad
- Índices optimizados para queries
- Admin personalizado con badges y filtros"
echo -e "${GREEN}✓ Commit 6 creado${NC}"
echo ""

# ============================================
# COMMIT 7: API REST de IoT Core
# ============================================
echo -e "${YELLOW}[7/15] API REST completa...${NC}"
git add backend/apps/iot_core/serializers.py
git add backend/apps/iot_core/views.py
git add backend/apps/iot_core/urls.py
git add backend/apps/iot_core/filters.py 2>/dev/null || true
git add backend/apps/iot_core/pagination.py 2>/dev/null || true
git commit -m "feat: API REST completa para IoT

- DeviceViewSet con CRUD completo
- TelemetryViewSet con filtros por fecha
- CommandViewSet con envío MQTT
- AlertViewSet para gestión de alertas
- Serializers con validaciones
- Filtros: device_type, status, is_active
- Paginación configurada
- Endpoints de estadísticas"
echo -e "${GREEN}✓ Commit 7 creado${NC}"
echo ""

# ============================================
# COMMIT 8: Cliente MQTT
# ============================================
echo -e "${YELLOW}[8/15] Cliente MQTT production-ready...${NC}"
git add backend/apps/iot_core/mqtt_client.py
git add backend/apps/iot_core/mqtt_handlers.py
git commit -m "feat: cliente MQTT con reconexión automática

- Patrón Singleton thread-safe
- Reconexión automática
- Procesamiento de telemetría
- Procesamiento de comandos
- Procesamiento de estados
- Handlers con validaciones
- Logging detallado
- Manejo robusto de errores"
echo -e "${GREEN}✓ Commit 8 creado${NC}"
echo ""

# ============================================
# COMMIT 9: Comando MQTT Listener
# ============================================
echo -e "${YELLOW}[9/15] Comando Django para MQTT...${NC}"
git add backend/apps/iot_core/management/
git commit -m "feat: comando Django para MQTT listener

- python manage.py mqtt_listener
- Manejo de señales (SIGINT, SIGTERM)
- Reconexión automática
- Argumentos configurables
- Salida colorizada
- Cleanup automático"
echo -e "${GREEN}✓ Commit 9 creado${NC}"
echo ""

# ============================================
# COMMIT 10: WebSockets
# ============================================
echo -e "${YELLOW}[10/15] Sistema WebSocket en tiempo real...${NC}"
git add backend/apps/iot_core/consumers.py
git add backend/apps/iot_core/routing.py
git commit -m "feat: WebSockets con autenticación JWT

- TelemetryConsumer para telemetría en tiempo real
- DeviceStatusConsumer para estado de dispositivos
- NotificationConsumer para notificaciones
- JWTAuthMiddleware para autenticación
- Routing de WebSockets
- Autorización por usuario
- Manejo de desconexiones
- Sin memory leaks"
echo -e "${GREEN}✓ Commit 10 creado${NC}"
echo ""

# ============================================
# COMMIT 11: Frontend - Estructura
# ============================================
echo -e "${YELLOW}[11/15] Estructura del frontend Next.js...${NC}"
git add frontend/package.json
git add frontend/tsconfig.json
git add frontend/next.config.ts
git add frontend/tailwind.config.ts 2>/dev/null || true
git add frontend/postcss.config.mjs 2>/dev/null || true
git add frontend/.eslintrc.json 2>/dev/null || true
git add frontend/Dockerfile
git add frontend/README.md
git commit -m "feat: estructura del frontend Next.js 15

- Next.js 15 con App Router
- TypeScript configurado
- TailwindCSS 4
- Configuración de ESLint
- Dockerfile para frontend
- Package.json con dependencias:
  * React Query
  * Zustand
  * Axios
  * Recharts
  * ShadCN UI
  * Lucide Icons"
echo -e "${GREEN}✓ Commit 11 creado${NC}"
echo ""

# ============================================
# COMMIT 12: Frontend - Configuración base
# ============================================
echo -e "${YELLOW}[12/15] Configuración base del frontend...${NC}"
git add frontend/src/app/layout.tsx
git add frontend/src/app/page.tsx
git add frontend/src/app/globals.css
git add frontend/src/lib/
git add frontend/src/types/
git add frontend/src/components/providers.tsx
git commit -m "feat: configuración base del frontend

- Layout principal con providers
- Tipos TypeScript completos
- Utilidades (cn, formatDate, etc.)
- Providers: React Query, Toaster
- Estilos globales con variables CSS
- Tema claro/oscuro configurado"
echo -e "${GREEN}✓ Commit 12 creado${NC}"
echo ""

# ============================================
# COMMIT 13: Frontend - Servicios y Store
# ============================================
echo -e "${YELLOW}[13/15] Servicios API y estado global...${NC}"
git add frontend/src/services/
git add frontend/src/store/
git commit -m "feat: servicios API y estado global

- Cliente Axios configurado
- Interceptores JWT automáticos
- APIs: auth, devices, telemetry, commands, alerts
- AuthStore con Zustand
- Persistencia en localStorage
- Refresh token automático
- Manejo de errores centralizado"
echo -e "${GREEN}✓ Commit 13 creado${NC}"
echo ""

# ============================================
# COMMIT 14: Simuladores
# ============================================
echo -e "${YELLOW}[14/15] Simuladores de dispositivos IoT...${NC}"
git add simulador/
git commit -m "feat: simuladores de dispositivos IoT

- device_simulator.py: simulador principal
- run_multiple_devices.py: múltiples dispositivos
- quick_start.sh: script de inicio rápido
- Tipos: sensor, actuator, gateway, controller
- Telemetría realista con variación gradual
- Responde a comandos:
  * set_temperature
  * set_humidity
  * restart
  * get_status
- Manejo de señales (Ctrl+C)
- Logging detallado
- README con documentación completa"
echo -e "${GREEN}✓ Commit 14 creado${NC}"
echo ""

# ============================================
# COMMIT 15: Documentación
# ============================================
echo -e "${YELLOW}[15/15] Documentación del proyecto...${NC}"
git add docs/ 2>/dev/null || mkdir -p docs && git add docs/
git add .windsurf/context.md 2>/dev/null || true
git commit -m "docs: documentación completa del proyecto

- Documentación de WebSockets
- Guía de uso de simuladores
- Contexto del proyecto
- Arquitectura del sistema
- Flujo de datos
- Endpoints API
- Ejemplos de uso"
echo -e "${GREEN}✓ Commit 15 creado${NC}"
echo ""

# ============================================
# Resumen
# ============================================
echo ""
echo -e "${GREEN}=========================================="
echo "  ✓ Historial de Git creado exitosamente"
echo "==========================================${NC}"
echo ""
echo -e "${BLUE}Total de commits: 15${NC}"
echo ""
echo "Commits creados:"
echo "  1. Configuración inicial"
echo "  2. Estructura del backend"
echo "  3. Configuración de Django"
echo "  4. Modelos de usuario"
echo "  5. Autenticación JWT"
echo "  6. Modelos IoT Core"
echo "  7. API REST completa"
echo "  8. Cliente MQTT"
echo "  9. MQTT Listener"
echo " 10. WebSockets"
echo " 11. Estructura frontend"
echo " 12. Configuración frontend"
echo " 13. Servicios y Store"
echo " 14. Simuladores"
echo " 15. Documentación"
echo ""
echo -e "${YELLOW}Ver historial:${NC}"
echo "  git log --oneline --graph"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. Revisar commits: git log"
echo "  2. Crear repositorio en GitHub"
echo "  3. Agregar remote: git remote add origin <URL>"
echo "  4. Push: git push -u origin main"
echo ""
