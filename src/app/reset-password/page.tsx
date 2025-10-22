
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, EyeOff, Lock, GraduationCap, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { validatePassword } from "@/lib/validators";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

function ResetPasswordComponent() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Token no encontrado",
        description: "El enlace de reseteo es inválido o está incompleto.",
      });
      router.push("/forgot-password");
    }
  }, [token, router, toast]);

  const form = useForm<ResetPasswordFormValues>({
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: values.password,
          confirmPassword: values.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Tu contraseña ha sido cambiada exitosamente.",
        });
        setIsSuccess(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "No se pudo cambiar la contraseña.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de red",
        description: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
       <Card className="z-10 w-full max-w-md rounded-2xl border-cyan-300/20 bg-black/30 text-white shadow-2xl shadow-cyan-500/10 backdrop-blur-lg text-center">
         <CardHeader>
           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-400/50 bg-black/40 shadow-[0_0_20px_rgba(0,255,100,0.2)]">
             <CheckCircle className="h-8 w-8 text-green-400" />
           </div>
           <CardTitle className="font-poppins text-3xl font-bold text-green-300">
             Contraseña Cambiada
           </CardTitle>
         </CardHeader>
         <CardContent>
           <p className="text-cyan-100/70">Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión con tus nuevas credenciales.</p>
           <Button asChild className="mt-6 w-full rounded-full border border-cyan-400 bg-cyan-400/20 py-6 text-base font-semibold text-white shadow-lg shadow-cyan-500/10 transition-all hover:scale-105 hover:bg-cyan-400/30 hover:border-cyan-300">
             <Link href="/login">Ir a Iniciar Sesión</Link>
           </Button>
         </CardContent>
       </Card>
    )
  }

  return (
    <Card className="z-10 w-full max-w-md rounded-2xl border-cyan-300/20 bg-black/30 text-white shadow-2xl shadow-cyan-500/10 backdrop-blur-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-400/50 bg-black/40 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
          <GraduationCap className="h-8 w-8 text-cyan-400" />
        </div>
        <CardTitle className="font-poppins text-3xl font-bold text-cyan-300">
          Cambiar Contraseña
        </CardTitle>
        <CardDescription className="font-poppins text-cyan-100/70">
          Crea una contraseña segura con al menos 8 caracteres.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              rules={{ validate: validatePassword }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-cyan-100/80">Nueva Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400/50" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="rounded-lg border-cyan-300/30 bg-black/40 py-6 pl-12 pr-10 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400"
                        {...field}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-cyan-400/60 hover:text-cyan-400">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              rules={{ validate: (value) => value === form.getValues("password") || "Las contraseñas no coinciden." }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-cyan-100/80">Confirmar Contraseña</FormLabel>
                  <FormControl>
                     <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400/50" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="rounded-lg border-cyan-300/30 bg-black/40 py-6 pl-12 pr-10 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400"
                        {...field}
                      />
                       <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-cyan-400/60 hover:text-cyan-400">{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full border border-cyan-400 bg-cyan-400/20 py-6 text-base font-semibold text-white shadow-lg shadow-cyan-500/10 transition-all hover:scale-105 hover:bg-cyan-400/30 hover:border-cyan-300"
            >
              {isLoading ? 'Guardando...' : 'Guardar Contraseña'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 polygon-bg">
       <div className="absolute top-4 left-4 z-10">
         <Button
          asChild
          variant="ghost"
          className="flex items-center gap-2 rounded-full border border-white/20 bg-black/20 text-white shadow-sm transition-all hover:bg-black/40 hover:text-white active:scale-95 sm:px-4"
        >
          <Link href="/login">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Link>
        </Button>
      </div>
      <Suspense fallback={<div>Cargando...</div>}>
        <ResetPasswordComponent />
      </Suspense>
    </div>
  )
}
