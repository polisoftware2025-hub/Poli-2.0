
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
import { ArrowLeft, Eye, EyeOff, Lock, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            Cambiar Contraseña
          </CardTitle>
          <CardDescription className="font-poppins text-gray-600">
            Crea una contraseña segura con al menos 8 caracteres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="new-password"
                className="font-poppins font-medium text-gray-700"
              >
                Nueva Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  required
                  className="rounded-lg border-gray-300 py-6 pl-10 pr-10 focus:border-[#004aad] focus:ring-[#004aad]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="font-poppins font-medium text-gray-700"
              >
                Confirmar Contraseña
              </Label>
               <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  required
                  className="rounded-lg border-gray-300 py-6 pl-10 pr-10 focus:border-[#004aad] focus:ring-[#004aad]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full rounded-full bg-[#004aad] py-6 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700"
            >
              Guardar Contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
