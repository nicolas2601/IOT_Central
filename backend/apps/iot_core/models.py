"""
Modelos de la aplicación IoT Core

Define los modelos para:
- Device: Dispositivos IoT
- Telemetry: Datos de telemetría
- Command: Comandos enviados a dispositivos
- Alert: Alertas y reglas
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.utils import timezone

User = get_user_model()


class Device(models.Model):
    """
    Modelo de Dispositivo IoT.
    
    Representa un dispositivo físico conectado a la plataforma.
    Cada dispositivo pertenece a un usuario y puede enviar telemetría
    y recibir comandos.
    """
    
    DEVICE_TYPE_CHOICES = [
        ('sensor', 'Sensor'),
        ('actuator', 'Actuador'),
        ('gateway', 'Gateway'),
        ('controller', 'Controlador'),
        ('other', 'Otro'),
    ]
    
    STATUS_CHOICES = [
        ('online', 'En línea'),
        ('offline', 'Fuera de línea'),
        ('error', 'Error'),
        ('maintenance', 'Mantenimiento'),
    ]
    
    # Identificador único
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='Identificador único del dispositivo'
    )
    
    # Información básica
    name = models.CharField(
        'nombre',
        max_length=200,
        help_text='Nombre descriptivo del dispositivo'
    )
    
    device_type = models.CharField(
        'tipo de dispositivo',
        max_length=20,
        choices=DEVICE_TYPE_CHOICES,
        default='sensor',
        help_text='Tipo de dispositivo IoT'
    )
    
    description = models.TextField(
        'descripción',
        blank=True,
        null=True,
        help_text='Descripción detallada del dispositivo'
    )
    
    # Estado y conexión
    is_active = models.BooleanField(
        'activo',
        default=True,
        help_text='Indica si el dispositivo está activo en la plataforma'
    )
    
    status = models.CharField(
        'estado',
        max_length=20,
        choices=STATUS_CHOICES,
        default='offline',
        help_text='Estado actual del dispositivo'
    )
    
    last_connection = models.DateTimeField(
        'última conexión',
        null=True,
        blank=True,
        help_text='Última vez que el dispositivo se conectó'
    )
    
    # Metadata flexible en JSON
    metadata = models.JSONField(
        'metadatos',
        default=dict,
        blank=True,
        help_text='Información adicional del dispositivo en formato JSON'
    )
    
    # Relación con usuario
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='devices',
        verbose_name='propietario',
        help_text='Usuario propietario del dispositivo'
    )
    
    # Ubicación (opcional)
    location = models.CharField(
        'ubicación',
        max_length=200,
        blank=True,
        null=True,
        help_text='Ubicación física del dispositivo'
    )
    
    latitude = models.DecimalField(
        'latitud',
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text='Latitud de la ubicación'
    )
    
    longitude = models.DecimalField(
        'longitud',
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text='Longitud de la ubicación'
    )
    
    # Timestamps
    created_at = models.DateTimeField('fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('fecha de actualización', auto_now=True)
    
    class Meta:
        verbose_name = 'dispositivo'
        verbose_name_plural = 'dispositivos'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'is_active']),
            models.Index(fields=['device_type']),
            models.Index(fields=['status']),
            models.Index(fields=['-last_connection']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.device_type})"
    
    def update_last_connection(self):
        """Actualiza la última conexión del dispositivo"""
        self.last_connection = timezone.now()
        self.status = 'online'
        self.save(update_fields=['last_connection', 'status'])
    
    def get_latest_telemetry(self, limit=10):
        """Obtiene la telemetría más reciente del dispositivo"""
        return self.telemetry_data.order_by('-timestamp')[:limit]
    
    def get_telemetry_count(self):
        """Retorna el número total de registros de telemetría"""
        return self.telemetry_data.count()
    
    def get_command_count(self):
        """Retorna el número total de comandos enviados"""
        return self.commands.count()


class Telemetry(models.Model):
    """
    Modelo de Telemetría.
    
    Almacena los datos enviados por los dispositivos IoT.
    Los datos se guardan en formato JSON para flexibilidad.
    """
    
    # Identificador
    id = models.BigAutoField(primary_key=True)
    
    # Relación con dispositivo
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='telemetry_data',
        verbose_name='dispositivo',
        help_text='Dispositivo que envió la telemetría'
    )
    
    # Timestamp de la telemetría
    timestamp = models.DateTimeField(
        'timestamp',
        default=timezone.now,
        db_index=True,
        help_text='Momento en que se generó la telemetría'
    )
    
    # Datos de telemetría en JSON
    data = models.JSONField(
        'datos',
        help_text='Datos de telemetría en formato JSON (ej: {"temperatura": 25.3, "humedad": 60})'
    )
    
    # Timestamp de recepción
    received_at = models.DateTimeField(
        'recibido en',
        auto_now_add=True,
        help_text='Momento en que se recibió la telemetría en el servidor'
    )
    
    class Meta:
        verbose_name = 'telemetría'
        verbose_name_plural = 'telemetrías'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['device', '-timestamp']),
            models.Index(fields=['-timestamp']),
            models.Index(fields=['-received_at']),
        ]
        # Particionamiento por fecha (para optimización futura)
        # db_table = 'iot_core_telemetry'
    
    def __str__(self):
        return f"Telemetría de {self.device.name} - {self.timestamp}"


class Command(models.Model):
    """
    Modelo de Comando.
    
    Representa comandos enviados desde la plataforma hacia los dispositivos.
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('sent', 'Enviado'),
        ('executed', 'Ejecutado'),
        ('failed', 'Fallido'),
        ('timeout', 'Timeout'),
    ]
    
    # Identificador único
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='Identificador único del comando'
    )
    
    # Relación con dispositivo
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='commands',
        verbose_name='dispositivo',
        help_text='Dispositivo destino del comando'
    )
    
    # Tipo de comando
    command_type = models.CharField(
        'tipo de comando',
        max_length=100,
        help_text='Tipo o nombre del comando (ej: set_temperature, restart, update_config)'
    )
    
    # Payload del comando en JSON
    payload = models.JSONField(
        'payload',
        default=dict,
        blank=True,
        help_text='Datos del comando en formato JSON'
    )
    
    # Estado del comando
    status = models.CharField(
        'estado',
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text='Estado actual del comando'
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        'creado en',
        auto_now_add=True,
        help_text='Momento en que se creó el comando'
    )
    
    sent_at = models.DateTimeField(
        'enviado en',
        null=True,
        blank=True,
        help_text='Momento en que se envió el comando al dispositivo'
    )
    
    executed_at = models.DateTimeField(
        'ejecutado en',
        null=True,
        blank=True,
        help_text='Momento en que el dispositivo ejecutó el comando'
    )
    
    # Respuesta del dispositivo
    response = models.JSONField(
        'respuesta',
        null=True,
        blank=True,
        help_text='Respuesta del dispositivo en formato JSON'
    )
    
    # Usuario que creó el comando
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='commands_created',
        verbose_name='creado por',
        help_text='Usuario que creó el comando'
    )
    
    class Meta:
        verbose_name = 'comando'
        verbose_name_plural = 'comandos'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['device', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.command_type} -> {self.device.name} ({self.status})"
    
    def mark_as_sent(self):
        """Marca el comando como enviado"""
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at'])
    
    def mark_as_executed(self, response=None):
        """Marca el comando como ejecutado"""
        self.status = 'executed'
        self.executed_at = timezone.now()
        if response:
            self.response = response
        self.save(update_fields=['status', 'executed_at', 'response'])
    
    def mark_as_failed(self, error_message=None):
        """Marca el comando como fallido"""
        self.status = 'failed'
        if error_message:
            self.response = {'error': error_message}
        self.save(update_fields=['status', 'response'])


