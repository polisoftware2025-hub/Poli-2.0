
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import * as z from "zod";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

const step1Schema = z.object({
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }).max(50),
  segundoNombre: z.string().optional(),
  lastName: z.string().min(2, { message: "El primer apellido debe tener al menos 2 caracteres." }),
  segundoApellido: z.string().min(2, { message: "El segundo apellido debe tener al menos 2 caracteres." }),
  tipoIdentificacion: z.string({ required_error: "Por favor, selecciona un tipo de identificación." }),
  numeroIdentificacion: z.string().min(5, { message: "El número de identificación debe tener al menos 5 caracteres." }),
  gender: z.string({ required_error: "Por favor, selecciona un género." }),
  birthDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: "Por favor, introduce una fecha válida.",
  }),
});

const step2Schema = z.object({
  phone: z.string().min(7, { message: "El teléfono debe tener al menos 7 dígitos." }).regex(/^\+?[0-9\s-]{7,20}$/, { message: "Número de teléfono inválido." }),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  city: z.string().min(2, { message: "La ciudad debe tener al menos 2 caracteres." }),
  country: z.string().min(2, { message: "El país debe tener al menos 2 caracteres." }),
  correoPersonal: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  correoInstitucional: z.string().email().optional(),
});

const step3Schema = z.object({
  program: z.string({ required_error: "Por favor, selecciona una carrera." }),
  periodoIngreso: z.string({ required_error: "Por favor, selecciona un periodo de ingreso." }),
  jornada: z.string().optional(),
});

const step4Schema = z.object({
  usuario: z.string().min(4, { message: "El usuario debe tener al menos 4 caracteres." }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

const step5Schema = z.object({
  metodoPago: z.string({ required_error: "Por favor, selecciona un método de pago." }),
  estadoPago: z.string({ required_error: "Por favor, selecciona el estado del pago." }),
});

const step6Schema = z.object({
  document: z.any().refine(file => file?.length == 1, 'Se requiere el documento de identidad.'),
  transcript: z.any().refine(file => file?.length == 1, 'Se requiere el certificado de notas.'),
});

const allStepsSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
  ...step5Schema.shape,
  ...step6Schema.shape,
});

type AllStepsData = z.infer<typeof allStepsSchema>;


export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;
  const { toast } = useToast();
  const router = useRouter();

  const steps = [
    { number: 1, title: "Datos Personales", icon: User, schema: step1Schema },
    { number: 2, title: "Datos de Contacto", icon: Phone, schema: step2Schema },
    { number: 3, title: "Datos Académicos", icon: BookOpen, schema: step3Schema },
    { number: 4, title: "Datos de Acceso", icon: KeyRound, schema: step4Schema },
    { number: 5, title: "Datos de Inscripción", icon: CreditCard, schema: step5Schema },
    { number: 6, title: "Documentos", icon: FileText, schema: step6Schema },
    { number: 7, title: "Confirmación", icon: CheckCircle, schema: z.object({}) },
  ];

  const methods = useForm<AllStepsData>({
    mode: "onChange",
    defaultValues: {
      firstName: "",
      segundoNombre: "",
      lastName: "",
      segundoApellido: "",
      tipoIdentificacion: undefined,
      numeroIdentificacion: "",
      gender: undefined,
      birthDate: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      correoPersonal: "",
      correoInstitucional: "",
      program: undefined,
      periodoIngreso: undefined,
      jornada: undefined,
      usuario: "",
      password: "",
      confirmPassword: "",
      metodoPago: undefined,
      estadoPago: undefined,
      document: undefined,
      transcript: undefined,
    },
  });

  const { handleSubmit, getValues, setError, clearErrors } = methods;

  const CurrentStepIcon = steps[currentStep - 1].icon;

  const nextStep = async () => {
    if (currentStep >= totalSteps) {
        return;
    }
    const currentSchema = steps[currentStep - 1].schema;
    
    // Manually clear previous errors for the current step's fields
    if ((currentSchema as z.ZodObject<any>).shape) {
      const fields = Object.keys((currentSchema as z.ZodObject<any>).shape);
      fields.forEach(field => clearErrors(field as keyof AllStepsData));
    }
  
    const fieldValues = getValues();
    const result = await currentSchema.safeParseAsync(fieldValues);
  
    if (result.success) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      result.error.errors.forEach((err) => {
        setError(err.path[0] as any, {
          type: "manual",
          message: err.message,
        });
      });
    }
  };
  

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: AllStepsData) => {
    try {
      const auth = getAuth(app);
      await createUserWithEmailAndPassword(auth, data.correoPersonal, data.password);
      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada. Serás redirigido.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description:
          error.code === "auth/email-already-in-use"
            ? "El correo electrónico ya está en uso."
            : "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
      });
    }
  };
  
  const handleFinalSubmit = async () => {
    const result = await allStepsSchema.safeParseAsync(getValues());
    if (result.success) {
      onSubmit(result.data);
    } else {
       toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "Por favor, revisa todos los pasos y corrige los errores.",
      });
      result.error.errors.forEach((err) => {
        const fieldName = err.path[0] as keyof AllStepsData;
        setError(fieldName, {
          type: "manual",
          message: err.message,
        });
      });
    }
  }


  const progress = (currentStep / totalSteps) * 100;

  return (
    <FormProvider {...methods}>
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
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="p-6">
              <div className="mb-6 space-y-4">
                  <Progress value={progress} className="w-full h-2 bg-gray-200" />
                  <div className="flex items-center justify-center gap-2 text-lg font-semibold text-[#004aad]">
                      <CurrentStepIcon className="h-6 w-6"/>
                      <span>Paso {currentStep}: {steps[currentStep - 1].title}</span>
                  </div>
              </div>
              
                {currentStep === 1 && <Step1 />}
                {currentStep === 2 && <Step2 />}
                {currentStep === 3 && <Step3 />}
                {currentStep === 4 && <Step4 />}
                {currentStep === 5 && <Step5 />}
                {currentStep === 6 && <Step6 />}
                {currentStep === 7 && <Step7 />}
            </CardContent>
            <CardFooter className="flex justify-between p-6 bg-gray-50 rounded-b-xl">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="rounded-full px-6 py-3"
              >
                Anterior
              </Button>
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="rounded-full bg-[#004aad] px-6 py-3 text-white transition-transform hover:scale-105 hover:bg-blue-700"
                >
                  Siguiente
                </Button>
              ) : (
                <Button type="button" onClick={handleFinalSubmit} className="rounded-full bg-[#2ecc71] px-6 py-3 text-white shadow-lg transition-transform hover:scale-105 hover:bg-green-600">
                  Finalizar Registro
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </FormProvider>
  );
}


