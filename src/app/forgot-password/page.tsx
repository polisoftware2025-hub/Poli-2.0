
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
import { ArrowLeft, Mail, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    setIsLoading(true);
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(`${'\'\'\''}{appUrl}/api/request-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Solicitud Enviada",
          description: data.message,
        });
        form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message,
        });
      }
    } catch (error) {
      console.error("Error al solicitar el reseteo:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al intentar procesar tu solicitud. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      <Card className="z-10 w-full max-w-md rounded-2xl border-cyan-300/20 bg-black/30 text-white shadow-2xl shadow-cyan-500/10 backdrop-blur-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-400/50 bg-black/40 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
            <GraduationCap className="h-8 w-8 text-cyan-400" />
          </div>
          <CardTitle className="font-poppins text-3xl font-bold text-cyan-300">
            ¿Olvidaste tu Contraseña?
          </CardTitle>
          <CardDescription className="font-poppins text-cyan-100/70">
            No te preocupes, te enviaremos un enlace para que puedas restablecerla.
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
                    <FormLabel className="text-cyan-100/80">Correo Electrónico</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400/50" />
                        <Input
                          type="email"
                          placeholder="Ingresa tu correo electrónico registrado"
                          className="form-input-dark pl-12"
                          {...field}
                        />
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
                {isLoading ? "Enviando..." : "Enviar Enlace de Recuperación"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
