
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
import { Eye, EyeOff, GraduationCap, ArrowLeft, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { validateEmail, validateRequired } from "@/lib/validators";

type LoginFormValues = {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido de nuevo, ${data.user.nombre1}.`,
        });
        localStorage.setItem('userEmail', data.user.correoInstitucional);
        localStorage.setItem('userRole', data.user.rol.id);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userName', data.user.nombreCompleto);
        router.push('/dashboard');
      } else {
        toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: data.message || "Credenciales incorrectas.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 auth-bg">
      <div className="absolute top-4 left-4 z-10">
        <Button asChild variant="outline" className="flex items-center gap-2 rounded-full">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Link>
        </Button>
      </div>

      <Card className="z-10 w-full max-w-md rounded-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-8 w-8" />
          </div>
          <CardTitle className="font-poppins text-3xl font-bold text-foreground">
            Poli 2.0
          </CardTitle>
          <CardDescription className="font-poppins text-muted-foreground">
            Bienvenido de nuevo. Usa tu correo institucional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                rules={{ validate: validateEmail }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Institucional</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="tu.correo@pi.edu.co"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                rules={{ validate: validateRequired }}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                       <FormLabel>Contraseña</FormLabel>
                    </div>
                    <div className="relative">
                       <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            {...field}
                          />
                       </FormControl>
                       <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                       <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                          aria-label={
                            showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                    </div>
                     <FormMessage />
                     <Link
                        href="/forgot-password"
                        className="block pt-2 text-right font-poppins text-sm text-primary hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full rounded-full py-6 text-base font-semibold">
                {isLoading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
