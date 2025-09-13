
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
import { Eye, EyeOff, GraduationCap, ArrowLeft } from "lucide-react";
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 pt-16 font-roboto sm:p-6">
      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-all hover:bg-gray-100 hover:shadow-md active:scale-95 sm:px-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Volver</span>
        </Link>
      </div>
      <Card className="w-full max-w-md rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#002147]">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="font-poppins text-3xl font-bold text-gray-800">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="font-poppins text-gray-600">
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
                      <Input
                        type="email"
                        placeholder="tu.correo@pi.edu.co"
                        className="rounded-lg border-gray-300 py-6 focus:border-[#004aad] focus:ring-[#004aad]"
                        {...field}
                      />
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
                            className="rounded-lg border-gray-300 py-6 pr-10 focus:border-[#004aad] focus:ring-[#004aad]"
                            {...field}
                          />
                       </FormControl>
                       <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
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
                        className="block pt-2 text-right font-poppins text-sm text-[#004aad] hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-[#004aad] py-6 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700"
              >
                {isLoading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
