
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
import { ArrowLeft, Mail, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-roboto">
      <div className="absolute top-4 left-4">
        <Link href="/login" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5"/>
          Volver al inicio de sesión
        </Link>
      </div>
      <Card className="w-full max-w-md rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#002147]">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="font-poppins text-3xl font-bold text-gray-800">
            ¿Olvidaste tu Contraseña?
          </CardTitle>
          <CardDescription className="font-poppins text-gray-600">
            No te preocupes, te enviaremos un código para que puedas restablecerla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="font-poppins font-medium text-gray-700"
              >
                Correo Electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  required
                  className="rounded-lg border-gray-300 py-6 pl-10 focus:border-[#004aad] focus:ring-[#004aad]"
                />
              </div>
            </div>
            <Button
              type="submit"
              asChild
              className="w-full rounded-full bg-[#004aad] py-6 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700"
            >
              <Link href="/verify-code">Enviar Código</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
