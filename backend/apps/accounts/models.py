"""
Modelos de la aplicación Accounts

Define el modelo de Usuario extendido con campos adicionales
para la plataforma IoT.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import EmailValidator


class User(AbstractUser):
    """
    Modelo de Usuario personalizado que extiende AbstractUser.
    
    Campos adicionales:
    - company_name: Nombre de la empresa u organización
    - role: Rol del usuario en la plataforma
    - phone: Número de teléfono
    - avatar: Imagen de perfil
    """
    
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('user', 'Usuario'),
        ('viewer', 'Observador'),
    ]
    
    # Sobrescribir email para hacerlo único y obligatorio
    email = models.EmailField(
        'correo electrónico',
        unique=True,
        validators=[EmailValidator()],
        error_messages={
            'unique': 'Ya existe un usuario con este correo electrónico.',
        }
    )
    
    # Campos adicionales
    company_name = models.CharField(
        'nombre de empresa',
        max_length=200,
        blank=True,
        null=True,
        help_text='Nombre de la empresa u organización'
    )
    
    role = models.CharField(
        'rol',
        max_length=20,
        choices=ROLE_CHOICES,
        default='user',
        help_text='Rol del usuario en la plataforma'
    )
    
    phone = models.CharField(
        'teléfono',
        max_length=20,
        blank=True,
        null=True,
        help_text='Número de teléfono de contacto'
    )
    
    avatar = models.ImageField(
        'avatar',
        upload_to='avatars/',
        blank=True,
        null=True,
        help_text='Imagen de perfil del usuario'
    )
    
    # Metadatos
    created_at = models.DateTimeField('fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('fecha de actualización', auto_now=True)
    
    class Meta:
        verbose_name = 'usuario'
        verbose_name_plural = 'usuarios'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.email})"
    
    @property
    def full_name(self):
        """Retorna el nombre completo del usuario"""
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    @property
    def is_admin(self):
        """Verifica si el usuario es administrador"""
        return self.role == 'admin' or self.is_superuser
    
    def get_device_count(self):
        """Retorna el número de dispositivos del usuario"""
        return self.devices.count()
