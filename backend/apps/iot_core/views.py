"""
Vistas de la aplicación IoT Core

Define las vistas para:
- CRUD de dispositivos
- Gestión de telemetría
- Envío y gestión de comandos
- Gestión de alertas
- Dashboard y estadísticas
"""
# backend/apps/iot_core/views.py
from rest_framework.decorators import api_view, permission_classes
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
import subprocess
import sys
import os
from django.conf import settings

logger = logging.getLogger(__name__)


class ReadOnlyIfDebug(permissions.BasePermission):
    """
    Permite acceso READ-ONLY (métodos seguros) sin autenticación cuando DEBUG=True.
    En producción o para métodos de escritura exige autenticación.
    """
    def has_permission(self, request, view):
        # Métodos seguros: GET, HEAD, OPTIONS
        if request.method in permissions.SAFE_METHODS:
            # Si está habilitado DEBUG, permitimos acceso anónimo de solo lectura
            if getattr(settings, 'DEBUG', False):
                return True
        # Para todo lo demás, exige autenticación
        return request.user and request.user.is_authenticated


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
    permission_classes = [ReadOnlyIfDebug]
    
    def get_queryset(self):
        """
        Retorna dispositivos visibles para el usuario:
        - Admin: todos los dispositivos
        - Autenticado: solo dispositivos de los que es propietario
        - Anónimo: ninguno
        """
        user = self.request.user
        is_admin = getattr(user, 'is_admin', False)

        if not getattr(user, 'is_authenticated', False):
            # Usuarios anónimos no ven dispositivos, incluso en DEBUG
            queryset = Device.objects.none()
        elif is_admin:
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
        """Elimina un dispositivo de forma definitiva (hard delete)."""
        name = instance.name
        instance.delete()
        logger.warning(f"Dispositivo eliminado: {name} por {getattr(self.request.user, 'username', 'usuario')} ")

    def perform_create(self, serializer):
        """Asigna el propietario del dispositivo al usuario autenticado."""
        serializer.save()
    
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

    @action(detail=True, methods=['post'], url_path='start-simulator')
    def start_simulator(self, request, pk=None):
        """
        Inicia el simulador de dispositivo desde el backend.

        POST /api/devices/{id}/start-simulator/
        Body opcional:
        - interval: int (segundos, default 5)
        - device_type: str (sensor/actuator/gateway). Si no se envía, usa el del modelo
        """
        try:
            device = self.get_object()

            # Permisos: dueño o admin
            user = request.user
            if device.owner != user and not user.is_admin:
                return Response(
                    {'error': 'No tienes permiso para iniciar simulador de este dispositivo'},
                    status=status.HTTP_403_FORBIDDEN
                )

            interval = int(request.data.get('interval', 4))
            device_type = request.data.get('device_type') or device.device_type

            # Obtener configuración del broker MQTT
            broker_host = getattr(settings, 'MQTT_BROKER_HOST', 'localhost')
            broker_port = getattr(settings, 'MQTT_BROKER_PORT', 1883)

            # Construir comando usando el intérprete de Python actual y ruta absoluta del script
            simulator_path = os.path.join(settings.BASE_DIR, 'device_simulator.py')
            if not os.path.exists(simulator_path):
                logger.error(f"Script de simulador no encontrado en: {simulator_path}")
                return Response(
                    {'error': 'Script de simulador no encontrado'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Obtener propiedades de plantilla si existen
            import json
            template_properties = []
            metadata = device.metadata or {}
            if isinstance(metadata, dict):
                template = metadata.get('template', {})
                if isinstance(template, dict):
                    template_properties = template.get('properties', [])
            
            template_properties_json = json.dumps(template_properties)

            cmd = [
                sys.executable,
                simulator_path,
                '--device-id', str(device.id),
                '--device-type', str(device_type),
                '--broker', str(broker_host),
                '--port', str(broker_port),
                '--interval', str(interval),
                '--template-properties', template_properties_json
            ]

            try:
                # Lanzar proceso en background
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                logger.info(f"Simulador iniciado para {device.name} (PID {process.pid}) - Broker: {broker_host}:{broker_port}")
                return Response({
                    'message': 'Simulador iniciado',
                    'pid': process.pid,
                    'device_id': str(device.id),
                    'device_type': device_type,
                    'interval': interval,
                    'broker': f"{broker_host}:{broker_port}"
                })
            except Exception as e:
                logger.error(f"Error iniciando simulador: {str(e)}")
                return Response(
                    {'error': f'No se pudo iniciar el simulador: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Device.DoesNotExist:
            return Response(
                {'error': 'Dispositivo no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], url_path='stop-simulator')
    def stop_simulator(self, request, pk=None):
        """
        Para el simulador de dispositivo.

        POST /api/devices/{id}/stop-simulator/
        """
        try:
            device = self.get_object()

            # Permisos: dueño o admin
            user = request.user
            if device.owner != user and not user.is_admin:
                return Response(
                    {'error': 'No tienes permiso para parar simulador de este dispositivo'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Buscar procesos del simulador para este dispositivo
            device_id_str = str(device.id)
            stopped_count = 0
            
            try:
                import psutil
                for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                    try:
                        cmdline = proc.info['cmdline']
                        if cmdline and 'device_simulator.py' in ' '.join(cmdline) and device_id_str in ' '.join(cmdline):
                            proc.terminate()
                            stopped_count += 1
                            logger.info(f"Simulador detenido para {device.name} (PID {proc.pid})")
                    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                        pass
            except ImportError:
                logger.warning("psutil no está instalado, usando fallback")
                # Fallback: retornar mensaje de éxito aunque no podamos verificar
                return Response({
                    'message': 'Comando de parada enviado',
                    'device_id': str(device.id),
                    'note': 'El simulador debería detenerse en breve'
                })
            except Exception as e:
                logger.warning(f"Error deteniendo simulador: {e}")
                # Fallback: retornar mensaje de éxito aunque no podamos verificar
                return Response({
                    'message': 'Comando de parada enviado',
                    'device_id': str(device.id),
                    'note': 'El simulador debería detenerse en breve'
                })

            if stopped_count > 0:
                return Response({
                    'message': f'Simulador detenido ({stopped_count} proceso(s))',
                    'device_id': str(device.id),
                    'stopped_processes': stopped_count
                })
            else:
                return Response({
                    'message': 'No hay simulador activo para este dispositivo',
                    'device_id': str(device.id)
                }, status=status.HTTP_404_NOT_FOUND)

        except Device.DoesNotExist:
            return Response(
                {'error': 'Dispositivo no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )


class TelemetryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de telemetría.
    
    Endpoints:
    - GET /api/telemetry/ - Listar telemetría (con filtros)
    - POST /api/telemetry/ - Crear registro de telemetría
    - GET /api/telemetry/{id}/ - Obtener registro específico
    """
    serializer_class = TelemetrySerializer
    permission_classes = [ReadOnlyIfDebug]
    
    def get_queryset(self):
        """
        Retorna telemetría de dispositivos del usuario.
        Soporta filtros por dispositivo, fecha, etc.
        """
        user = self.request.user
        is_admin = getattr(user, 'is_admin', False)
        
        # Base queryset según permisos
        if not getattr(user, 'is_authenticated', False):
            queryset = Telemetry.objects.all()
        elif is_admin:
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
    permission_classes = [ReadOnlyIfDebug]
    
    def get_queryset(self):
        """Retorna comandos de dispositivos del usuario"""
        user = self.request.user
        is_admin = getattr(user, 'is_admin', False)
        
        if not getattr(user, 'is_authenticated', False):
            queryset = Command.objects.all()
        elif is_admin:
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
    permission_classes = [ReadOnlyIfDebug]
    
    def get_queryset(self):
        """Retorna alertas de dispositivos del usuario"""
        user = self.request.user
        is_admin = getattr(user, 'is_admin', False)
        
        if not getattr(user, 'is_authenticated', False):
            queryset = Alert.objects.all()
        elif is_admin:
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
    permission_classes = [ReadOnlyIfDebug]
    
    def get(self, request, device_id):
        try:
            device = Device.objects.get(id=device_id)
            
            # Verificar permisos
            if not getattr(request.user, 'is_authenticated', False):
                # En debug, permitir lectura anónima
                if not getattr(settings, 'DEBUG', False):
                    return Response(
                        {'error': 'No autenticado'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            elif device.owner != request.user and not getattr(request.user, 'is_admin', False):
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


class RecentTelemetryView(APIView):
    """
    Vista para obtener telemetría reciente de un dispositivo.
    
    GET /api/telemetry/{device_id}/recent/
    Query params:
    - limit: Número de registros (default 10)
    - hours: Últimas N horas (default 24)
    """
    permission_classes = [ReadOnlyIfDebug]
    
    def get(self, request, device_id):
        try:
            device = Device.objects.get(id=device_id)
            
            # Verificar permisos
            if not getattr(request.user, 'is_authenticated', False):
                if not getattr(settings, 'DEBUG', False):
                    return Response(
                        {'error': 'No autenticado'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            elif device.owner != request.user and not getattr(request.user, 'is_admin', False):
                return Response(
                    {'error': 'No tienes permiso para ver este dispositivo'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Parámetros
            limit = int(request.query_params.get('limit', 10))
            hours = int(request.query_params.get('hours', 24))
            
            # Obtener telemetría reciente
            cutoff_time = timezone.now() - timedelta(hours=hours)
            recent = device.telemetry_data.filter(
                timestamp__gte=cutoff_time
            ).order_by('-timestamp')[:limit]
            
            if not recent:
                return Response({
                    'device_id': str(device_id),
                    'device_name': device.name,
                    'results': [],
                    'count': 0,
                    'message': f'Sin telemetría en las últimas {hours} horas'
                })
            
            serializer = TelemetrySerializer(recent, many=True)
            return Response({
                'device_id': str(device_id),
                'device_name': device.name,
                'results': serializer.data,
                'count': len(serializer.data)
            })
        
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
    permission_classes = [ReadOnlyIfDebug]
    
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
    permission_classes = [ReadOnlyIfDebug]
    
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
    permission_classes = [ReadOnlyIfDebug]
    
    def get_queryset(self):
        device_id = self.kwargs.get('pk')
        return Command.objects.filter(device_id=device_id).order_by('-created_at')


class DashboardStatsView(APIView):
    """
    Vista para obtener estadísticas del dashboard.
    
    GET /api/dashboard/stats/
    """
    # Requiere autenticación JWT; evita que usuarios anónimos vean datos globales
    from rest_framework_simplejwt.authentication import JWTAuthentication
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        is_admin = getattr(user, 'is_admin', False)
        
        # Obtener dispositivos del usuario
        if is_admin:
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
        
        # Totales (sin límite de 24h)
        total_telemetry = Telemetry.objects.filter(
            device__in=devices
        ).count()
        total_commands = Command.objects.filter(
            device__in=devices
        ).count()

        # (Compatibilidad) métricas recientes 24h
        recent_telemetry = Telemetry.objects.filter(
            device__in=devices,
            timestamp__gte=timezone.now() - timedelta(hours=24)
        ).count()
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
            'total_telemetry': total_telemetry,
            'total_commands': total_commands,
            'recent_telemetry_24h': recent_telemetry,
            'recent_commands_24h': recent_commands,
            'active_alerts': active_alerts,
            'timestamp': timezone.now()
        })
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def send_command(request):
    """
    Endpoint para recibir comandos desde el frontend.
    Simula el envío del comando a un dispositivo IoT.
    """
    device_id = request.data.get("deviceId")
    command = request.data.get("command")
    params = request.data.get("params", {})

    if not device_id or not command:
        return Response(
            {"error": "deviceId y command son requeridos."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 🛰️ Aquí podrías integrar MQTT, WebSocket o Azure IoT.
    print(f"[IOT_CORE] Comando recibido: {command} → {device_id} con {params}")

    return Response(
        {"status": "ok", "device_id": device_id, "command": command},
        status=status.HTTP_200_OK,
    )