
"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, GraduationCap, ArrowLeft, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
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
import Image from "next/image";
import { PublicThemeHandler } from "@/components/ui/public-theme-handler";

type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    mode: "onTouched",
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      form.setValue('email', rememberedEmail);
      form.setValue('rememberMe', true);
    }
  }, [form]);

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
        toast({ title: "Inicio de sesión exitoso", description: `Bienvenido de nuevo, ${data.user.nombre1}.` });
        localStorage.setItem('userEmail', data.user.correoInstitucional);
        localStorage.setItem('userRole', data.user.rol.id);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userName', data.user.nombreCompleto);

        if (values.rememberMe) {
            localStorage.setItem('rememberedEmail', values.email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        router.push('/dashboard');
      } else {
        toast({ variant: "destructive", title: "Error de inicio de sesión", description: data.message || "Credenciales incorrectas." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo conectar con el servidor." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full items-center justify-center font-poppins overflow-hidden auth-bg">
      <PublicThemeHandler />
      <div className="container grid grid-cols-1 md:grid-cols-2 items-center justify-center gap-12 p-4">
        
        {/* Left Side: Institutional Image */}
        <div className="hidden md:flex relative h-[70vh] w-full max-w-md mx-auto items-center justify-center">
            <div className="relative h-full w-full rounded-3xl shadow-2xl overflow-hidden">
                <Image 
                    src="https://picsum.photos/seed/login-poli-mountains/1200/1800"
                    alt="Paisaje montañoso con niebla"
                    fill
                    className="object-cover"
                    data-ai-hint="mountains fog"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute bottom-8 left-8 text-white">
                    <h2 className="text-4xl font-bold font-poppins">Portal Académico Poli 2.0</h2>
                    <p className="text-lg opacity-90 mt-2">Tu futuro empieza aquí.</p>
                </div>
            </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="relative w-full max-w-md mx-auto">
            <div className="relative w-full rounded-3xl border bg-card p-8 shadow-lg">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <GraduationCap className="h-8 w-8" />
                    </div>
                    <h1 className="font-poppins text-3xl font-bold text-gray-800 dark:text-white">
                        Sistema Académico
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Accede a tu portal académico.
                    </p>
                </div>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <FormField
                                control={form.control}
                                name="email"
                                rules={{ validate: validateEmail }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Correo Institucional</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                                <Input type="email" placeholder="tu.correo@pi.edu.co" className="pl-10" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div>
                            <FormField
                                control={form.control}
                                name="password"
                                rules={{ validate: validateRequired }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" {...field} />
                                            </FormControl>
                                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <FormField
                                control={form.control}
                                name="rememberMe"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="leading-none">
                                            <FormLabel className="font-normal text-gray-500 dark:text-gray-400">
                                                Recordarme
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <div>
                                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        </div>
                        
                        <div>
                             <Button type="submit" disabled={isLoading} className="w-full rounded-md bg-blue-600 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700">
                                {isLoading ? "Ingresando..." : "Ingresar al Portal"}
                            </Button>
                        </div>
                    </form>
                </Form>
                 <div className="mt-6 text-center text-sm">
                    <p className="text-gray-500 dark:text-gray-400">¿Aún no eres parte de la comunidad?</p>
                    <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                        Inscríbete aquí
                    </Link>
                </div>
            </div>
             <p className="mt-8 text-center text-xs text-gray-400">
                © {new Date().getFullYear()} Sistema Académico Universitario
            </p>
        </div>

      </div>
    </main>
  );
}
