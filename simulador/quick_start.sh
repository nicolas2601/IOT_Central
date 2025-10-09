#!/bin/bash
# Script de inicio rápido para probar el sistema completo

echo "=========================================="
echo "  Inicio Rápido - Plataforma IoT"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que Mosquitto esté corriendo
echo -e "${YELLOW}→ Verificando Mosquitto...${NC}"
if ! pgrep -x "mosquitto" > /dev/null; then
    echo -e "${RED}✗ Mosquitto no está corriendo${NC}"
    echo -e "${YELLOW}  Iniciando Mosquitto...${NC}"
    mosquitto -d
    sleep 2
fi
echo -e "${GREEN}✓ Mosquitto corriendo${NC}"
echo ""

# Verificar dependencias
echo -e "${YELLOW}→ Verificando dependencias...${NC}"
if ! python3 -c "import paho.mqtt.client" 2>/dev/null; then
    echo -e "${YELLOW}  Instalando paho-mqtt...${NC}"
    pip install paho-mqtt
fi
echo -e "${GREEN}✓ Dependencias instaladas${NC}"
echo ""

# Preguntar cuántos dispositivos simular
echo -e "${YELLOW}¿Cuántos dispositivos deseas simular? (default: 3)${NC}"
read -p "Cantidad: " count
count=${count:-3}

echo -e "${YELLOW}¿Intervalo de telemetría en segundos? (default: 5)${NC}"
read -p "Intervalo: " interval
interval=${interval:-5}

echo ""
echo "=========================================="
echo "  Configuración:"
echo "  - Dispositivos: $count"
echo "  - Intervalo: ${interval}s"
echo "  - Broker: localhost:1883"
echo "=========================================="
echo ""
echo -e "${GREEN}✓ Iniciando simuladores...${NC}"
echo -e "${YELLOW}  Presiona Ctrl+C para detener${NC}"
echo ""

# Ejecutar simuladores
python3 run_multiple_devices.py --count $count --interval $interval
