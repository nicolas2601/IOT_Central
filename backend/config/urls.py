"""
Configuración de URLs para el proyecto Plataforma IoT.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from django.http import JsonResponse


def health_check(request):
    """Endpoint de health check para verificar que el servicio está funcionando."""
    return JsonResponse({
        'status': 'healthy',
        'service': 'IoT Platform Backend',
        'version': '1.0.0'
    })


def root_view(request):
    """Vista principal para Render y pruebas de disponibilidad."""
    return JsonResponse({
        'message': '🚀 IoT Platform API funcionando correctamente',
        'docs': '/api/health/'
    })


urlpatterns = [
    # Ruta raíz (Render verifica esta)
    path('', root_view, name='root'),

    # Admin de Django
    path('admin/', admin.site.urls),
    
    # Health check
    path('api/health/', health_check, name='health_check'),
    
    # API de autenticación y cuentas
    path('api/auth/', include('apps.accounts.urls')),
    
    # API del core IoT (dispositivos, telemetría, comandos)
    path('api/', include('apps.iot_core.urls')),
]

# Configuración del admin
admin.site.site_header = 'Plataforma IoT - Administración'
admin.site.site_title = 'IoT Platform Admin'
admin.site.index_title = 'Panel de Administración'

# Servir archivos de media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
