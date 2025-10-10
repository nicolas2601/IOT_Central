# Script de inicio rápido para Windows (PowerShell)

Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "  Inicio Rápido - Plataforma IoT (Windows)" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

# Verificar que Mosquitto esté corriendo
Write-Host "→ Verificando Mosquitto..." -ForegroundColor Yellow
$mosquittoRunning = Get-Process -Name "mosquitto" -ErrorAction SilentlyContinue
if (-not $mosquittoRunning) {
    Write-Host "✗ Mosquitto no está corriendo" -ForegroundColor Red
    Write-Host "  Iniciando Mosquitto..." -ForegroundColor Yellow
    Start-Process -FilePath "mosquitto" -ArgumentList "-d" -NoNewWindow
    Start-Sleep -Seconds 2
}
Write-Host "✓ Mosquitto corriendo" -ForegroundColor Green
Write-Host ""

# Verificar dependencias
Write-Host "→ Verificando dependencias..." -ForegroundColor Yellow
try {
    python -c "import paho.mqtt.client" 2>$null
} catch {
    Write-Host "  Instalando paho-mqtt..." -ForegroundColor Yellow
    pip install paho-mqtt
}
Write-Host "✓ Dependencias instaladas" -ForegroundColor Green
Write-Host ""

# Preguntar cuántos dispositivos simular
Write-Host "¿Cuántos dispositivos deseas simular? (default: 3)" -ForegroundColor Yellow
$count = Read-Host "Cantidad"
if (-not $count) { $count = 3 }

Write-Host "¿Intervalo de telemetría en segundos? (default: 5)" -ForegroundColor Yellow
$interval = Read-Host "Intervalo"
if (-not $interval) { $interval = 5 }

Write-Host ""
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "  Configuración:" -ForegroundColor Yellow
Write-Host "  - Dispositivos: $count" -ForegroundColor Yellow
Write-Host "  - Intervalo: ${interval}s" -ForegroundColor Yellow
Write-Host "  - Broker: localhost:1883" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "✓ Iniciando simuladores..." -ForegroundColor Green
Write-Host "  Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host ""

# Ejecutar simuladores
python run_multiple_devices.py --count $count --interval $interval