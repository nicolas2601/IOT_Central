# Guía de Instalación para Windows - Plataforma IoT

Esta guía contiene las instrucciones específicas para ejecutar la Plataforma IoT en entornos Windows.

## Requisitos Previos

- Python 3.11+ instalado
- PostgreSQL (opcional, usamos NEON-tech como servicio remoto)
- Mosquitto MQTT Broker instalado
- Git

## Instalación Rápida

1. **Configurar el entorno**

   Ejecuta el script de configuración automática:
   ```
   setup_windows.bat
   ```

   Este script:
   - Crea un entorno virtual (venv)
   - Instala todas las dependencias
   - Crea el archivo .env con la configuración necesaria

2. **Activar el entorno virtual**

   ```
   call venv\Scripts\activate.bat
   ```

3. **Verificar la conexión a la base de datos**

   ```
   python config_db_windows.py
   ```

4. **Ejecutar migraciones**

   ```
   cd backend
   python manage.py migrate
   ```

5. **Crear superusuario**

   ```
   python manage.py createsuperuser
   ```

## Iniciar la Plataforma

Para iniciar todos los componentes de la plataforma:

```
run_windows.bat
```

Este script inicia:
- Mosquitto MQTT Broker (si no está en ejecución)
- Backend Django
- Simulador de dispositivos

## Iniciar Componentes Individualmente

### Backend

```
cd backend
python manage.py runserver
```

### Simulador de Dispositivos

```
cd simulador
python device_simulator.py
```

O para múltiples dispositivos:

```
cd simulador
powershell -ExecutionPolicy Bypass -File .\quick_start.ps1
```

## Diferencias con Linux/macOS

1. **Activación del entorno virtual**
   - Windows: `call venv\Scripts\activate.bat`
   - Linux/macOS: `source venv/bin/activate`

2. **Separador de rutas**
   - Windows: Usa `\` (backslash)
   - Linux/macOS: Usa `/` (forward slash)

3. **Scripts de shell**
   - Windows: Usa `.bat` o PowerShell (`.ps1`)
   - Linux/macOS: Usa scripts bash (`.sh`)

4. **Comandos de terminal**
   - Windows: Usa comandos CMD o PowerShell
   - Linux/macOS: Usa comandos bash/shell

## Solución de Problemas

### Error al iniciar Mosquitto

Si Mosquitto no inicia correctamente:

1. Verifica que esté instalado correctamente:
   ```
   mosquitto -v
   ```

2. Instala Mosquitto si es necesario:
   - Descarga desde: https://mosquitto.org/download/
   - O usa: `winget install mosquitto`

3. Asegúrate de que el servicio esté habilitado:
   ```
   net start mosquitto
   ```

### Error de conexión a la base de datos

Si tienes problemas para conectar a NEON-tech:

1. Verifica tu conexión a internet
2. Comprueba las credenciales en el archivo `.env`
3. Asegúrate de que el firewall no esté bloqueando la conexión

### Error al iniciar Django

Si Django no inicia correctamente:

1. Verifica que el entorno virtual esté activado
2. Comprueba que todas las dependencias estén instaladas:
   ```
   pip install -r backend/requirements.txt
   ```
3. Verifica los logs de error en la consola

## Notas Adicionales

- Los comandos en los scripts de Windows usan `;` en lugar de `&&` para encadenar comandos
- Para ejecutar scripts PowerShell, puede ser necesario cambiar la política de ejecución:
  ```
  Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
  ```