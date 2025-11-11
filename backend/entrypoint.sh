#!/bin/bash
set -e

echo "🚀 Iniciando Backend IoT Platform..."

# Esperar a que PostgreSQL esté disponible
echo "⏳ Esperando PostgreSQL..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>/dev/null; do
  echo "PostgreSQL no disponible - esperando..."
  sleep 2
done
echo "✅ PostgreSQL está listo"

# Ejecutar migraciones
echo "📦 Ejecutando migraciones..."
python manage.py migrate --noinput

# Recolectar archivos estáticos
echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput --clear

# Crear superusuario si no existe (opcional)
echo "👤 Verificando superusuario..."
python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@iotplatform.com').exists():
    User.objects.create_superuser(
        email='admin@iotplatform.com',
        username='admin',
        password='admin123',
        first_name='Admin',
        last_name='IoT'
    )
    print('✅ Superusuario creado: admin@iotplatform.com / admin123')
else:
    print('✅ Superusuario ya existe')
END

echo "🎉 Backend listo - Iniciando servidor..."

# Iniciar Daphne (servidor ASGI para Django Channels)
exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
