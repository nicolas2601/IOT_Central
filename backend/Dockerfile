# Dockerfile optimizado para Backend Django con Daphne (ASGI)
# Plataforma IoT - Despliegue en Coolify

# Stage 1: Base con Python y dependencias del sistema
FROM python:3.11-slim as base

# Metadatos
LABEL maintainer="IoT Platform Team"
LABEL description="Backend Django con daphne para Plataforma IoT"
LABEL version="1.0"

# Variables de entorno de Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instalar dependencias del sistema necesarias para PostgreSQL y compilación
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Crear usuario no-root para seguridad
RUN groupadd -r django && useradd -r -g django django

# Stage 2: Dependencias de Python
FROM base as dependencies

# Copiar requirements y instalar dependencias Python
COPY requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip \
    && pip install -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

# Stage 3: Aplicación final
FROM dependencies as final

# Crear directorios necesarios
RUN mkdir -p /app/logs /app/media /app/static \
    && chown -R django:django /app

# Establecer directorio de trabajo
WORKDIR /app

# Copiar código de la aplicación
COPY --chown=django:django . /app/

# Crear directorio de logs si no existe
RUN mkdir -p /app/logs && chown django:django /app/logs

# Cambiar a usuario no-root
USER django

# Exponer puerto 8001 para daphne
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/api/health/ || exit 1

# Comando por defecto: ejecutar con daphne (ASGI server)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8001", "config.asgi:application"]
