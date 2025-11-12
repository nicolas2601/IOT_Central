"""
URLs de la aplicación IoT Core
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "iot_core"

# Router principal para ViewSets
router = DefaultRouter()
router.register(r"devices", views.DeviceViewSet, basename="device")
router.register(r"telemetry", views.TelemetryViewSet, basename="telemetry")
router.register(r"commands", views.CommandViewSet, basename="command")
router.register(r"alerts", views.AlertViewSet, basename="alert")

urlpatterns = [
    # 🔹 Rutas generadas automáticamente por los ViewSets
    path("", include(router.urls)),

    # 🔹 Endpoints adicionales de telemetría
    path(
        "telemetry/latest/<uuid:device_id>/",
        views.LatestTelemetryView.as_view(),
        name="telemetry-latest",
    ),
    path(
        "telemetry/statistics/<uuid:device_id>/",
        views.TelemetryStatisticsView.as_view(),
        name="telemetry-statistics",
    ),

    # 🔹 Endpoints adicionales de dispositivos
    path(
        "devices/<uuid:pk>/telemetry/",
        views.DeviceTelemetryView.as_view(),
        name="device-telemetry",
    ),
    path(
        "devices/<uuid:pk>/send-command/",
        views.SendCommandView.as_view(),
        name="device-send-command",
    ),
    path(
        "devices/<uuid:pk>/commands/",
        views.DeviceCommandsView.as_view(),
        name="device-commands",
    ),

    # ✅ El endpoint start-simulator ya está incluido dentro del DeviceViewSet
    # gracias al decorador @action(url_path='start-simulator')
    # No es necesario agregarlo manualmente.

    # 🔹 Dashboard y estadísticas
    path(
        "dashboard/stats/",
        views.DashboardStatsView.as_view(),
        name="dashboard-stats",
    ),

    # 🔹 Endpoint adicional para enviar comandos globales
    path("commands/send/", views.send_command, name="send_command"),
]
