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
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";


const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  password: z.string().min(1, { message: "La contraseña es obligatoria." }),
});


export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo.",
      });
      router.push("/dashboard");
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: "Credenciales incorrectas. Por favor, inténtalo de nuevo.",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-roboto">
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m15 18-6-6 6-6"/></svg>
          Volver
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
            Bienvenido de nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu.correo@example.com"
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
                className="w-full rounded-full bg-[#004aad] py-6 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700"
              >
                Ingresar
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
