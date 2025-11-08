import { LoginForm } from '@/components/auth/LoginForm';
import Aurora from '@/components/animations/Aurora';
import { Cpu } from 'lucide-react';

/**
 * Página de Login
 * 
 * Página pública que muestra el formulario de inicio de sesión.
 * Incluye branding y diseño centrado con efecto Aurora animado.
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#0B0F20] via-[#0B0F20] to-[#1B1445]">
      {/* Aurora Background (negro predominante con azul y morado) */}
      <Aurora 
        colorStops={["#0B0F20", "#4C1D95", "#1E3A8A"]}
        blend={0.8}
        amplitude={1.8}
        speed={0.6}
      />

      {/* Overlay más oscuro para contraste */}
      <div className="absolute inset-0 bg-black/40 z-0" />
      
      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo y Título */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-blue-600/80 via-purple-700/80 to-blue-800/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg">
              <Cpu className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            Plataforma IoT
          </h1>
          <p className="text-white/80 drop-shadow">
            Gestiona tus dispositivos IoT de forma inteligente
          </p>
        </div>

        {/* Formulario de Login */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/15">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-white/60">
          <p>© 2025 Plataforma IoT. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
