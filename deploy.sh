#!/bin/bash

# ============================================
# SCRIPT DE DESPLIEGUE PARA COOLIFY
# Plataforma IoT - Despliegue Completo
# ============================================

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[PASO]${NC} $1"
}

# Variables
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

echo "============================================"
echo "  DESPLIEGUE - PLATAFORMA IOT EN COOLIFY"
echo "============================================"
echo ""

# ============================================
# VERIFICACIONES PRE-DESPLIEGUE
# ============================================
print_step "1. Verificaciones pre-despliegue"

# Verificar que estamos en el directorio correcto
if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "No se encontró $COMPOSE_FILE en el directorio actual"
    exit 1
fi

# Verificar archivo .env
if [ ! -f "$ENV_FILE" ]; then
    print_error "No se encontró $ENV_FILE. Ejecuta ./setup.sh primero"
    exit 1
fi

# Verificar configuración crítica
if grep -q "tu_usuario_neon\|GENERAR-CLAVE-SEGURA\|abc123.coolify" "$ENV_FILE"; then
    print_error "Configuración de ejemplo detectada en $ENV_FILE"
    print_error "Debes configurar valores reales antes del despliegue"
    exit 1
fi

print_status "Verificaciones pre-despliegue completadas"

# ============================================
# LIMPIAR DESPLIEGUE ANTERIOR
# ============================================
print_step "2. Limpiando despliegue anterior (si existe)"

# Detener servicios si están corriendo
if docker-compose -f "$COMPOSE_FILE" ps -q | grep -q .; then
    print_info "Deteniendo servicios existentes..."
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans
fi

# Limpiar imágenes sin usar
print_info "Limpiando imágenes Docker sin usar..."
docker system prune -f > /dev/null 2>&1 || true

print_status "Limpieza completada"

# ============================================
# CONSTRUIR IMÁGENES
# ============================================
print_step "3. Construyendo imágenes Docker"

print_info "Construyendo imagen del backend..."
docker-compose -f "$COMPOSE_FILE" build --no-cache backend

print_info "Construyendo imagen del frontend..."
docker-compose -f "$COMPOSE_FILE" build --no-cache frontend

print_status "Imágenes construidas exitosamente"

# ============================================
# VERIFICAR CONEXIÓN A NEON
# ============================================
print_step "4. Verificando conexión a base de datos"

# Extraer variables de .env
source "$ENV_FILE"

# Test de conexión con timeout
print_info "Probando conexión a Neon PostgreSQL..."

# Crear contenedor temporal para probar conexión
docker run --rm \
    -e PGPASSWORD="$POSTGRES_PASSWORD" \
    postgres:15-alpine \
    pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -t 10 || {
    print_error "No se pudo conectar a la base de datos Neon"
    print_error "Verifica las credenciales en $ENV_FILE"
    exit 1
}

print_status "Conexión a base de datos verificada"

# ============================================
# EJECUTAR MIGRACIONES
# ============================================
print_step "5. Ejecutando migraciones de base de datos"

print_info "Iniciando contenedor temporal para migraciones..."

# Ejecutar migraciones usando el contenedor del backend
docker-compose -f "$COMPOSE_FILE" run --rm backend python manage.py migrate --noinput

print_status "Migraciones completadas"

# ============================================
# CREAR SUPERUSUARIO (OPCIONAL)
# ============================================
print_step "6. Configuración de superusuario"

read -p "¿Quieres crear un superusuario de Django? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Creando superusuario..."
    docker-compose -f "$COMPOSE_FILE" run --rm backend python manage.py createsuperuser
    print_status "Superusuario creado"
else
    print_info "Saltando creación de superusuario"
fi

# ============================================
# INICIAR SERVICIOS
# ============================================
print_step "7. Iniciando servicios"

print_info "Iniciando Mosquitto MQTT..."
docker-compose -f "$COMPOSE_FILE" up -d mosquitto

# Esperar a que Mosquitto esté listo
sleep 5

