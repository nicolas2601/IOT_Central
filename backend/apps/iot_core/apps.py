"""
Configuración de la aplicación IoT Core
"""
from django.apps import AppConfig


class IotCoreConfig(AppConfig):
    """Configuración de la app del core IoT"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.iot_core'
    verbose_name = 'IoT Core'
    
    def ready(self):
        """
        Método ejecutado cuando la aplicación está lista.
        Aquí se inicializa el cliente MQTT y se importan signals.
        """
        # Importar signals si los hay
        # import apps.iot_core.signals
        
        # Inicializar cliente MQTT en un thread separado
        # Solo en el proceso principal (no en migraciones, etc)
        # DESHABILITADO EN PRODUCCIÓN: Mosquitto es local, no está en Render
        import sys
        from django.conf import settings
        
        # Solo iniciar MQTT si DEBUG=True (desarrollo local)
        if settings.DEBUG and ('runserver' in sys.argv or 'daphne' in sys.argv[0]):
            from .mqtt_client import MQTTClient
            import threading
            
            def start_mqtt():
                mqtt_client = MQTTClient()
                mqtt_client.connect()
            
            # Iniciar MQTT en un thread separado
            mqtt_thread = threading.Thread(target=start_mqtt, daemon=True)
            mqtt_thread.start()
