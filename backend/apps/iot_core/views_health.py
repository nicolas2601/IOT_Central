"""
Health check endpoints para monitoreo y Coolify
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
from django.conf import settings
import json

@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint para Coolify y Docker
    
    Verifica:
    - Conexión a base de datos
    - Estado general de la aplicación
    """
    try:
        # Verificar conexión a base de datos
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            
        # Verificar configuración MQTT
        mqtt_status = "configured" if hasattr(settings, 'MQTT_BROKER_HOST') else "not_configured"
        
        return JsonResponse({
            "status": "healthy",
            "database": "connected",
            "mqtt": mqtt_status,
            "service": "backend",
            "version": "1.0"
        })
        
    except Exception as e:
        return JsonResponse({
            "status": "unhealthy",
            "error": str(e),
            "service": "backend"
        }, status=503)

@csrf_exempt
@require_http_methods(["GET"])
def ready_check(request):
    """
    Readiness check - verifica que el servicio esté listo para recibir tráfico
    """
    try:
        # Verificar que Django esté completamente inicializado
        from django.apps import apps
        apps.check_apps_ready()
        
        return JsonResponse({
            "status": "ready",
            "service": "backend"
        })
        
    except Exception as e:
        return JsonResponse({
            "status": "not_ready",
            "error": str(e),
            "service": "backend"
        }, status=503)
