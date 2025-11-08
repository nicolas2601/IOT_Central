"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { openErrorModal } from "@/store/errorStore";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedCard } from "@/components/animations/AnimatedCard";
import { HoverScale } from "@/components/animations/HoverScale";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { Loader2, UserPlus } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Usuario requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  password_confirm: z.string().min(8, "Confirma tu contraseña"),
  first_name: z.string().min(1, "Nombre requerido"),
  last_name: z.string().min(1, "Apellido requerido"),
  company_name: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Las contraseñas no coinciden",
  path: ["password_confirm"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register: registerUser, isRegistering } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      password_confirm: "",
      first_name: "",
      last_name: "",
      company_name: "",
      phone: "",
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    try {
      setSubmitting(true);
      // clearError(); // removed undefined function
      await registerUser(values);
      toast.success("Cuenta creada ✨", { description: "Redirigiendo al dashboard" });
    } catch (err: any) {
      const backend = err?.response?.data;
      let description = err?.message || "Intenta nuevamente";
      if (backend && typeof backend === 'object') {
        const parts: string[] = [];
        for (const [key, val] of Object.entries(backend)) {
          const msgs = Array.isArray(val) ? val.join(', ') : String(val);
          parts.push(`${key}: ${msgs}`);
        }
        if (parts.length > 0) description = parts.join(' | ');
      }
      openErrorModal("Error al registrarse", description);
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
            <CardTitle className="text-2xl text-white">Crear cuenta</CardTitle>
            <CardDescription className="text-white/80">Regístrate para gestionar tus dispositivos IoT</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/90">Usuario</Label>
              <Input 
                id="username" 
                placeholder="tu_usuario" 
                {...register("username")} 
                aria-invalid={!!errors.username} 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              {errors.username && <p className="text-red-300 text-sm">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="tucorreo@ejemplo.com" 
                {...register("email")} 
                aria-invalid={!!errors.email} 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              {errors.email && <p className="text-red-300 text-sm">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-white/90">Nombre</Label>
              <Input 
                id="first_name" 
                placeholder="Gabriela" 
                {...register("first_name")} 
                aria-invalid={!!errors.first_name} 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              {errors.first_name && <p className="text-red-300 text-sm">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-white/90">Apellido</Label>
              <Input 
                id="last_name" 
                placeholder="López" 
                {...register("last_name")} 
                aria-invalid={!!errors.last_name} 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              {errors.last_name && <p className="text-red-300 text-sm">{errors.last_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-white/90">Empresa (opcional)</Label>
              <Input 
                id="company_name" 
                placeholder="Mi Empresa" 
                {...register("company_name")} 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white/90">Teléfono (opcional)</Label>
              <Input 
                id="phone" 
                placeholder="+52 555 555 5555" 
                {...register("phone")} 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="password" className="text-white/90">Contraseña</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              autoComplete="new-password" 
              {...register("password")} 
              aria-invalid={!!errors.password} 
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            {errors.password && <p className="text-red-300 text-sm">{errors.password.message}</p>}
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="password_confirm" className="text-white/90">Confirmar contraseña</Label>
            <Input 
              id="password_confirm" 
              type="password" 
              placeholder="••••••••" 
              autoComplete="new-password" 
              {...register("password_confirm")} 
              aria-invalid={!!errors.password_confirm} 
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            {errors.password_confirm && <p className="text-red-300 text-sm">{errors.password_confirm.message}</p>}
          </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <HoverScale>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isRegistering || submitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                {isRegistering || submitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <UserPlus />
                    Crear cuenta
                  </>
                )}
              </Button>
            </HoverScale>
            <Link href="/login" className="text-xs underline text-white/80 hover:text-white text-center">
              Volver a Iniciar Sesión
            </Link>
          </CardFooter>
        </Card>
      </SpotlightCard>
    </AnimatedCard>
  );
}
