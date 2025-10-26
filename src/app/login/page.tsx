
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
    <main className="flex h-screen w-full items-center justify-center bg-slate-950 text-white font-sans overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-cyan-900/50 animated-gradient -z-10" />

      <div className="container grid grid-cols-1 md:grid-cols-2 items-center justify-center gap-12 p-4">
        
        {/* Left Side: Institutional Image */}
        <motion.div 
            className="hidden md:block relative h-full w-full max-w-md mx-auto"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }}
        >
            <Image 
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Campus Universitario"
                fill
                className="object-cover rounded-3xl shadow-2xl"
            />
            <div className="absolute inset-0 bg-black/30 rounded-3xl" />
            <div className="absolute bottom-8 left-8 text-white">
                <h2 className="text-3xl font-bold">Portal Académico Poli 2.0</h2>
                <p className="text-lg opacity-80">Tu futuro empieza aquí.</p>
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
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: useTransform(
                    [mouseX, mouseY],
                    ([x, y]) => `radial-gradient(600px at ${x}px ${y}px, rgba(147, 112, 219, 0.15), transparent 80%)`
                  ),
                }}
            />
            <div className="relative w-full rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
                <motion.div variants={itemVariants} className="flex flex-col items-center text-center mb-8">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                        <GraduationCap className="h-8 w-8" />
                    </div>
                    <h1 className="font-poppins text-3xl font-bold text-white">
                        Sistema Académico
                    </h1>
                    <p className="font-sans text-white/60">
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
                                                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                                                <Input type="email" placeholder="tu.correo@pi.edu.co" className="pl-10 bg-slate-800/50 border-white/20 focus:border-blue-400 focus:ring-blue-400/50" {...field} />
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
                                                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 bg-slate-800/50 border-white/20 focus:border-blue-400 focus:ring-blue-400/50" {...field} />
                                            </FormControl>
                                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/40 hover:text-white" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
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
                                <Checkbox id="remember-me" className="border-white/40 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white" />
                                <label htmlFor="remember-me" className="select-none text-white/60">Recordarme</label>
                            </div>
                            <Link href="/forgot-password" className="font-sans text-sm text-blue-400 hover:underline">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </motion.div>
                        
                        <motion.div variants={itemVariants}>
                             <GlowButton type="submit" disabled={isLoading} className="w-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 py-6 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30">
                                {isLoading ? "Ingresando..." : "Ingresar al Portal"}
                            </GlowButton>
                        </motion.div>
                    </form>
                </Form>
                 <motion.div variants={itemVariants} className="mt-6 text-center text-sm">
                    <p className="text-white/60">¿No tienes una cuenta?</p>
                    <Link href="/register" className="font-semibold text-blue-400 hover:underline">
                        Crea una aquí
                    </Link>
                </motion.div>
            </div>
             <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center text-xs text-white/40">
                © {new Date().getFullYear()} Sistema Académico Universitario
            </p>
        </motion.div>

      </div>
    </main>
  );
}
