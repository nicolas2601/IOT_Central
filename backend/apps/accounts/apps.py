"""
Configuración de la aplicación Accounts
"""
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """Configuración de la app de autenticación y cuentas de usuario"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    verbose_name = 'Autenticación y Cuentas'
    
    def ready(self):
        """
        Método ejecutado cuando la aplicación está lista.
        Aquí se pueden importar signals u otras configuraciones.
        """
        # Importar signals si los hay
        # import apps.accounts.signals
        pass
