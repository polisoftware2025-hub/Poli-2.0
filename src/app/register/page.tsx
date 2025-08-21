
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  User,
  Phone,
  BookOpen,
  KeyRound,
  FileText,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const Step1 = () => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
    <div className="space-y-2">
      <Label htmlFor="firstName">Nombres</Label>
      <Input id="firstName" placeholder="John" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="lastName">Apellidos</Label>
      <Input id="lastName" placeholder="Doe" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
      <Input id="birthDate" type="date" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="gender">Género</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona tu género" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="male">Masculino</SelectItem>
          <SelectItem value="female">Femenino</SelectItem>
          <SelectItem value="other">Otro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

const Step2 = () => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
    <div className="space-y-2">
      <Label htmlFor="phone">Teléfono</Label>
      <Input id="phone" placeholder="+57 300 123 4567" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="address">Dirección de Residencia</Label>
      <Input id="address" placeholder="Calle 123 #45-67" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="city">Ciudad</Label>
      <Input id="city" placeholder="Bogotá D.C." />
    </div>
    <div className="space-y-2">
      <Label htmlFor="country">País</Label>
      <Input id="country" placeholder="Colombia" />
    </div>
  </div>
);

const Step3 = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Label htmlFor="program">Programa de Interés</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un programa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="adm">Administración de Empresas</SelectItem>
          <SelectItem value="cont">Contaduría Pública</SelectItem>
          <SelectItem value="mkt">Mercadeo y Publicidad</SelectItem>
          <SelectItem value="sis">Ingeniería de Sistemas</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label htmlFor="lastInstitution">Última Institución Educativa</Label>
      <Input id="lastInstitution" placeholder="Nombre del colegio o universidad" />
    </div>
  </div>
);

const Step4 = () => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
    <div className="space-y-2">
      <Label htmlFor="email">Correo Electrónico</Label>
      <Input id="email" type="email" placeholder="tu.correo@example.com" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="password">Contraseña</Label>
      <Input id="password" type="password" placeholder="••••••••" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
      <Input id="confirmPassword" type="password" placeholder="••••••••" />
    </div>
  </div>
);

const Step5 = () => (
    <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="document">Copia del Documento de Identidad</Label>
            <Input id="document" type="file" className="file:text-gray-600 file:font-poppins" />
        </div>
        <div className="space-y-2">
            <Label htmlFor="transcript">Certificado de Notas</Label>
            <Input id="transcript" type="file" className="file:text-gray-600 file:font-poppins" />
        </div>
    </div>
);

const Step6 = () => (
    <div className="text-center flex flex-col items-center gap-4 py-8">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h3 className="text-2xl font-bold font-poppins text-gray-800">¡Todo listo!</h3>
        <p className="text-gray-600">Revisa que toda tu información sea correcta antes de finalizar.</p>
    </div>
);


export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const steps = [
    { number: 1, title: "Datos Personales", icon: User },
    { number: 2, title: "Datos de Contacto", icon: Phone },
    { number: 3, title: "Datos Académicos", icon: BookOpen },
    { number: 4, title: "Datos de Acceso", icon: KeyRound },
    { number: 5, title: "Documentos", icon: FileText },
    { number: 6, title: "Confirmación", icon: CheckCircle },
  ];

  const CurrentStepIcon = steps[currentStep - 1].icon;


  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-roboto">
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5"/>
          Volver
        </Link>
      </div>
      <Card className="w-full max-w-2xl rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#002147]">
                <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="font-poppins text-3xl font-bold text-gray-800">
                Formulario de Registro
            </CardTitle>
            <CardDescription className="font-poppins text-gray-600">
                Sigue los pasos para completar tu inscripción.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 space-y-4">
              <Progress value={progress} className="w-full h-2 bg-gray-200" />
              <div className="flex items-center justify-center gap-2 text-lg font-semibold text-[#004aad]">
                  <CurrentStepIcon className="h-6 w-6"/>
                  <span>Paso {currentStep}: {steps[currentStep - 1].title}</span>
              </div>
          </div>
          
          <form className="space-y-6">
            {currentStep === 1 && <Step1 />}
            {currentStep === 2 && <Step2 />}
            {currentStep === 3 && <Step3 />}
            {currentStep === 4 && <Step4 />}
            {currentStep === 5 && <Step5 />}
            {currentStep === 6 && <Step6 />}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between p-6 bg-gray-50 rounded-b-xl">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="rounded-full px-6 py-3"
          >
            Anterior
          </Button>
          {currentStep < totalSteps ? (
            <Button
              onClick={nextStep}
              className="rounded-full bg-[#004aad] px-6 py-3 text-white transition-transform hover:scale-105 hover:bg-blue-700"
            >
              Siguiente
            </Button>
          ) : (
            <Button className="rounded-full bg-[#2ecc71] px-6 py-3 text-white shadow-lg transition-transform hover:scale-105 hover:bg-green-600">
              Finalizar Registro
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
