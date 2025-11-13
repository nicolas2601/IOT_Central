#!/bin/bash

# ============================================
# SCRIPT DE CONFIGURACIÓN INICIAL
# Plataforma IoT - Despliegue en Coolify
# ============================================

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

echo "============================================"
echo "  CONFIGURACIÓN INICIAL - PLATAFORMA IOT"
echo "============================================"
echo ""

# ============================================
# VERIFICAR DEPENDENCIAS
# ============================================
print_info "Verificando dependencias del sistema..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado"
    exit 1
fi
print_status "Docker está instalado: $(docker --version)"

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose no está instalado"
    exit 1
fi
print_status "Docker Compose está disponible"

# Verificar que Docker esté corriendo
if ! docker info &> /dev/null; then
    print_error "Docker daemon no está corriendo"
    exit 1
fi
print_status "Docker daemon está corriendo"

# ============================================
# VERIFICAR ESTRUCTURA DEL PROYECTO
# ============================================
print_info "Verificando estructura del proyecto..."

required_files=(
    "docker-compose.yml"
    "backend/Dockerfile"
    "frontend/Dockerfile"
    "mosquitto/mosquitto.conf"
    ".env.example"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Archivo requerido no encontrado: $file"
        exit 1
    fi
done
print_status "Estructura del proyecto verificada"

# ============================================
# CONFIGURAR ARCHIVO .env
# ============================================
print_info "Configurando archivo .env..."

if [ ! -f ".env" ]; then
    print_warning "Archivo .env no existe, creando desde .env.example..."
    cp .env.example .env
    print_status "Archivo .env creado"
    
    print_warning "IMPORTANTE: Debes editar el archivo .env con tus configuraciones reales:"
    echo "  - Dominios de Coolify"
    echo "  - Credenciales de Neon PostgreSQL"
    echo "  - SECRET_KEY de Django"
    read -p "¿Quieres abrir el archivo .env para editarlo ahora? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
else
    print_status "Archivo .env ya existe"
fi

# ============================================
# VERIFICAR CONFIGURACIÓN DE NEON
# ============================================
print_info "Verificando configuración de base de datos..."

if grep -q "tu_usuario_neon" .env; then
    print_warning "Detectadas configuraciones de ejemplo en .env"
    print_warning "Asegúrate de configurar las credenciales reales de Neon PostgreSQL"
fi

# ============================================
# VERIFICAR PUERTOS DISPONIBLES
# ============================================
print_info "Verificando puertos disponibles..."

check_port() {
    local port=$1
    local service=$2
    
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        print_warning "Puerto $port ($service) está en uso"
        return 1
    else
        print_status "Puerto $port ($service) disponible"
        return 0
    fi
}

# Verificar puertos principales
check_port 8001 "Backend (daphne)"
check_port 3000 "Frontend"
check_port 1883 "MQTT"
check_port 9001 "MQTT WebSocket"

# ============================================
# CREAR DIRECTORIOS DE LOGS
# ============================================
print_info "Creando directorios necesarios..."

mkdir -p backend/logs
mkdir -p logs
chmod 755 backend/logs logs

print_status "Directorios creados"

# ============================================
# VERIFICAR CONEXIÓN A INTERNET
# ============================================
print_info "Verificando conexión a internet..."

if ping -c 1 google.com &> /dev/null; then
    print_status "Conexión a internet disponible"
else
    print_warning "Sin conexión a internet - puede afectar la descarga de imágenes Docker"
fi

# ============================================
# PREPARAR MOSQUITTO
# ============================================
print_info "Preparando configuración de Mosquitto..."

if [ -f "mosquitto/mosquitto.conf" ]; then
    print_status "Configuración de Mosquitto encontrada"
else
    print_error "Archivo mosquitto/mosquitto.conf no encontrado"
    exit 1
fi

# ============================================
# GENERAR SECRET_KEY SI ES NECESARIO
# ============================================
print_info "Verificando SECRET_KEY de Django..."

if grep -q "django-insecure-GENERAR-CLAVE-SEGURA" .env; then
    print_warning "SECRET_KEY de ejemplo detectada"
    
    # Generar nueva SECRET_KEY
    new_secret_key=$(python3 -c "
import secrets
import string
alphabet = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
print(''.join(secrets.choice(alphabet) for _ in range(50)))
" 2>/dev/null || echo "django-$(date +%s)-$(openssl rand -hex 16)")
    
    # Reemplazar en .env
    if command -v sed &> /dev/null; then
        sed -i "s/django-insecure-GENERAR-CLAVE-SEGURA-EN-PRODUCCION-muy-larga-y-aleatoria-123456789/$new_secret_key/" .env
        print_status "SECRET_KEY generada automáticamente"
    else
        print_warning "No se pudo generar SECRET_KEY automáticamente"
        print_warning "Reemplaza manualmente la SECRET_KEY en .env"
    fi
fi

# ============================================
# RESUMEN FINAL
# ============================================
echo ""
echo "============================================"
echo "  CONFIGURACIÓN INICIAL COMPLETADA"
echo "============================================"
echo ""

print_status "Sistema listo para despliegue"
echo ""
print_info "Próximos pasos:"
echo "  1. Verifica y edita el archivo .env con tus configuraciones"
echo "  2. Asegúrate de tener creada la base de datos en Neon"
echo "  3. Ejecuta: ./deploy.sh para iniciar el despliegue"
echo ""

print_warning "RECORDATORIOS IMPORTANTES:"
echo "  • Configura los dominios reales generados por Coolify en .env"
echo "  • Verifica las credenciales de Neon PostgreSQL"  
echo "  • Los puertos 8001, 3000, 1883 y 9001 deben estar disponibles"
echo ""
