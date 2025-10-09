"""
Vistas de la aplicación IoT Core

Define las vistas para:
- CRUD de dispositivos
- Gestión de telemetría
- Envío y gestión de comandos
- Gestión de alertas
- Dashboard y estadísticas
"""
from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q, Avg, Max, Min
from django.utils import timezone
from datetime import timedelta
import logging

from .models import Device, Telemetry, Command, Alert
from .serializers import (
    DeviceSerializer, DeviceCreateSerializer, DeviceListSerializer,
    TelemetrySerializer, TelemetryCreateSerializer, TelemetryStatsSerializer,
    CommandSerializer, CommandCreateSerializer, CommandResponseSerializer,
    AlertSerializer, AlertCreateSerializer
)
from .mqtt_client import MQTTClient

logger = logging.getLogger(__name__)


class DeviceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de dispositivos.
    
    Endpoints:
    - GET /api/devices/ - Listar dispositivos
    - POST /api/devices/ - Crear dispositivo
    - GET /api/devices/{id}/ - Obtener dispositivo
    - PUT/PATCH /api/devices/{id}/ - Actualizar dispositivo
    - DELETE /api/devices/{id}/ - Eliminar dispositivo
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Retorna dispositivos del usuario autenticado.
        Los admins pueden ver todos los dispositivos.
        """
        user = self.request.user
        if user.is_admin:
            queryset = Device.objects.all()
        else:
            queryset = Device.objects.filter(owner=user)
        
        # Filtros
        device_type = self.request.query_params.get('device_type', None)
        if device_type:
            queryset = queryset.filter(device_type=device_type)
        
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Búsqueda
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )
        
        return queryset.select_related('owner').order_by('-created_at')
    
    def get_serializer_class(self):
        """Retorna el serializador apropiado según la acción"""
        if self.action == 'create':
            return DeviceCreateSerializer
        elif self.action == 'list':
            return DeviceListSerializer
        return DeviceSerializer
    
    def perform_create(self, serializer):
        """Crea un dispositivo asignándolo al usuario autenticado"""
        device = serializer.save()
        logger.info(f"Dispositivo creado: {device.name} por {self.request.user.username}")
    
    def perform_destroy(self, instance):
        """Elimina un dispositivo (soft delete)"""
        instance.is_active = False
        instance.save()
        logger.warning(f"Dispositivo desactivado: {instance.name} por {self.request.user.username}")
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activa un dispositivo desactivado"""
        device = self.get_object()
        device.is_active = True
        device.save()
        logger.info(f"Dispositivo activado: {device.name}")
        return Response({'message': 'Dispositivo activado exitosamente'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Desactiva un dispositivo"""
        device = self.get_object()
        device.is_active = False
        device.save()
        logger.info(f"Dispositivo desactivado: {device.name}")
        return Response({'message': 'Dispositivo desactivado exitosamente'})


class TelemetryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de telemetría.
    
    Endpoints:
    - GET /api/telemetry/ - Listar telemetría (con filtros)
    - POST /api/telemetry/ - Crear registro de telemetría
    - GET /api/telemetry/{id}/ - Obtener registro específico
    """
    serializer_class = TelemetrySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Retorna telemetría de dispositivos del usuario.
        Soporta filtros por dispositivo, fecha, etc.
        """
        user = self.request.user
        
        # Base queryset según permisos
        if user.is_admin:
            queryset = Telemetry.objects.all()
        else:
            queryset = Telemetry.objects.filter(device__owner=user)
        
        # Filtro por dispositivo
        device_id = self.request.query_params.get('device', None)
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        
        # Filtro por rango de fechas
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        # Limitar a últimos 7 días por defecto si no hay filtros
        if not start_date and not end_date:
            seven_days_ago = timezone.now() - timedelta(days=7)
            queryset = queryset.filter(timestamp__gte=seven_days_ago)
        
        return queryset.select_related('device').order_by('-timestamp')
    
    def get_serializer_class(self):
        """Retorna el serializador apropiado"""
        if self.action == 'create':
            return TelemetryCreateSerializer
        return TelemetrySerializer
    
    def perform_create(self, serializer):
        """Crea un registro de telemetría y actualiza el dispositivo"""
        telemetry = serializer.save()
        # Actualizar última conexión del dispositivo
        telemetry.device.update_last_connection()
        logger.debug(f"Telemetría recibida de {telemetry.device.name}")


class CommandViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de comandos.
    
    Endpoints:
    - GET /api/commands/ - Listar comandos
    - POST /api/commands/ - Crear comando
    - GET /api/commands/{id}/ - Obtener comando
    """
    serializer_class = CommandSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Retorna comandos de dispositivos del usuario"""
        user = self.request.user
        
        if user.is_admin:
            queryset = Command.objects.all()
        else:
            queryset = Command.objects.filter(device__owner=user)
        
        # Filtros
        device_id = self.request.query_params.get('device', None)
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.select_related('device', 'created_by').order_by('-created_at')
    
    def get_serializer_class(self):
        """Retorna el serializador apropiado"""
        if self.action == 'create':
            return CommandCreateSerializer
        return CommandSerializer
    
    def perform_create(self, serializer):
        """Crea un comando y lo envía vía MQTT"""
        command = serializer.save()
        
        # Enviar comando vía MQTT
        try:
            mqtt_client = MQTTClient()
            mqtt_client.send_command(command)
            command.mark_as_sent()
            logger.info(f"Comando enviado: {command.command_type} a {command.device.name}")
        except Exception as e:
            logger.error(f"Error enviando comando: {str(e)}")
            command.mark_as_failed(str(e))


class AlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de alertas.
    """
    serializer_class = AlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Retorna alertas de dispositivos del usuario"""
        user = self.request.user
        
        if user.is_admin:
            queryset = Alert.objects.all()
        else:
            queryset = Alert.objects.filter(device__owner=user)
        
        # Filtros
        device_id = self.request.query_params.get('device', None)
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.select_related('device').order_by('-created_at')
    
    def get_serializer_class(self):
        """Retorna el serializador apropiado"""
        if self.action == 'create':
            return AlertCreateSerializer
        return AlertSerializer


class LatestTelemetryView(generics.RetrieveAPIView):
    """
    Vista para obtener la última telemetría de un dispositivo.
    
    GET /api/telemetry/latest/{device_id}/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, device_id):
        try:
            device = Device.objects.get(id=device_id)
            
            # Verificar permisos
            if device.owner != request.user and not request.user.is_admin:
                return Response(
                    {'error': 'No tienes permiso para ver este dispositivo'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Obtener última telemetría
            latest = device.telemetry_data.order_by('-timestamp').first()
            
            if not latest:
                return Response(
                    {'message': 'No hay telemetría disponible'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = TelemetrySerializer(latest)
            return Response(serializer.data)
        
        except Device.DoesNotExist:
            return Response(
                {'error': 'Dispositivo no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )


class TelemetryStatisticsView(APIView):
    """
    Vista para obtener estadísticas de telemetría de un dispositivo.
    
    GET /api/telemetry/statistics/{device_id}/
    Query params:
    - start_date: Fecha de inicio (opcional)
    - end_date: Fecha de fin (opcional)
    - metric: Métrica específica a analizar (opcional)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, device_id):
        try:
            device = Device.objects.get(id=device_id)
            
            # Verificar permisos
            if device.owner != request.user and not request.user.is_admin:
                return Response(
                    {'error': 'No tienes permiso para ver este dispositivo'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Obtener parámetros
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            # Construir queryset
            queryset = device.telemetry_data.all()
            
            if start_date:
                queryset = queryset.filter(timestamp__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__lte=end_date)
            else:
                # Por defecto, últimos 7 días
                seven_days_ago = timezone.now() - timedelta(days=7)
                queryset = queryset.filter(timestamp__gte=seven_days_ago)
            
            # Calcular estadísticas
            total_records = queryset.count()
            
            if total_records == 0:
                return Response({
                    'device_id': device_id,
                    'device_name': device.name,
                    'total_records': 0,
                    'message': 'No hay datos en el rango especificado'
                })
            
            # Obtener métricas disponibles del primer registro
            first_record = queryset.first()
            metrics = {}
            
            if first_record and isinstance(first_record.data, dict):
                for key in first_record.data.keys():
                    # Intentar calcular estadísticas numéricas
                    try:
                        values = [
                            float(record.data.get(key, 0))
                            for record in queryset
                            if key in record.data and record.data[key] is not None
                        ]
                        
                        if values:
                            metrics[key] = {
                                'avg': round(sum(values) / len(values), 2),
                                'min': round(min(values), 2),
                                'max': round(max(values), 2),
                                'count': len(values)
                            }
                    except (ValueError, TypeError):
                        # No es numérico, solo contar
                        metrics[key] = {'type': 'non-numeric'}
            
            return Response({
                'device_id': str(device_id),
                'device_name': device.name,
                'start_date': start_date or (timezone.now() - timedelta(days=7)).isoformat(),
                'end_date': end_date or timezone.now().isoformat(),
                'total_records': total_records,
                'metrics': metrics
            })
        
        except Device.DoesNotExist:
            return Response(
                {'error': 'Dispositivo no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )


class DeviceTelemetryView(generics.ListAPIView):
    """
    Vista para obtener telemetría de un dispositivo específico.
    
    GET /api/devices/{device_id}/telemetry/
    """
    serializer_class = TelemetrySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        device_id = self.kwargs.get('pk')
        return Telemetry.objects.filter(device_id=device_id).order_by('-timestamp')


class SendCommandView(APIView):
    """
    Vista para enviar un comando a un dispositivo.
    
    POST /api/devices/{device_id}/send-command/
    Body: {
        "command_type": "set_temperature",
        "payload": {"target": 22.0}
    }
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            device = Device.objects.get(id=pk)
            
            # Verificar permisos
            if device.owner != request.user and not request.user.is_admin:
                return Response(
                    {'error': 'No tienes permiso para controlar este dispositivo'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Crear comando
            serializer = CommandCreateSerializer(
                data={**request.data, 'device': str(device.id)},
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            command = serializer.save()
            
            # Enviar vía MQTT
            try:
                mqtt_client = MQTTClient()
                mqtt_client.send_command(command)
                command.mark_as_sent()
                logger.info(f"Comando enviado: {command.command_type} a {device.name}")
            except Exception as e:
                logger.error(f"Error enviando comando: {str(e)}")
                command.mark_as_failed(str(e))
            
            return Response(
                CommandSerializer(command).data,
                status=status.HTTP_201_CREATED
            )
        
        except Device.DoesNotExist:
            return Response(
                {'error': 'Dispositivo no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )


class DeviceCommandsView(generics.ListAPIView):
    """
    Vista para obtener comandos de un dispositivo específico.
    
    GET /api/devices/{device_id}/commands/
    """
    serializer_class = CommandSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        device_id = self.kwargs.get('pk')
        return Command.objects.filter(device_id=device_id).order_by('-created_at')


class DashboardStatsView(APIView):
    """
    Vista para obtener estadísticas del dashboard.
    
    GET /api/dashboard/stats/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Obtener dispositivos del usuario
        if user.is_admin:
            devices = Device.objects.all()
        else:
            devices = Device.objects.filter(owner=user)
        
        # Estadísticas generales
        total_devices = devices.count()
        active_devices = devices.filter(is_active=True).count()
        online_devices = devices.filter(
            last_connection__gte=timezone.now() - timedelta(minutes=5)
        ).count()
        
        # Dispositivos por tipo
        devices_by_type = devices.values('device_type').annotate(
            count=Count('id')
        )
        
        # Telemetría reciente
        recent_telemetry = Telemetry.objects.filter(
            device__in=devices,
            timestamp__gte=timezone.now() - timedelta(hours=24)
        ).count()
        
        # Comandos recientes
        recent_commands = Command.objects.filter(
            device__in=devices,
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).count()
        
        # Alertas activas
        active_alerts = Alert.objects.filter(
            device__in=devices,
            is_active=True
        ).count()
        
        return Response({
            'total_devices': total_devices,
            'active_devices': active_devices,
            'online_devices': online_devices,
            'offline_devices': active_devices - online_devices,
            'devices_by_type': list(devices_by_type),
            'recent_telemetry_24h': recent_telemetry,
            'recent_commands_24h': recent_commands,
            'active_alerts': active_alerts,
            'timestamp': timezone.now()
        })