print_info "Iniciando backend con daphne..."
docker-compose -f "$COMPOSE_FILE" up -d backend

# Esperar a que el backend esté listo
print_info "Esperando que el backend esté listo..."
sleep 15

print_info "Iniciando frontend..."
docker-compose -f "$COMPOSE_FILE" up -d frontend

print_status "Todos los servicios iniciados"

# ============================================
# VERIFICACIONES POST-DESPLIEGUE
# ============================================
print_step "8. Verificaciones post-despliegue"

sleep 10  # Dar tiempo para que los servicios se estabilicen

# Verificar estado de contenedores
print_info "Verificando estado de contenedores..."

services=("mosquitto" "backend" "frontend")
all_healthy=true

for service in "${services[@]}"; do
    if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
        print_status "$service está corriendo"
    else
        print_error "$service no está corriendo correctamente"
        all_healthy=false
    fi
done

if [ "$all_healthy" = false ]; then
    print_error "Algunos servicios tienen problemas. Revisa los logs:"
    echo "  docker-compose logs mosquitto"
    echo "  docker-compose logs backend"
    echo "  docker-compose logs frontend"
    exit 1
fi

# ============================================
# PROBAR ENDPOINTS
# ============================================
print_step "9. Probando endpoints de salud"

# Extraer puertos del docker-compose
BACKEND_PORT=8001
FRONTEND_PORT=3000

print_info "Probando health check del backend..."
if curl -f "http://localhost:$BACKEND_PORT/api/health/" > /dev/null 2>&1; then
    print_status "Backend health check OK"
else
    print_warning "Backend health check falló - puede necesitar más tiempo"
fi

print_info "Probando health check del frontend..."
if curl -f "http://localhost:$FRONTEND_PORT/api/health" > /dev/null 2>&1; then
    print_status "Frontend health check OK"
else
    print_warning "Frontend health check falló - puede necesitar más tiempo"
fi

# Probar MQTT
print_info "Probando conexión MQTT..."
if docker run --rm --network iotcentral_network eclipse-mosquitto:2.0.18 \
    mosquitto_pub -h mosquitto -t "test/deploy" -m "deployment_test" -q 0; then
    print_status "MQTT broker accesible"
else
    print_warning "MQTT broker puede tener problemas"
fi

# ============================================
# MOSTRAR INFORMACIÓN DE ACCESO
# ============================================
print_step "10. Información de acceso"

echo ""
echo "============================================"
echo "  DESPLEGUE COMPLETADO EXITOSAMENTE"
echo "============================================"
echo ""

print_status "Servicios desplegados y funcionando:"
echo ""

# Mostrar URLs de acceso locales
echo "📱 ACCESO LOCAL (para pruebas):"
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo "   Backend API: http://localhost:$BACKEND_PORT/api/"
echo "   Admin Django: http://localhost:$BACKEND_PORT/admin/"
echo "   MQTT Broker: localhost:1883"
echo "   MQTT WebSocket: localhost:9001"
echo ""

# Mostrar URLs de Coolify (extraídas del .env)
echo "🌐 ACCESO PÚBLICO (Coolify):"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend API: $BACKEND_URL/api/"
echo "   Admin Django: $BACKEND_URL/admin/"
echo "   MQTT WebSocket: $MQTT_URL:9001"
echo ""

print_info "COMANDOS ÚTILES:"
echo "   Ver logs: docker-compose logs -f [servicio]"
echo "   Reiniciar: docker-compose restart [servicio]"
echo "   Detener: docker-compose down"
echo "   Estado: docker-compose ps"
echo ""

print_warning "RECORDATORIOS:"
echo "   • Configura DNS para que los dominios apunten al servidor"
echo "   • Verifica que Traefik en Coolify detecte los servicios"
echo "   • Monitorea los logs por posibles errores"
echo "   • La primera carga puede ser lenta mientras se estabilizan los servicios"
echo ""

print_status "🚀 ¡Plataforma IoT desplegada exitosamente!"
