import os
import sys
import django
from django.conf import settings
from django.db import connection

# Configurar entorno Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Verificar conexión a la base de datos
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        if result[0] == 1:
            print("✅ Conexión a la base de datos NEON-tech exitosa!")
            print(f"   Host: {settings.DATABASES['default']['HOST']}")
            print(f"   Base de datos: {settings.DATABASES['default']['NAME']}")
            print(f"   Usuario: {settings.DATABASES['default']['USER']}")
        else:
            print("❌ Error al verificar la conexión a la base de datos")
except Exception as e:
    print(f"❌ Error de conexión: {e}")