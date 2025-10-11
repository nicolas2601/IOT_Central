@echo off
echo ========================================
echo  Iniciando Plataforma IoT en Windows
echo ========================================
echo.

REM Activar entorno virtual
call venv\Scripts\activate.bat

REM Iniciar Mosquitto si no está corriendo
tasklist /FI "IMAGENAME eq mosquitto.exe" 2>NUL | find /I /N "mosquitto.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo [+] Iniciando Mosquitto...
    start /B mosquitto -d
    timeout /t 2 /nobreak > NUL
)

REM Iniciar backend con Daphne
echo [+] Iniciando backend con Daphne...
start cmd /k "call venv\Scripts\activate.bat && cd backend && python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application"

REM Esperar a que el backend esté listo
echo [+] Esperando a que el backend esté listo...
timeout /t 5 /nobreak > NUL

REM Iniciar simulador
echo [+] Iniciando simulador de dispositivos...
start cmd /k "call venv\Scripts\activate.bat && cd simulador && python device_simulator.py --device-id sim001 --device-type sensor --broker localhost --port 1883 --interval 5"

echo.
echo ========================================
echo  Plataforma IoT iniciada!
echo ========================================
echo.
echo Backend: http://localhost:8000/api
echo Admin: http://localhost:8000/admin
echo.
echo Para detener, cierra las ventanas de comandos
echo o presiona Ctrl+C en cada una de ellas.
echo.