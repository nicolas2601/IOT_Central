import { RegisterForm } from '@/components/auth/RegisterForm';
import { Cpu } from 'lucide-react';

/**
 * Página de Registro
 * 
 * Página pública que muestra el formulario de registro.
 * Incluye branding y diseño centrado.
 */
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo y Título */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
              <Cpu className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Únete a Plataforma IoT
          </h1>
          <p className="text-gray-600">
            Crea tu cuenta y comienza a gestionar tus dispositivos IoT
          </p>
        </div>

        {/* Formulario de Registro */}
        <RegisterForm />

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 Plataforma IoT. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
