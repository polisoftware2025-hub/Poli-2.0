
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Users,
  ListChecks,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useForm, FormProvider, useFormContext, useWatch } from "react-hook-form";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { carreraData as staticCarreraData } from "@/lib/seed";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const nameValidation = z.string().min(2, "Debe tener al menos 2 caracteres.").max(50, "Máximo 50 caracteres.").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios.");
const lastNameValidation = z.string().min(2, "Debe tener al menos 2 caracteres.").max(50, "Máximo 50 caracteres.").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios.");
const cityCountryValidation = z.string({ required_error: "Por favor, selecciona una opción." }).min(2, "Debe tener al menos 2 caracteres");


const step1Schema = z.object({
  firstName: nameValidation,
  segundoNombre: z.string().max(50, "Máximo 50 caracteres.").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, "Solo se permiten letras y espacios.").optional().transform(e => e === "" ? undefined : e),
  lastName: lastNameValidation,
  segundoApellido: lastNameValidation,
  tipoIdentificacion: z.string({ required_error: "Por favor, selecciona un tipo de identificación." }),
  numeroIdentificacion: z.string().min(1, "El número de identificación es obligatorio.").max(15, "El número de identificación no puede tener más de 15 caracteres.").refine(val => !/\s/.test(val), { message: "No se permiten espacios." }),
  gender: z.string({ required_error: "Por favor, selecciona un género." }),
  birthDate: z.date({ required_error: "Por favor, introduce una fecha válida." }),
});

const step2Schema = z.object({
  phone: z.string().regex(/^\d{7,15}$/, "Debe ser un número de teléfono válido entre 7 y 15 dígitos."),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres.")
    .regex(/^[a-zA-Z0-9\s#.,-]+$/, "La dirección contiene caracteres inválidos.")
    .refine(val => !/^[#.,-]/.test(val), { message: "La dirección no puede empezar con un carácter especial." })
    .refine(val => val.includes('#'), { message: "La dirección debe contener el símbolo '#' para indicar el número." })
    .refine(val => !/\s{2,}/.test(val), { message: "No se permiten múltiples espacios consecutivos." }),
  country: cityCountryValidation,
  city: cityCountryValidation,
  correoPersonal: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
});

const step3Schema = z.object({
  program: z.string({ required_error: "Por favor, selecciona una carrera." }),
  ciclo: z.string({ required_error: "Por favor, selecciona un ciclo." }),
  grupo: z.string({ required_error: "Por favor, selecciona un grupo." }),
  jornada: z.string({ required_error: "Por favor, selecciona una jornada." }),
});

const step4Object = z.object({
  selectedSubjects: z.array(z.any()).refine(value => value.length > 0, {
    message: 'Debes seleccionar al menos una materia.'
  })
});

const step4Schema_materias = step4Object.refine((data) => {
    const totalCredits = data.selectedSubjects.reduce((acc, subject) => acc + subject.creditos, 0);
    return totalCredits === 10;
}, {
    message: 'La suma de créditos debe ser exactamente 10.',
    path: ['selectedSubjects'],
});


const step5Object = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres.")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula.")
    .regex(/[a-z]/, "Debe contener al menos una minúscula.")
    .regex(/[0-9]/, "Debe contener al menos un número.")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial."),
  confirmPassword: z.string(),
});

const step5Schema = step5Object.refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});


const step6Schema = z.object({
  metodoPago: z.string({ required_error: "Por favor, selecciona un método de pago." }),
});

const step7Schema = z.object({});


const allStepsSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Object.shape,
  ...step5Schema.shape,
  ...step6Schema.shape
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type AllStepsData = z.infer<typeof allStepsSchema>;

