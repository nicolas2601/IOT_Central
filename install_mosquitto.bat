@echo off
echo ========================================
echo  Instalando Mosquitto MQTT Broker
echo ========================================
echo.

echo [+] Descargando Mosquitto...
powershell -Command "Invoke-WebRequest -Uri 'https://mosquitto.org/files/binary/win64/mosquitto-2.0.22-install-windows-x64.exe' -OutFile 'mosquitto-installer.exe'"

echo [+] Instalando Mosquitto...
echo Ejecutando instalador. Por favor, sigue las instrucciones en pantalla.
echo IMPORTANTE: Selecciona la opcion para instalar como servicio.
echo.
mosquitto-installer.exe

echo.
echo [+] Agregando Mosquitto al PATH...
echo Esto permitira ejecutar los comandos de Mosquitto desde cualquier ubicacion.
echo.
echo Por favor, reinicia la terminal despues de la instalacion para que los cambios surtan efecto.
echo.
echo ========================================
echo  Instalacion completada!
echo ========================================
echo.
echo Para verificar la instalacion, ejecuta:
echo   verify_windows_setup.bat
echo.