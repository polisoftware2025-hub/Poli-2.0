
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
  CheckCircle,
  ArrowLeft,
  CreditCard,
  CalendarIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getFirestore, doc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Label } from "@/components/ui/label";


const step1Schema = z.object({
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }).max(50),
  segundoNombre: z.string().optional(),
  lastName: z.string().min(2, { message: "El primer apellido debe tener al menos 2 caracteres." }),
  segundoApellido: z.string().min(2, { message: "El segundo apellido debe tener al menos 2 caracteres." }),
  tipoIdentificacion: z.string({ required_error: "Por favor, selecciona un tipo de identificación." }),
  numeroIdentificacion: z.string().min(5, { message: "El número de identificación debe tener al menos 5 caracteres." }),
  gender: z.string({ required_error: "Por favor, selecciona un género." }),
  birthDate: z.date({ required_error: "Por favor, introduce una fecha válida." }),
});

const step2Schema = z.object({
  phone: z.string().min(7, { message: "El teléfono debe tener al menos 7 dígitos." }).regex(/^\+?[0-9\s-]{7,20}$/, { message: "Número de teléfono inválido." }),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  city: z.string().min(2, { message: "La ciudad debe tener al menos 2 caracteres." }),
  country: z.string().min(2, { message: "El país debe tener al menos 2 caracteres." }),
  correoPersonal: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
});

const step3Schema = z.object({
  rol: z.string({ required_error: "Por favor, selecciona un rol." }),
  program: z.string({ required_error: "Por favor, selecciona una carrera." }),
  periodoIngreso: z.string({ required_error: "Por favor, selecciona un periodo de ingreso." }),
  jornada: z.string().optional(),
});

const step4Schema = z.object({
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

const step5Schema = z.object({
  metodoPago: z.string({ required_error: "Por favor, selecciona un método de pago." }),
});

const step6Schema = z.object({});


const allStepsSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
  ...step5Schema.shape
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});


type AllStepsData = z.infer<typeof allStepsSchema>;