class Alert(models.Model):
    """
    Modelo de Alerta.
    
    Define reglas de alertas basadas en condiciones de telemetría.
    """
    
    RULE_TYPE_CHOICES = [
        ('threshold', 'Umbral'),
        ('range', 'Rango'),
        ('change', 'Cambio'),
        ('offline', 'Dispositivo Offline'),
    ]
    
    SEVERITY_CHOICES = [
        ('low', 'Baja'),
        ('medium', 'Media'),
        ('high', 'Alta'),
        ('critical', 'Crítica'),
    ]
    
    # Identificador
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    
    # Relación con dispositivo
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='alerts',
        verbose_name='dispositivo'
    )
    
    # Configuración de la alerta
    name = models.CharField('nombre', max_length=200)
    
    rule_type = models.CharField(
        'tipo de regla',
        max_length=20,
        choices=RULE_TYPE_CHOICES,
        default='threshold'
    )
    
    condition = models.JSONField(
        'condición',
        help_text='Condición de la alerta en formato JSON'
    )
    
    severity = models.CharField(
        'severidad',
        max_length=20,
        choices=SEVERITY_CHOICES,
        default='medium'
    )
    
    # Estado
    is_active = models.BooleanField('activa', default=True)
    
    # Notificaciones
    notify_email = models.BooleanField('notificar por email', default=False)
    notify_webhook = models.URLField('webhook', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField('creado en', auto_now_add=True)
    last_triggered = models.DateTimeField('última activación', null=True, blank=True)
    
    class Meta:
        verbose_name = 'alerta'
        verbose_name_plural = 'alertas'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['device', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.device.name}"
