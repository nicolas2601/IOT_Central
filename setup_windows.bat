@echo off
echo ========================================
echo  Configurando Plataforma IoT para Windows
echo ========================================
echo.

REM Crear entorno virtual
echo [+] Creando entorno virtual...
python -m venv venv
echo [+] Entorno virtual creado!

REM Activar entorno virtual
echo [+] Activando entorno virtual...
call venv\Scripts\activate.bat

REM Instalar dependencias
echo [+] Instalando dependencias del backend...
cd backend
pip install -r requirements.txt
pip install django daphne channels python-decouple whitenoise
cd ..

echo [+] Instalando dependencias del simulador...
cd simulador
pip install -r requirements.txt
cd ..

REM Crear archivo .env
echo [+] Creando archivo .env...
copy .env.example .env

echo.
echo ========================================
echo  Configuración completada!
echo ========================================
echo.
echo Para activar el entorno virtual:
echo   call venv\Scripts\activate.bat
echo.
echo Para iniciar el backend:
echo   cd backend
echo   python manage.py runserver
echo.
echo Para ejecutar el simulador:
echo   cd simulador
echo   python device_simulator.py
echo.