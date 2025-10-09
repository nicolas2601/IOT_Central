"""
Configuración del Admin de Django para la app Accounts
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.utils.html import format_html

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Configuración personalizada del admin para el modelo User.
    Extiende el UserAdmin de Django para incluir campos personalizados.
    """
    
    # Campos a mostrar en la lista
    list_display = [
        'username', 'email', 'full_name', 'company_name',
        'role', 'is_active', 'is_staff', 'device_count_display',
        'created_at'
    ]
    
    # Campos por los que se puede buscar
    search_fields = ['username', 'email', 'first_name', 'last_name', 'company_name']
    
    # Filtros laterales
    list_filter = ['role', 'is_active', 'is_staff', 'is_superuser', 'created_at']
    
    # Ordenamiento por defecto
    ordering = ['-created_at']
    
    # Campos de solo lectura
    readonly_fields = ['created_at', 'updated_at', 'last_login', 'date_joined']
    
    # Configuración de fieldsets para el formulario de edición
    fieldsets = (
        ('Información de Autenticación', {
            'fields': ('username', 'password')
        }),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'avatar')
        }),
        ('Información de Empresa', {
            'fields': ('company_name', 'role')
        }),
        ('Permisos', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Fechas Importantes', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # Configuración de fieldsets para crear nuevo usuario
    add_fieldsets = (
        ('Información de Autenticación', {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
        ('Información Personal', {
            'classes': ('wide',),
            'fields': ('first_name', 'last_name', 'phone'),
        }),
        ('Información de Empresa', {
            'classes': ('wide',),
            'fields': ('company_name', 'role'),
        }),
        ('Permisos', {
            'classes': ('wide',),
            'fields': ('is_active', 'is_staff', 'is_superuser'),
        }),
    )
    
    def device_count_display(self, obj):
        """Muestra el número de dispositivos del usuario"""
        count = obj.get_device_count()
        if count > 0:
            return format_html(
                '<span style="color: green; font-weight: bold;">{}</span>',
                count
            )
        return count
    
    device_count_display.short_description = 'Dispositivos'
    
    def get_queryset(self, request):
        """Optimiza las consultas con select_related y prefetch_related"""
        qs = super().get_queryset(request)
        return qs.select_related().prefetch_related('devices')
