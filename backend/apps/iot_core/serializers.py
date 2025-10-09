"""
Serializadores de la aplicación IoT Core

Define los serializadores para:
- Device (Dispositivos)
- Telemetry (Telemetría)
- Command (Comandos)
- Alert (Alertas)
"""
from rest_framework import serializers
from django.utils import timezone
from .models import Device, Telemetry, Command, Alert


class DeviceSerializer(serializers.ModelSerializer):
    """
    Serializador completo de dispositivos.
    Incluye información del propietario y estadísticas.
    """
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    telemetry_count = serializers.SerializerMethodField()
    command_count = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    
    class Meta:
        model = Device
        fields = [
            'id', 'name', 'device_type', 'description', 'is_active',
            'status', 'last_connection', 'metadata', 'owner', 'owner_username',
            'owner_email', 'location', 'latitude', 'longitude',
            'telemetry_count', 'command_count', 'is_online',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at', 'last_connection']
    
    def get_telemetry_count(self, obj):
        """Retorna el número de registros de telemetría"""
        return obj.get_telemetry_count()
    
    def get_command_count(self, obj):
        """Retorna el número de comandos enviados"""
        return obj.get_command_count()
    
    def get_is_online(self, obj):
        """Determina si el dispositivo está online (conectado en los últimos 5 minutos)"""
        if not obj.last_connection:
            return False
        time_diff = timezone.now() - obj.last_connection
        return time_diff.total_seconds() < 300  # 5 minutos
    
    def validate_metadata(self, value):
        """Valida que metadata sea un diccionario válido"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Los metadatos deben ser un objeto JSON válido")
        return value


class DeviceCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear dispositivos.
    Más simple que el serializador completo.
    """
    class Meta:
        model = Device
        fields = [
            'name', 'device_type', 'description', 'metadata',
            'location', 'latitude', 'longitude'
        ]
    
    def create(self, validated_data):
        """Crea un dispositivo asignándolo al usuario autenticado"""
        user = self.context['request'].user
        device = Device.objects.create(owner=user, **validated_data)
        return device


class DeviceListSerializer(serializers.ModelSerializer):
    """
    Serializador ligero para listado de dispositivos.
    Solo incluye información esencial.
    """
    is_online = serializers.SerializerMethodField()
    
    class Meta:
        model = Device
        fields = [
            'id', 'name', 'device_type', 'status', 'is_active',
            'last_connection', 'is_online', 'location', 'created_at'
        ]
    
    def get_is_online(self, obj):
        """Determina si el dispositivo está online"""
        if not obj.last_connection:
            return False
        time_diff = timezone.now() - obj.last_connection
        return time_diff.total_seconds() < 300


class TelemetrySerializer(serializers.ModelSerializer):
    """
    Serializador completo de telemetría.
    """
    device_name = serializers.CharField(source='device.name', read_only=True)
    device_type = serializers.CharField(source='device.device_type', read_only=True)
    
    class Meta:
        model = Telemetry
        fields = [
            'id', 'device', 'device_name', 'device_type',
            'timestamp', 'data', 'received_at'
        ]
        read_only_fields = ['id', 'received_at']
    
    def validate_data(self, value):
        """Valida que data sea un diccionario válido"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Los datos deben ser un objeto JSON válido")
        if not value:
            raise serializers.ValidationError("Los datos no pueden estar vacíos")
        return value


class TelemetryCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear telemetría.
    Usado por dispositivos para enviar datos.
    """
    class Meta:
        model = Telemetry
        fields = ['device', 'timestamp', 'data']
    
    def validate_device(self, value):
        """Valida que el dispositivo exista y esté activo"""
        if not value.is_active:
            raise serializers.ValidationError("El dispositivo no está activo")
        return value


class TelemetryStatsSerializer(serializers.Serializer):
    """
    Serializador para estadísticas de telemetría.
    """
    device_id = serializers.UUIDField()
    device_name = serializers.CharField()
    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField()
    total_records = serializers.IntegerField()
    metrics = serializers.DictField()


class CommandSerializer(serializers.ModelSerializer):
    """
    Serializador completo de comandos.
    """
    device_name = serializers.CharField(source='device.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    execution_time = serializers.SerializerMethodField()
    
    class Meta:
        model = Command
        fields = [
            'id', 'device', 'device_name', 'command_type', 'payload',
            'status', 'created_at', 'sent_at', 'executed_at',
            'response', 'created_by', 'created_by_username', 'execution_time'
        ]
        read_only_fields = [
            'id', 'status', 'created_at', 'sent_at', 'executed_at',
            'response', 'created_by'
        ]
    
    def get_execution_time(self, obj):
        """Calcula el tiempo de ejecución del comando en segundos"""
        if obj.sent_at and obj.executed_at:
            delta = obj.executed_at - obj.sent_at
            return round(delta.total_seconds(), 2)
        return None
    
    def validate_payload(self, value):
        """Valida que payload sea un diccionario válido"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("El payload debe ser un objeto JSON válido")
        return value


class CommandCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear comandos.
    """
    class Meta:
        model = Command
        fields = ['device', 'command_type', 'payload']
    
    def validate_device(self, value):
        """Valida que el dispositivo exista, esté activo y pertenezca al usuario"""
        if not value.is_active:
            raise serializers.ValidationError("El dispositivo no está activo")
        
        user = self.context['request'].user
        if value.owner != user and not user.is_admin:
            raise serializers.ValidationError("No tienes permiso para enviar comandos a este dispositivo")
        
        return value
    
    def validate_command_type(self, value):
        """Valida que el tipo de comando no esté vacío"""
        if not value or not value.strip():
            raise serializers.ValidationError("El tipo de comando no puede estar vacío")
        return value.strip()
    
    def create(self, validated_data):
        """Crea un comando asignándolo al usuario autenticado"""
        user = self.context['request'].user
        command = Command.objects.create(created_by=user, **validated_data)
        return command


class CommandResponseSerializer(serializers.Serializer):
    """
    Serializador para respuestas de comandos desde dispositivos.
    """
    command_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=['executed', 'failed'])
    response = serializers.JSONField(required=False)


class AlertSerializer(serializers.ModelSerializer):
    """
    Serializador completo de alertas.
    """
    device_name = serializers.CharField(source='device.name', read_only=True)
    triggered_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Alert
        fields = [
            'id', 'device', 'device_name', 'name', 'rule_type',
            'condition', 'severity', 'is_active', 'notify_email',
            'notify_webhook', 'created_at', 'last_triggered', 'triggered_count'
        ]
        read_only_fields = ['id', 'created_at', 'last_triggered']
    
    def get_triggered_count(self, obj):
        """Retorna el número de veces que se ha activado la alerta"""
        # Esto se puede implementar con un modelo adicional de AlertLog
        return 0
    
    def validate_condition(self, value):
        """Valida que condition sea un diccionario válido"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("La condición debe ser un objeto JSON válido")
        
        # Validar estructura según el tipo de regla
        required_fields = {
            'threshold': ['field', 'operator', 'value'],
            'range': ['field', 'min', 'max'],
            'change': ['field', 'threshold'],
            'offline': ['timeout']
        }
        
        return value
    
    def validate_device(self, value):
        """Valida que el dispositivo pertenezca al usuario"""
        user = self.context['request'].user
        if value.owner != user and not user.is_admin:
            raise serializers.ValidationError("No tienes permiso para crear alertas en este dispositivo")
        return value


class AlertCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear alertas.
    """
    class Meta:
        model = Alert
        fields = [
            'device', 'name', 'rule_type', 'condition',
            'severity', 'notify_email', 'notify_webhook'
        ]
    
    def validate(self, attrs):
        """Validación adicional"""
        device = attrs.get('device')
        user = self.context['request'].user
        
        if device.owner != user and not user.is_admin:
            raise serializers.ValidationError({
                "device": "No tienes permiso para crear alertas en este dispositivo"
            })
        
        return attrs
