
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
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 auth-bg">
       <div className="absolute top-4 left-4 z-10">
        <Button
          asChild
          variant="outline"
          className="flex items-center gap-2 rounded-full"
        >
          <Link href="/forgot-password">
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
            Verificación de Código
          </CardTitle>
          <CardDescription className="font-poppins text-muted-foreground">
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
                    <FormLabel>Código de Verificación</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="000000"
                          className="py-6 pl-12 text-center text-lg tracking-[0.5em] placeholder:text-gray-400"
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
                className="w-full rounded-full py-6 text-base font-semibold"
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
