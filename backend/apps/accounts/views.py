"""
Vistas de la aplicación Accounts

Define las vistas para:
- Registro de usuarios
- Login/Logout
- Gestión de perfil
- Listado de usuarios (admin)
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q
import logging

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    LoginResponseSerializer,
    UserSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    ChangePasswordSerializer
)

User = get_user_model()
logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    """
    Vista para registro de nuevos usuarios.
    
    POST /api/auth/register/
    Body: {
        "username": "usuario",
        "email": "usuario@example.com",
        "password": "contraseña123",
        "password_confirm": "contraseña123",
        "first_name": "Nombre",
        "last_name": "Apellido",
        "company_name": "Empresa (opcional)",
        "phone": "+57 300 1234567 (opcional)"
    }
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"Nuevo usuario registrado: {user.username} ({user.email})")
        
        return Response({
            'message': 'Usuario registrado exitosamente',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    Vista para login de usuarios.
    
    POST /api/auth/login/
    Body: {
        "username": "usuario o email",
        "password": "contraseña"
    }
    
    Retorna tokens JWT y datos del usuario.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        # Actualizar last_login
        from django.contrib.auth import update_session_auth_hash
        user.save(update_fields=['last_login'])
        
        logger.info(f"Usuario autenticado: {user.username}")
        
        response_data = {
            'message': 'Login exitoso',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Vista para logout de usuarios.
    Invalida el refresh token.
    
    POST /api/auth/logout/
    Body: {
        "refresh": "refresh_token"
    }
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {'error': 'Se requiere el refresh token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            logger.info(f"Usuario cerró sesión: {request.user.username}")
            
            return Response(
                {'message': 'Logout exitoso'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error en logout: {str(e)}")
            return Response(
                {'error': 'Token inválido o expirado'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(generics.RetrieveAPIView):
    """
    Vista para obtener el perfil del usuario autenticado.
    
    GET /api/auth/profile/
    """
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ProfileUpdateView(generics.UpdateAPIView):
    """
    Vista para actualizar el perfil del usuario autenticado.
    
    PUT/PATCH /api/auth/profile/update/
    Body: {
        "first_name": "Nuevo Nombre",
        "last_name": "Nuevo Apellido",
        "company_name": "Nueva Empresa",
        "phone": "+57 300 1234567",
        "avatar": <file>
    }
    """
    serializer_class = ProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        logger.info(f"Perfil actualizado: {instance.username}")
        
        return Response({
            'message': 'Perfil actualizado exitosamente',
            'user': ProfileSerializer(instance).data
        })


class ChangePasswordView(APIView):
    """
    Vista para cambiar la contraseña del usuario autenticado.
    
    POST /api/auth/change-password/
    Body: {
        "old_password": "contraseña_actual",
        "new_password": "nueva_contraseña",
        "new_password_confirm": "nueva_contraseña"
    }
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        # Cambiar contraseña
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        logger.info(f"Contraseña cambiada: {user.username}")
        
        return Response({
            'message': 'Contraseña cambiada exitosamente'
        }, status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    """
    Vista para listar todos los usuarios (solo admin).
    
    GET /api/auth/users/
    Query params:
    - search: Buscar por username, email, nombre
    - role: Filtrar por rol
    - is_active: Filtrar por estado activo
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def get_queryset(self):
        queryset = User.objects.all()
        
        # Búsqueda
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(company_name__icontains=search)
            )
        
        # Filtro por rol
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Filtro por estado activo
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-created_at')


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar o eliminar un usuario específico (solo admin).
    
    GET /api/auth/users/{id}/
    PUT/PATCH /api/auth/users/{id}/
    DELETE /api/auth/users/{id}/
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # No permitir eliminar el propio usuario
        if instance.id == request.user.id:
            return Response(
                {'error': 'No puedes eliminar tu propia cuenta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Desactivar en lugar de eliminar
        instance.is_active = False
        instance.save()
        
        logger.warning(f"Usuario desactivado por admin: {instance.username}")
        
        return Response(
            {'message': 'Usuario desactivado exitosamente'},
            status=status.HTTP_200_OK
        )
