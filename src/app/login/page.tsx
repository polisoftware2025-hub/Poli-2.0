
"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";

type LoginFormValues = {
  email: string;
  password: string;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

const GlowButton = ({ children, ...props }: React.ComponentProps<typeof Button>) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ clientX, clientY, currentTarget }: React.MouseEvent<HTMLButtonElement>) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <Button onMouseMove={handleMouseMove} {...props} className="relative group overflow-hidden">
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(300px at ${x}px ${y}px, rgba(255,255,255,0.2), transparent 80%)`
          ),
        }}
      />
      {children}
    </Button>
  );
};


export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const mouseX = useSpring(0, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(0, { stiffness: 500, damping: 100 });

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const form = useForm<LoginFormValues>({
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
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
        toast({ title: "Inicio de sesión exitoso", description: `Bienvenido de nuevo, ${data.user.nombre1}.` });
        localStorage.setItem('userEmail', data.user.correoInstitucional);
        localStorage.setItem('userRole', data.user.rol.id);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userName', data.user.nombreCompleto);
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
    <main className="flex h-screen w-full items-center justify-center font-sans overflow-hidden auth-bg">
      <div className="container grid grid-cols-1 md:grid-cols-2 items-center justify-center gap-12 p-4">
        
        {/* Left Side: Institutional Image */}
        <motion.div 
            className="hidden md:block relative h-[70vh] w-full max-w-md mx-auto"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }}
        >
            <Image 
                src="https://picsum.photos/seed/login-poli/1200/1800"
                alt="Campus Universitario Moderno"
                fill
                className="object-cover rounded-3xl shadow-2xl"
                data-ai-hint="university building modern"
            />
            <div className="absolute inset-0 bg-black/20 rounded-3xl" />
            <div className="absolute bottom-8 left-8 text-white">
                <h2 className="text-4xl font-bold font-poppins">Portal Académico Poli 2.0</h2>
                <p className="text-lg opacity-90 mt-2">Tu futuro empieza aquí.</p>
            </div>
        </motion.div>

        {/* Right Side: Login Form */}
        <motion.div
            onMouseMove={onMouseMove}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative w-full max-w-md mx-auto"
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-70"
                style={{
                  background: useTransform(
                    [mouseX, mouseY],
                    ([x, y]) => `radial-gradient(400px at ${x}px ${y}px, hsla(var(--primary-hue), 90%, 60%, 0.15), transparent 80%)`
                  ),
                }}
            />
            <div className="relative w-full rounded-3xl border border-border/50 bg-card/60 p-8 shadow-2xl backdrop-blur-xl">
                <motion.div variants={itemVariants} className="flex flex-col items-center text-center mb-8">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <GraduationCap className="h-8 w-8" />
                    </div>
                    <h1 className="font-poppins text-3xl font-bold text-foreground">
                        Sistema Académico
                    </h1>
                    <p className="font-sans text-muted-foreground">
                        Accede a tu portal académico.
                    </p>
                </motion.div>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <motion.div variants={itemVariants}>
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
                                                <Input type="email" placeholder="tu.correo@pi.edu.co" className="pl-10" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
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
                                                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" {...field} />
                                            </FormControl>
                                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Checkbox id="remember-me" />
                                <label htmlFor="remember-me" className="select-none text-muted-foreground">Recordarme</label>
                            </div>
                            <Link href="/forgot-password" className="font-sans text-sm text-primary hover:underline">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </motion.div>
                        
                        <motion.div variants={itemVariants}>
                             <GlowButton type="submit" disabled={isLoading} className="w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30">
                                {isLoading ? "Ingresando..." : "Ingresar al Portal"}
                            </GlowButton>
                        </motion.div>
                    </form>
                </Form>
                 <motion.div variants={itemVariants} className="mt-6 text-center text-sm">
                    <p className="text-muted-foreground">¿No tienes una cuenta?</p>
                    <Link href="/register" className="font-semibold text-primary hover:underline">
                        Crea una aquí
                    </Link>
                </motion.div>
            </div>
             <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} Sistema Académico Universitario
            </p>
        </motion.div>

      </div>
    </main>
  );
}
