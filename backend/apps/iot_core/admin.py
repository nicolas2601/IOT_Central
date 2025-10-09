"""
Configuración del Admin de Django para IoT Core
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from datetime import timedelta
from .models import Device, Telemetry, Command, Alert


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    """Admin para el modelo Device"""
    
    list_display = [
        'name', 'device_type', 'owner', 'status_badge',
        'is_active', 'last_connection_display', 'telemetry_count',
        'created_at'
    ]
    
    list_filter = ['device_type', 'status', 'is_active', 'created_at']
    
    search_fields = ['name', 'description', 'owner__username', 'owner__email', 'location']
    
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_connection']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'name', 'device_type', 'description', 'owner')
        }),
        ('Estado y Conexión', {
            'fields': ('is_active', 'status', 'last_connection')
        }),
        ('Ubicación', {
            'fields': ('location', 'latitude', 'longitude'),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def status_badge(self, obj):
        """Muestra el estado con un badge de color"""
        colors = {
            'online': 'green',
            'offline': 'gray',
            'error': 'red',
            'maintenance': 'orange'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Estado'
    
    def last_connection_display(self, obj):
        """Muestra la última conexión con formato amigable"""
        if not obj.last_connection:
            return format_html('<span style="color: gray;">Nunca</span>')
        
        time_diff = timezone.now() - obj.last_connection
        if time_diff < timedelta(minutes=5):
            return format_html('<span style="color: green;">Hace {} min</span>', int(time_diff.seconds / 60))
        elif time_diff < timedelta(hours=1):
            return format_html('<span style="color: orange;">Hace {} min</span>', int(time_diff.seconds / 60))
        else:
            return format_html('<span style="color: red;">{}</span>', obj.last_connection.strftime('%Y-%m-%d %H:%M'))
    last_connection_display.short_description = 'Última Conexión'
    
    def telemetry_count(self, obj):
        """Muestra el número de registros de telemetría"""
        count = obj.get_telemetry_count()
        return format_html('<strong>{}</strong>', count)
    telemetry_count.short_description = 'Telemetría'


@admin.register(Telemetry)
class TelemetryAdmin(admin.ModelAdmin):
    """Admin para el modelo Telemetry"""
    
    list_display = ['id', 'device', 'timestamp', 'data_preview', 'received_at']
    
    list_filter = ['device', 'timestamp', 'received_at']
    
    search_fields = ['device__name', 'data']
    
    readonly_fields = ['id', 'received_at']
    
    date_hierarchy = 'timestamp'
    
    def data_preview(self, obj):
        """Muestra una vista previa de los datos"""
        if isinstance(obj.data, dict):
            preview = ', '.join([f"{k}: {v}" for k, v in list(obj.data.items())[:3]])
            if len(obj.data) > 3:
                preview += '...'
            return preview
        return str(obj.data)[:50]
    data_preview.short_description = 'Datos'
    
    def has_add_permission(self, request):
        """Deshabilitar agregar telemetría manualmente"""
        return False


@admin.register(Command)
class CommandAdmin(admin.ModelAdmin):
    """Admin para el modelo Command"""
    
    list_display = [
        'command_type', 'device', 'status_badge',
        'created_by', 'created_at', 'execution_time_display'
    ]
    
    list_filter = ['status', 'command_type', 'created_at']
    
    search_fields = ['device__name', 'command_type', 'created_by__username']
    
    readonly_fields = ['id', 'created_at', 'sent_at', 'executed_at', 'created_by']
    
    fieldsets = (
        ('Información del Comando', {
            'fields': ('id', 'device', 'command_type', 'payload')
        }),
        ('Estado', {
            'fields': ('status', 'response')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'sent_at', 'executed_at', 'created_by')
        }),
    )
    
    def status_badge(self, obj):
        """Muestra el estado con un badge de color"""
        colors = {
            'pending': 'gray',
            'sent': 'blue',
            'executed': 'green',
            'failed': 'red',
            'timeout': 'orange'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Estado'
    
    def execution_time_display(self, obj):
        """Muestra el tiempo de ejecución"""
        if obj.sent_at and obj.executed_at:
            delta = obj.executed_at - obj.sent_at
            return f"{delta.total_seconds():.2f}s"
        return '-'
    execution_time_display.short_description = 'Tiempo Ejecución'


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    """Admin para el modelo Alert"""
    
    list_display = [
        'name', 'device', 'rule_type', 'severity_badge',
        'is_active', 'last_triggered', 'created_at'
    ]
    
    list_filter = ['rule_type', 'severity', 'is_active', 'created_at']
    
    search_fields = ['name', 'device__name']
    
    readonly_fields = ['id', 'created_at', 'last_triggered']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'device', 'name', 'rule_type', 'severity')
        }),
        ('Condición', {
            'fields': ('condition', 'is_active')
        }),
        ('Notificaciones', {
            'fields': ('notify_email', 'notify_webhook')
        }),
        ('Fechas', {
            'fields': ('created_at', 'last_triggered')
        }),
    )
    
    def severity_badge(self, obj):
        """Muestra la severidad con un badge de color"""
        colors = {
            'low': '#90EE90',
            'medium': '#FFA500',
            'high': '#FF6347',
            'critical': '#DC143C'
        }
        color = colors.get(obj.severity, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_severity_display()
        )
    severity_badge.short_description = 'Severidad'