const Step1 = () => {
  const { control } = useFormContext();
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <FormField control={control} name="firstName" render={({ field }) => (
          <FormItem>
            <FormLabel>Primer Nombre</FormLabel>
            <FormControl>
              <Input placeholder="John" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
       <FormField control={control} name="segundoNombre" render={({ field }) => (
          <FormItem>
            <FormLabel>Segundo Nombre (Opcional)</FormLabel>
            <FormControl>
              <Input placeholder="Fitzgerald" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="lastName" render={({ field }) => (
          <FormItem>
            <FormLabel>Primer Apellido</FormLabel>
            <FormControl>
              <Input placeholder="Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="segundoApellido" render={({ field }) => (
          <FormItem>
            <FormLabel>Segundo Apellido</FormLabel>
            <FormControl>
              <Input placeholder="Smith" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
       <FormField control={control} name="tipoIdentificacion" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Identificación</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="cc">Cédula de Ciudadanía</SelectItem>
                <SelectItem value="ti">Tarjeta de Identidad</SelectItem>
                <SelectItem value="ce">Cédula de Extranjería</SelectItem>
                <SelectItem value="passport">Pasaporte</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
       <FormField control={control} name="numeroIdentificacion" render={({ field }) => (
          <FormItem>
            <FormLabel>Número de Identificación</FormLabel>
            <FormControl>
              <Input placeholder="123456789" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="birthDate" render={({ field }) => (
          <FormItem>
            <FormLabel>Fecha de Nacimiento</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="gender" render={({ field }) => (
          <FormItem>
            <FormLabel>Género</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu género" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Femenino</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

const Step2 = () => {
  const { control } = useFormContext();
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <FormField control={control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Teléfono / Celular</FormLabel>
            <FormControl>
              <Input placeholder="+57 300 123 4567" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="address" render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Dirección de Residencia</FormLabel>
            <FormControl>
              <Input placeholder="Calle 123 #45-67, Apto 101" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="city" render={({ field }) => (
          <FormItem>
            <FormLabel>Ciudad</FormLabel>
            <FormControl>
              <Input placeholder="Bogotá D.C." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="country" render={({ field }) => (
          <FormItem>
            <FormLabel>País</FormLabel>
            <FormControl>
              <Input placeholder="Colombia" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="correoPersonal" render={({ field }) => (
          <FormItem>
            <FormLabel>Correo Personal</FormLabel>
            <FormControl>
              <Input type="email" placeholder="tu.correo@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="correoInstitucional" render={({ field }) => (
          <FormItem>
            <FormLabel>Correo Institucional (Opcional)</FormLabel>
            <FormControl>
              <Input type="email" placeholder="nombre.apellido@pol.edu.co" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

const Step3 = () => {
  const { control } = useFormContext();
  return (
    <div className="space-y-6">
      <FormField control={control} name="program" render={({ field }) => (
          <FormItem>
            <FormLabel>Carrera</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una carrera" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="adm">Administración de Empresas</SelectItem>
                <SelectItem value="cont">Contaduría Pública</SelectItem>
                <SelectItem value="mkt">Mercadeo y Publicidad</SelectItem>
                <SelectItem value="sis">Ingeniería de Sistemas</SelectItem>
                <SelectItem value="gastro">Gastronomía</SelectItem>
                <SelectItem value="tur">Hotelería y Turismo</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
       <FormField control={control} name="periodoIngreso" render={({ field }) => (
          <FormItem>
            <FormLabel>Periodo Académico de Ingreso</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un periodo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="2024-1">2024 - 1</SelectItem>
                <SelectItem value="2024-2">2024 - 2</SelectItem>
                <SelectItem value="2025-1">2025 - 1</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="jornada" render={({ field }) => (
          <FormItem>
            <FormLabel>Jornada (Opcional)</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una jornada" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="diurna">Diurna</SelectItem>
                <SelectItem value="nocturna">Nocturna</SelectItem>
                <SelectItem value="findesemana">Fin de Semana</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

const Step4 = () => {
  const { control, watch } = useFormContext();
  const numeroIdentificacion = watch('numeroIdentificacion');
  
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <FormField control={control} name="usuario" render={({ field }) => (
          <FormItem>
            <FormLabel>Usuario</FormLabel>
            <FormControl>
              <Input placeholder="Tu usuario" {...field} defaultValue={numeroIdentificacion} />
            </FormControl>
             <p className="text-xs text-muted-foreground">Sugerido: {numeroIdentificacion}</p>
            <FormMessage />
          </FormItem>
        )}
      />
       <div></div>
      <FormField control={control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Contraseña</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="confirmPassword" render={({ field }) => (
          <FormItem>
            <FormLabel>Confirmar Contraseña</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

const Step5 = () => {
  const { control } = useFormContext();
  return (
    <div className="space-y-6">
      <FormField control={control} name="metodoPago" render={({ field }) => (
          <FormItem>
            <FormLabel>Método de Pago</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un método de pago" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="pse">PSE</SelectItem>
                <SelectItem value="tc">Tarjeta de Crédito</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="space-y-2">
        <Label>Valor de la Inscripción</Label>
        <Input value="$150,000 COP" disabled className="bg-gray-100"/>
        <p className="text-xs text-muted-foreground">Valor fijo autocalculado por el sistema.</p>
      </div>
      <FormField control={control} name="estadoPago" render={({ field }) => (
          <FormItem>
            <FormLabel>Estado del Pago</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado del pago" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

const Step6 = () => {
  const { control } = useFormContext();
  return (
      <div className="space-y-4">
          <FormField control={control} name="document" render={({ field: { onChange, value, ...rest }}) => (
              <FormItem>
                  <FormLabel>Copia del Documento de Identidad</FormLabel>
                  <FormControl>
                      <Input type="file" onChange={(e) => onChange(e.target.files)} {...rest} className="file:text-gray-600 file:font-poppins" />
                  </FormControl>
                  <FormMessage />
              </FormItem>
          )} />
          <FormField control={control} name="transcript" render={({ field: { onChange, value, ...rest } }) => (
              <FormItem>
                  <FormLabel>Certificado de Notas</FormLabel>
                   <FormControl>
                      <Input type="file" onChange={(e) => onChange(e.target.files)} {...rest} className="file:text-gray-600 file:font-poppins" />
                  </FormControl>
                  <FormMessage />
              </FormItem>
          )} />
      </div>
  );
}

const Step7 = () => (
    <div className="text-center flex flex-col items-center gap-4 py-8">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h3 className="text-2xl font-bold font-poppins text-gray-800">¡Todo listo!</h3>
        <p className="text-gray-600">Revisa que toda tu información sea correcta antes de finalizar.</p>
    </div>
);

    