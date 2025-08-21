
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
import { ArrowLeft, KeyRound, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function VerifyCodePage() {
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
          <form className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="code"
                className="font-poppins font-medium text-gray-700"
              >
                Código de Verificación
              </Label>
              <div className="relative">
                 <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="code"
                  type="text"
                  placeholder="Ingresa el código recibido"
                  required
                  className="rounded-lg border-gray-300 py-6 pl-10 text-center tracking-[1.5em] focus:border-[#004aad] focus:ring-[#004aad]"
                  maxLength={6}
                />
              </div>
            </div>
            <Button
              type="submit"
              asChild
              className="w-full rounded-full bg-[#004aad] py-6 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700"
            >
              <Link href="/reset-password">Validar Código</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