const steps = [
    { number: 1, title: "Datos Personales", icon: User, schema: step1Schema, fields: Object.keys(step1Schema.shape) as (keyof AllStepsData)[] },
    { number: 2, title: "Datos de Contacto", icon: Phone, schema: step2Schema, fields: Object.keys(step2Schema.shape) as (keyof AllStepsData)[] },
    { number: 3, title: "Inscripción Académica", icon: BookOpen, schema: step3Schema, fields: Object.keys(step3Schema.shape) as (keyof AllStepsData)[] },
    { number: 4, title: "Selección de Materias", icon: ListChecks, schema: step4Schema_materias, fields: Object.keys(step4Object.shape) as (keyof AllStepsData)[] },
    { number: 5, title: "Datos de Acceso", icon: KeyRound, schema: step5Schema, fields: Object.keys(step5Object.shape) as (keyof AllStepsData)[] },
    { number: 6, title: "Datos de Inscripción", icon: CreditCard, schema: step6Schema, fields: Object.keys(step6Schema.shape) as (keyof AllStepsData)[] },
    { number: 7, title: "Confirmación", icon: CheckCircle, schema: step7Schema, fields: [] },
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;
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
      city: undefined,
      country: undefined,
      correoPersonal: "",
      program: undefined,
      ciclo: undefined,
      grupo: undefined,
      jornada: undefined,
      selectedSubjects: [],
      password: "",
      confirmPassword: "",
      metodoPago: undefined,
    },
  });

  const { getValues, setError, trigger, watch, formState: { isSubmitting } } = methods;
  
  const selectedCiclo = watch("ciclo");
  const cycleHasElectives = useMemo(() => {
    if (!selectedCiclo) return false;
    const cicloData = staticCarreraData.ciclos.find(c => c.numero.toString() === selectedCiclo);
    if (!cicloData) return false;
    return cicloData.materias.some(m => m.nombre.toLowerCase().includes('electiva'));
  }, [selectedCiclo]);


  const nextStep = async () => {
    const fields = steps[currentStep - 1].fields;

    // Skip subject selection if cycle has no electives
    if (currentStep === 3) {
      const isValid = await trigger(fields as any, { shouldFocus: true });
      if (isValid) {
        if (!cycleHasElectives) {
          // If no electives, auto-populate subjects and skip to next step
          const cicloData = staticCarreraData.ciclos.find(c => c.numero.toString() === getValues("ciclo"));
          if (cicloData) {
            methods.setValue("selectedSubjects", cicloData.materias);
          }
          setCurrentStep(5); // Skip to step 5
        } else {
          setCurrentStep(4);
        }
      }
      return;
    }
    
    if (fields.length === 0) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
      return;
    }
    const isValid = await trigger(fields as any, { shouldFocus: true });
  
    if (isValid) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };
  

  const prevStep = () => {
    if (currentStep > 1) {
      // If we are on step 5 and the previous cycle had no electives, go back to step 3
      if(currentStep === 5 && !cycleHasElectives) {
        setCurrentStep(3);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };
  
  const handleFinalSubmit = async () => {
    const allData = getValues();
    const result = await allStepsSchema.safeParseAsync(allData);

    if (result.success) {
      try {
        const response = await fetch('/api/register-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...result.data,
            birthDate: format(result.data.birthDate, 'yyyy-MM-dd')
          }),
        });

        const responseData = await response.json();

        if (response.ok) {
          toast({
            title: "¡Registro exitoso!",
            description: responseData.message,
          });

          localStorage.setItem('userEmail', responseData.correoInstitucional);
          localStorage.setItem('userRole', 'estudiante');
          router.push("/dashboard");
        } else {
          toast({
            variant: "destructive",
            title: "Error en el registro",
            description: responseData.message || "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
          });
        }
      } catch (error: any) {
        console.error("Error during registration: ", error);
        toast({
          variant: "destructive",
          title: "Error en el registro",
          description: "Ha ocurrido un error de red. Por favor, inténtalo de nuevo.",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "Por favor, revisa todos los pasos y corrige los errores.",
      });
      // Find the first step with an error and navigate to it
      for (const step of steps) {
        const hasError = step.fields.some(field => result.error.formErrors.fieldErrors[field]);
        if (hasError) {
          setCurrentStep(step.number);
          break;
        }
      }
    }
  };


  const progress = (currentStep / totalSteps) * 100;

  const CurrentStepIcon = steps[currentStep - 1].icon;

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
                {currentStep === 4 && <Step4_Materias />}
                {currentStep === 5 && <Step5_Access />}
                {currentStep === 6 && <Step6_Payment />}
                {currentStep === 7 && <Step7_Confirm />}
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
                <Button type="button" onClick={handleFinalSubmit} disabled={isSubmitting} className="rounded-full bg-[#2ecc71] px-6 py-3 text-white shadow-lg transition-transform hover:scale-105 hover:bg-green-600">
                  {isSubmitting ? "Finalizando..." : "Finalizar Registro"}
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
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