const steps = [
    { number: 1, title: "Datos Personales", icon: User, schema: step1Schema, fields: Object.keys(step1Schema.shape) as (keyof AllStepsData)[] },
    { number: 2, title: "Datos de Contacto", icon: Phone, schema: step2Schema, fields: Object.keys(step2Schema.shape) as (keyof AllStepsData)[] },
    { number: 3, title: "Datos Académicos", icon: BookOpen, schema: step3Schema, fields: Object.keys(step3Schema.shape) as (keyof AllStepsData)[] },
    { number: 4, title: "Datos de Acceso", icon: KeyRound, schema: step4Schema, fields: ["password", "confirmPassword"] as (keyof AllStepsData)[] },
    { number: 5, title: "Datos de Inscripción", icon: CreditCard, schema: step5Schema, fields: Object.keys(step5Schema.shape) as (keyof AllStepsData)[] },
    { number: 6, title: "Confirmación", icon: CheckCircle, schema: step6Schema, fields: [] },
  ];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const { toast } = useToast();
  const router = useRouter();
  
  const currentSchema = useMemo(() => steps[currentStep - 1].schema, [currentStep]);

  const methods = useForm<AllStepsData>({
    resolver: zodResolver(currentSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      segundoNombre: "",
      lastName: "",
      segundoApellido: "",
      tipoIdentificacion: undefined,
      numeroIdentificacion: "",
      gender: undefined,
      birthDate: undefined,
      phone: "",
      address: "",
      city: "",
      country: "",
      correoPersonal: "",
      rol: "estudiante",
      program: undefined,
      periodoIngreso: undefined,
      jornada: undefined,
      password: "",
      confirmPassword: "",
      metodoPago: undefined,
    },
  });

  const { getValues, setError, trigger } = methods;

  const CurrentStepIcon = steps[currentStep - 1].icon;

  const nextStep = async () => {
    const fields = steps[currentStep - 1].fields;
    if (fields.length === 0) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
      return;
    }
    const isValid = await trigger(fields, { shouldFocus: true });
  
    if (isValid) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };
  

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const tipoIdentificacionMap: { [key: string]: { id: string; descripcion: string } } = {
    'cc': { id: 'cc', descripcion: 'Cédula de Ciudadanía' },
    'ti': { id: 'ti', descripcion: 'Tarjeta de Identidad' },
    'ce': { id: 'ce', descripcion: 'Cédula de Extranjería' },
    'passport': { id: 'passport', descripcion: 'Pasaporte' },
  };

  const handleFinalSubmit = async () => {
    const allData = getValues();
    const result = await allStepsSchema.safeParseAsync(allData);
    
    if (result.success) {
      try {
        const db = getFirestore(app);
        
        const domain = result.data.correoPersonal.split('@')[1];
        const correoInstitucional = `${result.data.firstName.toLowerCase()}.${result.data.lastName.toLowerCase()}@${domain}`;

        const politecnicoDocRef = doc(db, "Politecnico", " यरਉ");
        
        const usuariosCollectionRef = collection(politecnicoDocRef, "usuarios");
        const newUserDocRef = doc(usuariosCollectionRef);

        const usuarioData = {
          nombre1: result.data.firstName,
          nombre2: result.data.segundoNombre || "",
          apellido1: result.data.lastName,
          apellido2: result.data.segundoApellido,
          tipoIdentificacion: tipoIdentificacionMap[result.data.tipoIdentificacion],
          identificacion: result.data.numeroIdentificacion,
          genero: result.data.gender,
          telefono: result.data.phone,
          direccion: result.data.address,
          ciudad: result.data.city,
          pais: result.data.country,
          correo: result.data.correoPersonal,
          correoInstitucional: correoInstitucional,
          contrasena: "ENCRYPTED", // Placeholder for encrypted password
          rol: { id: "estudiante", descripcion: "Estudiante" },
          estaInscrito: true,
          fechaCreacion: serverTimestamp(),
        };
        
        await setDoc(newUserDocRef, usuarioData);
        
        const estudianteData = {
          usuarioId: newUserDocRef.id,
          estado: 'activo',
          fechaCreacion: serverTimestamp(),
        };

        const estudiantesCollectionRef = collection(politecnicoDocRef, "estudiantes");
        await setDoc(doc(estudiantesCollectionRef, newUserDocRef.id), estudianteData);
        
        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada. Serás redirigido.",
        });
        router.push("/dashboard");
      } catch (error: any) {
        console.error("Error during registration: ", error);
        toast({
          variant: "destructive",
          title: "Error en el registro",
          description: "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
        });
      }
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
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 pt-16 font-roboto sm:p-6">
        <div className="absolute top-4 left-4 z-10">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-all hover:bg-gray-100 hover:shadow-md active:scale-95 sm:px-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
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
              
                {currentStep === 1 && <Step1 />}
                {currentStep === 2 && <Step2 />}
                {currentStep === 3 && <Step3 />}
                {currentStep === 4 && <Step4 />}
                {currentStep === 5 && <Step5 />}
                {currentStep === 6 && <Step6 />}
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
      <FormField
        control={control}
        name="birthDate"
        render={({ field }) => (
          <FormItem className="flex flex-col justify-end">
            <FormLabel>Fecha de Nacimiento</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP", { locale: es })
                    ) : (
                      <span>Selecciona una fecha</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={es}
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="gender" render={({ field }) => (
          <FormItem className="flex flex-col justify-end">
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
          <FormItem>
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
          <FormItem className="md:col-span-2">
            <FormLabel>Correo Personal</FormLabel>
            <FormControl>
              <Input type="email" placeholder="tu.correo@example.com" {...field} />
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
      <FormField
        control={control}
        name="rol"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rol</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="estudiante">Estudiante</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="program"
        render={({ field }) => (
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

      <FormField
        control={control}
        name="periodoIngreso"
        render={({ field }) => (
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

      <FormField
        control={control}
        name="jornada"
        render={({ field }) => (
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
  const { control } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <FormField control={control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Contraseña</FormLabel>
            <div className="relative">
              <FormControl>
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
              </FormControl>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="confirmPassword" render={({ field }) => (
          <FormItem>
            <FormLabel>Confirmar Contraseña</FormLabel>
            <div className="relative">
              <FormControl>
                <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
              </FormControl>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
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
        <Label htmlFor="valorInscripcion">Valor de la Inscripción</Label>
        <Input id="valorInscripcion" value="$150,000 COP" disabled className="bg-gray-100"/>
        <p className="text-xs text-muted-foreground">Valor fijo autocalculado por el sistema.</p>
      </div>
    </div>
  )
}

const Step6 = () => (
    <div className="text-center flex flex-col items-center gap-4 py-8">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h3 className="text-2xl font-bold font-poppins text-gray-800">¡Todo listo!</h3>
        <p className="text-gray-600">Revisa que toda tu información sea correcta antes de finalizar.</p>
    </div>
);

    