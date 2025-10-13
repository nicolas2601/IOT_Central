import { LoginForm } from '@/components/auth/LoginForm';
import { Cpu } from 'lucide-react';

/**
 * Página de Login
 * 
 * Página pública que muestra el formulario de inicio de sesión.
 * Incluye branding y diseño centrado.
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo y Título */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
              <Cpu className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Plataforma IoT
          </h1>
          <p className="text-gray-600">
            Gestiona tus dispositivos IoT de forma inteligente
          </p>
        </div>

        {/* Formulario de Login */}
        <LoginForm />

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 Plataforma IoT. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
