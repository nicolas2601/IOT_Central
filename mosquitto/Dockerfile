# Dockerfile para Mosquitto MQTT Broker
# Plataforma IoT - Servicio independiente en Coolify

FROM eclipse-mosquitto:2.0.18

# Metadatos
LABEL maintainer="IoT Platform Team"
LABEL description="Mosquitto MQTT Broker para Plataforma IoT"
LABEL version="2.0.18"

# Crear usuario mosquitto si no existe
USER root

# Crear directorios necesarios
RUN mkdir -p /mosquitto/config /mosquitto/data /mosquitto/log && \
    chown -R mosquitto:mosquitto /mosquitto

# Copiar configuración personalizada
COPY mosquitto.conf /mosquitto/config/mosquitto.conf

# Establecer permisos correctos
RUN chown mosquitto:mosquitto /mosquitto/config/mosquitto.conf && \
    chmod 644 /mosquitto/config/mosquitto.conf

# Cambiar a usuario mosquitto
USER mosquitto

# Exponer puertos
EXPOSE 1883 9001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD mosquitto_pub -h localhost -t "health/check" -m "test" -q 0 || exit 1

# Comando por defecto
CMD ["/usr/sbin/mosquitto", "-c", "/mosquitto/config/mosquitto.conf"]
