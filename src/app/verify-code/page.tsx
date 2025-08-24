
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
import { useState } from "react";

const verifyCodeSchema = z.object({
  code: z.string().min(6, "El código debe tener 6 dígitos.").max(6, "El código debe tener 6 dígitos."),
});

const CODE_EXPIRATION_MINUTES = 10;

export default function VerifyCodePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
      
      const { code, timestamp } = JSON.parse(storedData);
      
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
        router.push("/reset-password");
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-roboto">
      <div className="absolute top-4 left-4">
        <Link href="/forgot-password" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5"/>
          Volver
        </Link>
      </div>
      <Card className="w-full max-w-md rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#002147]">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="font-poppins text-3xl font-bold text-gray-800">
            Verificación de Código
          </CardTitle>
          <CardDescription className="font-poppins text-gray-600">
            Revisa tu correo, hemos enviado un código de 6 dígitos.
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
                        <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Ingresa el código"
                          className="rounded-lg border-gray-300 py-6 pl-10 text-center tracking-[0.5em] focus:border-[#004aad] focus:ring-[#004aad]"
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
                className="w-full rounded-full bg-[#004aad] py-6 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700"
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
