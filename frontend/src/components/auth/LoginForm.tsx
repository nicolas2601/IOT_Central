"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
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
  const { login, isLoading, error, clearError } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      setSubmitting(true);
      clearError();
      await login(values.username, values.password);
      toast.success("Bienvenido 👋", { description: "Acceso al dashboard" });
    } catch (err: any) {
      toast.error("Error al iniciar sesión", { description: err?.response?.data?.message || error || "Revisa tus credenciales" });
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
        <Card className="border-0 bg-transparent shadow-none">
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
                disabled={isLoading || submitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                {isLoading || submitting ? (
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
        </Card>
      </SpotlightCard>
    </AnimatedCard>
  );
}