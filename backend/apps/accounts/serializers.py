"""
Serializadores de la aplicación Accounts

Define los serializadores para:
- Registro de usuarios
- Login
- Perfil de usuario
- Actualización de perfil
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializador básico de usuario para lectura.
    Usado en listados y detalles de usuario.
    """
    full_name = serializers.ReadOnlyField()
    device_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'company_name', 'role', 'phone', 'avatar',
            'is_active', 'device_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_device_count(self, obj):
        """Retorna el número de dispositivos del usuario"""
        return obj.get_device_count()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializador para registro de nuevos usuarios.
    Incluye validación de contraseña y confirmación.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'company_name', 'phone'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }
    
    def validate(self, attrs):
        """Valida que las contraseñas coincidan"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Las contraseñas no coinciden."
            })
        return attrs
    
    def validate_email(self, value):
        """Valida que el email no esté en uso"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError(
                "Ya existe un usuario con este correo electrónico."
            )
        return value.lower()
    
    def validate_username(self, value):
        """Valida que el username no esté en uso"""
        if User.objects.filter(username=value.lower()).exists():
            raise serializers.ValidationError(
                "Ya existe un usuario con este nombre de usuario."
            )
        return value.lower()
    
    def create(self, validated_data):
        """Crea un nuevo usuario con contraseña hasheada"""
        # Remover password_confirm ya que no es parte del modelo
        validated_data.pop('password_confirm')
        
        # Crear usuario con contraseña hasheada
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            company_name=validated_data.get('company_name', ''),
            phone=validated_data.get('phone', ''),
            role='user'  # Por defecto, todos los nuevos usuarios son 'user'
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializador para login de usuarios.
    Acepta username o email junto con la contraseña.
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Valida las credenciales del usuario"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        # Intentar buscar por username o email
        user = None
        if '@' in username:
            # Es un email
            try:
                user = User.objects.get(email=username.lower())
            except User.DoesNotExist:
                pass
        else:
            # Es un username
            try:
                user = User.objects.get(username=username.lower())
            except User.DoesNotExist:
                pass
        
        # Validar usuario y contraseña
        if user is None:
            raise serializers.ValidationError(
                "No se encontró un usuario con estas credenciales."
            )
        
        if not user.check_password(password):
            raise serializers.ValidationError(
                "Contraseña incorrecta."
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                "Esta cuenta ha sido desactivada."
            )
        
        attrs['user'] = user
        return attrs


class LoginResponseSerializer(serializers.Serializer):
    """
    Serializador para la respuesta de login.
    Incluye tokens JWT y datos del usuario.
    """
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializador para el perfil del usuario.
    Permite actualizar información personal.
    """
    full_name = serializers.ReadOnlyField()
    device_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'company_name', 'role', 'phone', 'avatar',
            'is_active', 'device_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'username', 'email', 'role', 'is_active', 'created_at', 'updated_at']
    
    def get_device_count(self, obj):
        """Retorna el número de dispositivos del usuario"""
        return obj.get_device_count()


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para actualizar el perfil del usuario.
    Permite cambiar información personal y avatar.
    """
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'company_name', 'phone', 'avatar'
        ]
    
    def validate_phone(self, value):
        """Valida el formato del teléfono"""
        if value and not value.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise serializers.ValidationError(
                "El número de teléfono solo puede contener dígitos, espacios, + y -"
            )
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializador para cambiar la contraseña del usuario.
    Requiere la contraseña actual y la nueva contraseña.
    """
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Valida que las nuevas contraseñas coincidan"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password": "Las contraseñas no coinciden."
            })
        return attrs
    
    def validate_old_password(self, value):
        """Valida que la contraseña actual sea correcta"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value
