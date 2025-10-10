@echo off
echo ========================================
echo  Verificando configuración para Windows
echo ========================================
echo.

REM Verificar Python
echo [+] Verificando Python...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo [!] Error: Python no está instalado o no está en el PATH
    exit /b 1
)

REM Verificar entorno virtual
echo [+] Verificando entorno virtual...
if not exist venv\Scripts\activate.bat (
    echo [!] Error: Entorno virtual no encontrado
    echo [!] Ejecuta setup_windows.bat primero
    exit /b 1
)

REM Activar entorno virtual
call venv\Scripts\activate.bat

REM Verificar archivo .env
echo [+] Verificando archivo .env...
if not exist .env (
    echo [!] Error: Archivo .env no encontrado
    exit /b 1
)

REM Verificar Mosquitto
echo [+] Verificando Mosquitto...
where mosquitto >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Advertencia: Mosquitto no está en el PATH
    echo [!] Intentando buscar en la ubicación de instalación predeterminada...
    
    if exist "C:\Program Files\mosquitto\mosquitto.exe" (
        echo [+] Mosquitto encontrado en C:\Program Files\mosquitto
        echo [+] Puedes continuar, pero considera reiniciar el sistema para actualizar el PATH
    ) else (
        echo [!] Error: Mosquitto no está instalado
        echo [!] Instala Mosquitto desde https://mosquitto.org/download/
        exit /b 1
    )
)

REM Verificar conexión a la base de datos
echo [+] Verificando conexión a la base de datos...
python config_db_windows.py

echo.
echo ========================================
echo  Verificación completada!
echo ========================================
echo.
echo Para iniciar la plataforma:
echo   run_windows.bat
echo.