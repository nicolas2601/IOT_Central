"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// Eliminamos toasts; usaremos un panel centrado de feedback
import { useAuth } from "@/hooks/useAuth";
import { openErrorModal } from "@/store/errorStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { AnimatedCard } from "@/components/animations/AnimatedCard";
import { HoverScale } from "@/components/animations/HoverScale";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { Loader2, LogIn } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Usuario requerido"),
  password: z.string().min(6, "Contraseña requerida"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login, isLoggingIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<null | { type: 'success' | 'error'; message: string; description?: string }>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      setSubmitting(true);
      const result = await login({ username: values.username, password: values.password });
      // Si el login se resolvió correctamente, mostramos panel de éxito
      if (result) {
        setFeedback({ type: 'success', message: 'Login exitoso', description: 'Acceso al dashboard' });
      }
    } catch (err: any) {
      // Usar el modal global de errores para mantener consistencia visual
      const description = err?.response?.data?.message || err?.message || 'Revisa tus credenciales';
      openErrorModal('Error al iniciar sesión', description);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedCard>
      <SpotlightCard 
        className="shadow-xl border-white/20 bg-black/40 backdrop-blur-md"
        spotlightColor="rgba(58, 41, 255, 0.3)"
      >
        <Card className="border-0 bg-transparent shadow-none relative">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Iniciar sesión</CardTitle>
            <CardDescription className="text-white/80">Accede a tu plataforma IoT</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/90">Usuario</Label>
              <Input 
                id="username" 
                placeholder="tu_usuario" 
                autoComplete="username" 
                {...register("username")} 
                aria-invalid={!!errors.username}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              {errors.username && (
                <p className="text-red-300 text-sm">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                autoComplete="current-password" 
                {...register("password")} 
                aria-invalid={!!errors.password}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              {errors.password && (
                <p className="text-red-300 text-sm">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <HoverScale>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isLoggingIn || submitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                {isLoggingIn || submitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <LogIn />
                    Entrar
                  </>
                )}
              </Button>
            </HoverScale>
            <p className="text-center text-sm text-white/70">
              ¿No tienes cuenta? {" "}
              <Link href="/register" className="text-blue-300 hover:text-blue-200 hover:underline">Regístrate</Link>
            </p>
          </CardFooter>

          {feedback && feedback.type === 'success' && (
            <>
              {/* Overlay de fondo oscuro */}
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30" />
              {/* Panel centrado */}
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
                <div className={`min-w-[280px] max-w-sm rounded-xl border p-4 shadow-2xl backdrop-blur-md ${feedback.type === 'success' ? 'bg-green-600/30 border-green-400/60' : 'bg-red-600/30 border-red-400/60'}`}>
                  <p className={`text-center font-semibold ${feedback.type === 'success' ? 'text-green-200' : 'text-red-200'}`}>{feedback.message}</p>
                  {feedback.description && (
                    <p className="mt-1 text-center text-white/80 text-sm">{feedback.description}</p>
                  )}
                  <div className="mt-3 flex justify-center gap-3">
                    {feedback.type === 'success' ? (
                      <Button
                        onClick={() => { setFeedback(null); router.push('/dashboard'); }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Aceptar
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </SpotlightCard>
    </AnimatedCard>
  );
}