# Guía de Despliegue en Render

Esta guía te ayudará a desplegar la Plataforma IoT en Render usando Docker.

## Requisitos Previos

1. Cuenta en [Render](https://render.com)
2. Repositorio Git con tu código (GitHub, GitLab, etc.)
3. Base de datos PostgreSQL ya desplegada (como mencionaste que ya tienes)

## Paso 1: Preparar el Repositorio

Asegúrate de que los siguientes archivos estén en tu repositorio:

- `docker-compose.render.yml`
- `backend/Dockerfile.render`
- `backend/.env.render`
- `mosquitto/mosquitto.render.conf`

## Paso 2: Crear un Web Service en Render

1. Inicia sesión en tu cuenta de Render
2. Ve a Dashboard y haz clic en "New +"
3. Selecciona "Web Service"
4. Conecta tu repositorio de GitHub/GitLab
5. Configura el servicio:
   - **Name**: `iot-platform-backend` (o el nombre que prefieras)
   - **Environment**: Docker
   - **Docker Command**: Deja en blanco (usaremos el CMD del Dockerfile)
   - **Branch**: `main` (o la rama que uses)

## Paso 3: Configurar Variables de Entorno

En la sección "Environment" de tu servicio en Render, añade las siguientes variables:

```
PORT=8000
DEBUG=False
SECRET_KEY=tu_clave_secreta_segura
POSTGRES_DB=neondb
POSTGRES_USER=neondb_owner
POSTGRES_PASSWORD=npg_t9pTFV0GNXar
POSTGRES_HOST=ep-fancy-bonus-a8h2fj9n-pooler.eastus2.azure.neon.tech
POSTGRES_PORT=5432
DATABASE_URL=postgresql://neondb_owner:npg_t9pTFV0GNXar@ep-fancy-bonus-a8h2fj9n-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require
ALLOWED_HOSTS=.onrender.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://tu-frontend.onrender.com,http://localhost:3000
REDIS_URL=redis://redis:6379/0
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883
```

## Paso 4: Configurar Docker en Render

En la sección "Advanced" de tu servicio en Render:

1. **Dockerfile Path**: `backend/Dockerfile.render`
2. **Docker Build Context**: `.`
3. **Docker Command**: Deja en blanco (usaremos el CMD del Dockerfile)

## Paso 5: Configurar Redis en Render

Para Redis, puedes usar el servicio Redis de Render:

1. Ve a Dashboard y haz clic en "New +"
2. Selecciona "Redis"
3. Configura el servicio:
   - **Name**: `iot-platform-redis`
   - **Plan**: Selecciona el plan que se ajuste a tus necesidades

Una vez creado, obtén la URL de conexión y actualiza la variable `REDIS_URL` en tu servicio backend.

## Paso 6: Configurar Mosquitto en Render

Para Mosquitto, necesitarás crear otro Web Service:

1. Ve a Dashboard y haz clic en "New +"
2. Selecciona "Web Service"
3. Conecta tu repositorio
4. Configura el servicio:
   - **Name**: `iot-platform-mosquitto`
   - **Environment**: Docker
   - **Dockerfile Path**: Crea un Dockerfile específico para Mosquitto o usa una imagen pública
   - **Docker Command**: Deja en blanco

## Paso 7: Verificar el Despliegue

1. Una vez que todos los servicios estén desplegados, verifica que estén funcionando correctamente
2. Accede a tu backend a través de la URL proporcionada por Render
3. Prueba la conexión a la base de datos y a Redis
4. Verifica que Mosquitto esté funcionando correctamente

## Paso 8: Configurar el Frontend

Si también quieres desplegar el frontend en Render:

1. Crea un nuevo Web Service para el frontend
2. Configura las variables de entorno para apuntar a tu backend desplegado
3. Despliega el frontend

## Solución de Problemas

### Error de conexión a la base de datos

Verifica que las credenciales de la base de datos sean correctas y que la base de datos esté accesible desde Render.

### Error de conexión a Redis

Asegúrate de que la URL de Redis sea correcta y que el servicio Redis esté funcionando.

### Error de conexión a Mosquitto

Verifica que Mosquitto esté correctamente configurado y que los puertos estén abiertos.

## Notas Importantes

1. **Seguridad**: Asegúrate de no exponer credenciales sensibles en tu código. Usa variables de entorno en Render.
2. **Escalabilidad**: Render permite escalar tus servicios según sea necesario.
3. **Monitoreo**: Utiliza las herramientas de monitoreo de Render para supervisar el rendimiento de tus servicios.
4. **Costos**: Ten en cuenta los costos asociados con los servicios de Render. Hay planes gratuitos disponibles para desarrollo.

## Recursos Adicionales

- [Documentación de Render](https://render.com/docs)
- [Documentación de Docker](https://docs.docker.com/)
- [Documentación de Django](https://docs.djangoproject.com/)
- [Documentación de Mosquitto](https://mosquitto.org/documentation/)