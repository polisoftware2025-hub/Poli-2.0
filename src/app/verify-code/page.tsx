
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
import { ArrowLeft, KeyRound, GraduationCap } from "lucide-react";
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
import { useState, useEffect } from "react";

const verifyCodeSchema = z.object({
  code: z.string().min(6, "El código debe tener 6 dígitos.").max(6, "El código debe tener 6 dígitos."),
});

const CODE_EXPIRATION_MINUTES = 10;

export default function VerifyCodePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  useEffect(() => {
     const storedData = localStorage.getItem('verificationData');
     if (storedData) {
       setVerificationEmail(JSON.parse(storedData).email);
     } else {
        // Si no hay datos, no debería estar en esta página.
        router.replace('/forgot-password');
     }
  }, [router]);


  const form = useForm<z.infer<typeof verifyCodeSchema>>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof verifyCodeSchema>) => {
    setIsLoading(true);
    try {
      const storedData = localStorage.getItem('verificationData');
      if (!storedData) {
        toast({
          variant: "destructive",
          title: "Error de verificación",
          description: "No se encontró un código de verificación. Por favor, solicita uno nuevo.",
        });
        router.push("/forgot-password");
        return;
      }
      
      const { code, timestamp, email } = JSON.parse(storedData);

      if (email !== verificationEmail) {
         toast({ variant: "destructive", title: "Error", description: "El correo de verificación ha cambiado." });
         router.push("/forgot-password");
         return;
      }
      
      const timeElapsed = (Date.now() - timestamp) / (1000 * 60);

      if (timeElapsed > CODE_EXPIRATION_MINUTES) {
        toast({
          variant: "destructive",
          title: "Código expirado",
          description: "Tu código ha expirado. Por favor, solicita uno nuevo.",
        });
        localStorage.removeItem('verificationData');
        router.push("/forgot-password");
        return;
      }
      
      if (values.code === code) {
        toast({
          title: "Código verificado",
          description: "Tu código ha sido verificado correctamente.",
        });
        // Remove temp data and proceed to reset password page
        localStorage.removeItem('verificationData');
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        toast({
          variant: "destructive",
          title: "Código incorrecto",
          description: "El código que ingresaste no es válido. Inténtalo de nuevo.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
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
          <Link href="/forgot-password">
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
            Verificación de Código
          </CardTitle>
          <CardDescription className="font-poppins text-cyan-100/70">
            {verificationEmail 
              ? <>Revisa tu correo <span className="font-semibold">{verificationEmail}</span>, hemos enviado un código de 6 dígitos.</>
              : "Cargando..."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cyan-100/80">Código de Verificación</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400/50" />
                        <Input
                          type="text"
                          placeholder="000000"
                          className="rounded-lg border-cyan-300/30 bg-black/40 py-6 pl-12 text-center text-lg tracking-[0.5em] text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400"
                          maxLength={6}
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
                {isLoading ? "Validando..." : "Validar Código"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
