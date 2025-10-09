"""
Comando Django para ejecutar el listener MQTT

Uso:
    python manage.py mqtt_listener
    
Este comando inicia el cliente MQTT y mantiene la conexión activa
para recibir mensajes de dispositivos IoT.
"""
import signal
import sys
import time
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.iot_core.mqtt_client import MQTTClient

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    Comando para ejecutar el listener MQTT.
    
    Inicia el cliente MQTT y mantiene el proceso corriendo
    hasta que se reciba una señal de terminación (Ctrl+C).
    """
    
    help = 'Inicia el listener MQTT para recibir mensajes de dispositivos IoT'
    
    def __init__(self):
        super().__init__()
        self.mqtt_client = None
        self.running = False
    
    def add_arguments(self, parser):
        """Agrega argumentos opcionales al comando"""
        parser.add_argument(
            '--reconnect-delay',
            type=int,
            default=5,
            help='Tiempo de espera entre intentos de reconexión (segundos)'
        )
        parser.add_argument(
            '--max-reconnect-attempts',
            type=int,
            default=0,  # 0 = infinito
            help='Número máximo de intentos de reconexión (0 = infinito)'
        )
    
    def handle(self, *args, **options):
        """Ejecuta el comando"""
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write(self.style.SUCCESS('  MQTT Listener - Plataforma IoT'))
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write('')
        
        # Mostrar configuración
        broker_host = getattr(settings, 'MQTT_BROKER_HOST', 'localhost')
        broker_port = getattr(settings, 'MQTT_BROKER_PORT', 1883)
        
        self.stdout.write(f'  Broker: {broker_host}:{broker_port}')
        self.stdout.write(f'  Client ID: {getattr(settings, "MQTT_CLIENT_ID", "django_iot_platform")}')
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('  Presiona Ctrl+C para detener'))
        self.stdout.write('=' * 70)
        self.stdout.write('')
        
        # Configurar manejadores de señales
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        # Iniciar cliente MQTT
        self.mqtt_client = MQTTClient()
        
        reconnect_delay = options['reconnect_delay']
        max_attempts = options['max_reconnect_attempts']
        attempt = 0
        
        self.running = True
        
        while self.running:
            try:
                # Intentar conectar
                if not self.mqtt_client.connected:
                    attempt += 1
                    
                    if max_attempts > 0 and attempt > max_attempts:
                        self.stdout.write(
                            self.style.ERROR(
                                f'✗ Número máximo de intentos alcanzado ({max_attempts})'
                            )
                        )
                        break
                    
                    self.stdout.write(
                        self.style.WARNING(
                            f'→ Intento de conexión #{attempt}...'
                        )
                    )
                    
                    success = self.mqtt_client.connect()
                    
                    if success:
                        self.stdout.write(
                            self.style.SUCCESS(
                                '✓ Conectado exitosamente al broker MQTT'
                            )
                        )
                        self.stdout.write(
                            self.style.SUCCESS(
                                '✓ Escuchando mensajes de dispositivos...'
                            )
                        )
                        self.stdout.write('')
                        attempt = 0  # Resetear contador
                    else:
                        self.stdout.write(
                            self.style.ERROR(
                                f'✗ Error conectando. Reintentando en {reconnect_delay}s...'
                            )
                        )
                        time.sleep(reconnect_delay)
                        continue
                
                # Mantener el proceso corriendo
                time.sleep(1)
                
            except KeyboardInterrupt:
                self.stdout.write('')
                self.stdout.write(self.style.WARNING('⚠ Interrupción detectada...'))
                break
            
            except Exception as e:
                logger.error(f'Error en el listener MQTT: {e}', exc_info=True)
                self.stdout.write(
                    self.style.ERROR(f'✗ Error: {str(e)}')
                )
                
                if self.running:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Reintentando en {reconnect_delay}s...'
                        )
                    )
                    time.sleep(reconnect_delay)
        
        # Desconectar limpiamente
        self._cleanup()
    
    def _signal_handler(self, signum, frame):
        """
        Maneja señales de terminación (SIGINT, SIGTERM).
        
        Args:
            signum: Número de señal
            frame: Frame actual
        """
        signal_names = {
            signal.SIGINT: 'SIGINT',
            signal.SIGTERM: 'SIGTERM'
        }
        signal_name = signal_names.get(signum, f'Signal {signum}')
        
        self.stdout.write('')
        self.stdout.write(
            self.style.WARNING(f'⚠ Señal {signal_name} recibida')
        )
        self.running = False
    
    def _cleanup(self):
        """Limpia recursos antes de salir"""
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('→ Cerrando conexiones...'))
        
        if self.mqtt_client:
            try:
                self.mqtt_client.disconnect()
                self.stdout.write(
                    self.style.SUCCESS('✓ Cliente MQTT desconectado')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Error desconectando: {e}')
                )
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write(self.style.SUCCESS('  Listener MQTT detenido'))
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write('')