const locations = {
  "Colombia": ["Bogotá", "Medellín", "Cali", "Barranquilla"],
  "España": ["Madrid", "Barcelona", "Valencia", "Sevilla"],
  "México": ["Ciudad de México", "Guadalajara", "Monterrey"],
};

const Step2 = () => {
  const { control, setValue } = useFormContext();
  const selectedCountry = useWatch({ control, name: "country" });

  const countries = Object.keys(locations);
  const cities = selectedCountry ? locations[selectedCountry as keyof typeof locations] : [];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <FormField control={control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Teléfono / Celular</FormLabel>
            <FormControl>
              <Input placeholder="3001234567" {...field} />
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
      <FormField control={control} name="country" render={({ field }) => (
        <FormItem>
          <FormLabel>País</FormLabel>
          <Select onValueChange={(value) => {
            field.onChange(value);
            setValue("city", "", { shouldValidate: true });
          }} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un país" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {countries.map(country => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={control} name="city" render={({ field }) => (
        <FormItem>
          <FormLabel>Ciudad</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCountry}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={selectedCountry ? "Selecciona una ciudad" : "Selecciona un país primero"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {cities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />
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

interface Carrera {
    id: string;
    nombre: string;
    ciclos?: { numero: number; materias: any[] }[];
}

const Step3 = () => {
    const { control, setValue } = useFormContext();
    const [carreras, setCarreras] = useState<Carrera[]>([]);
    const [ciclos, setCiclos] = useState<{ numero: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const selectedProgramId = useWatch({ control, name: "program" });

    useEffect(() => {
        const fetchCarreras = async () => {
            setIsLoading(true);
            try {
                // Simulating fetch with static data
                const fetchedCarreras = [{
                  id: "TCNI01", // Example ID
                  ...staticCarreraData
                }];
                setCarreras(fetchedCarreras as any);
            } catch (error) {
                console.error("Error fetching carreras:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCarreras();
    }, []);

    useEffect(() => {
      if (selectedProgramId) {
          const selectedCarrera = carreras.find(c => c.id === selectedProgramId);
          setCiclos(selectedCarrera?.ciclos || []);
          setValue("ciclo", undefined, { shouldValidate: true });
      } else {
          setCiclos([]);
      }
    }, [selectedProgramId, carreras, setValue]);

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="program"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Carrera</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Cargando carreras..." : "Selecciona una carrera"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {carreras.map(carrera => (
                    <SelectItem key={carrera.id} value={carrera.id}>{carrera.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

       <FormField
        control={control}
        name="ciclo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ciclo Académico</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedProgramId || ciclos.length === 0}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={!selectedProgramId ? "Selecciona una carrera primero" : "Selecciona un ciclo"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ciclos.map(ciclo => (
                    <SelectItem key={ciclo.numero} value={ciclo.numero.toString()}>Ciclo {ciclo.numero}</SelectItem>
                ))}
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
          <FormItem className="space-y-3">
            <FormLabel>Jornada y Modalidad</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-1"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl><RadioGroupItem value="diurna_presencial" /></FormControl>
                  <FormLabel className="font-normal">Diurna - Presencial</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl><RadioGroupItem value="nocturna_virtual" /></FormControl>
                  <FormLabel className="font-normal">Nocturna - Virtual</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl><RadioGroupItem value="especial_findesemana" /></FormControl>
                  <FormLabel className="font-normal">Especial - Fin de semana</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="grupo"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Grupo</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-1"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl><RadioGroupItem value="grupo1" /></FormControl>
                  <FormLabel className="font-normal">Grupo 1</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl><RadioGroupItem value="grupo2" /></FormControl>
                  <FormLabel className="font-normal">Grupo 2</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

const Step4_Materias = () => {
    const { control, watch, setValue, formState: { errors } } = useFormContext<AllStepsData>();
    const selectedCiclo = watch("ciclo");
    const selectedSubjects = watch("selectedSubjects") || [];

    const { mandatory, electives } = useMemo(() => {
        if (!selectedCiclo) return { mandatory: [], electives: [] };
        const cycleData = staticCarreraData.ciclos.find(c => c.numero.toString() === selectedCiclo);
        if (!cycleData) return { mandatory: [], electives: [] };

        const mandatory = cycleData.materias.filter(m => !m.nombre.toLowerCase().includes('electiva'));
        const electives = cycleData.materias.filter(m => m.nombre.toLowerCase().includes('electiva'));
        return { mandatory, electives };
    }, [selectedCiclo]);
    
    useEffect(() => {
        // Automatically set mandatory subjects
        setValue("selectedSubjects", mandatory, { shouldValidate: true });
    }, [mandatory, setValue]);
    
    const totalCredits = useMemo(() => {
        return selectedSubjects.reduce((acc, subject) => acc + subject.creditos, 0);
    }, [selectedSubjects]);

    const handleElectiveChange = (subject: any, checked: boolean) => {
        const currentSelection = watch("selectedSubjects") || [];
        let newSelection;
        if (checked) {
            newSelection = [...currentSelection, subject];
        } else {
            newSelection = currentSelection.filter(s => s.id !== subject.id);
        }
        setValue("selectedSubjects", newSelection, { shouldValidate: true });
    };

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold text-lg mb-2">Materias Obligatorias</h4>
                <div className="space-y-2 rounded-md border p-4">
                    {mandatory.length > 0 ? mandatory.map(subject => (
                        <div key={subject.id} className="flex justify-between items-center">
                            <span>{subject.nombre}</span>
                            <span className="font-semibold">{subject.creditos} créditos</span>
                        </div>
                    )) : <p className="text-muted-foreground">No hay materias obligatorias para este ciclo.</p>}
                </div>
            </div>

            {electives.length > 0 && (
                <div>
                    <h4 className="font-semibold text-lg mb-2">Materias Electivas</h4>
                    <div className="space-y-2 rounded-md border p-4">
                        {electives.map(subject => (
                            <div key={subject.id} className="flex items-center space-x-3">
                                <Checkbox
                                    id={subject.id}
                                    onCheckedChange={(checked) => handleElectiveChange(subject, !!checked)}
                                    checked={selectedSubjects.some(s => s.id === subject.id)}
                                />
                                <label htmlFor={subject.id} className="flex-1 flex justify-between items-center cursor-pointer">
                                    <span>{subject.nombre}</span>
                                    <span className="font-semibold">{subject.creditos} créditos</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <Alert variant={totalCredits === 10 ? "default" : "destructive"} className={totalCredits === 10 ? 'border-green-500' : ''}>
                <AlertTitle className="font-bold">Créditos Seleccionados</AlertTitle>
                <AlertDescription>
                    Total de créditos: {totalCredits} / 10. Debes seleccionar exactamente 10 créditos para continuar.
                </AlertDescription>
            </Alert>
             {errors.selectedSubjects && <p className="text-sm font-medium text-destructive">{(errors.selectedSubjects as any).message}</p>}
        </div>
    );
};


const Step5_Access = () => {
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

const Step6_Payment = () => {
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
  );
};

const Step7_Confirm = () => (
    <div className="text-center flex flex-col items-center gap-4 py-8">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h3 className="text-2xl font-bold font-poppins text-gray-800">¡Todo listo!</h3>
        <p className="text-gray-600">Revisa que toda tu información sea correcta antes de finalizar.</p>
    </div>
);
