
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
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

// Shared validation schemas
const nameValidation = z.string().min(2, "Debe tener al menos 2 caracteres.").max(50, "Máximo 50 caracteres.").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios.");
const lastNameValidation = z.string().min(2, "Debe tener al menos 2 caracteres.").max(50, "Máximo 50 caracteres.").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios.");
const cityCountryValidation = z.string({ required_error: "Por favor, selecciona una opción." }).min(2, "Debe tener al menos 2 caracteres");

// Schemas for each step
const step1Schema = z.object({
  firstName: nameValidation,
  segundoNombre: z.string().max(50).optional().or(z.literal('')),
  lastName: lastNameValidation,
  segundoApellido: lastNameValidation,
  tipoIdentificacion: z.string({ required_error: "Por favor, selecciona un tipo de identificación." }),
  numeroIdentificacion: z.string().min(1, "El número de identificación es obligatorio.").max(15, "No puede tener más de 15 caracteres.").refine(val => !/\s/.test(val), { message: "No se permiten espacios." }),
  gender: z.string({ required_error: "Por favor, selecciona un género." }),
  birthDate: z.date({ required_error: "Por favor, introduce una fecha válida." }),
});

const step2Schema = z.object({
  phone: z.string().regex(/^\d{7,15}$/, "Debe ser un número de teléfono válido."),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres."),
  country: cityCountryValidation,
  city: cityCountryValidation,
  correoPersonal: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
});

const step3Schema = z.object({
  carreraId: z.string({ required_error: "Por favor, selecciona una carrera." }),
  modalidad: z.string({ required_error: "Por favor, selecciona una modalidad." }),
  grupo: z.string({ required_error: "Por favor, selecciona un grupo." }),
});

const step4Object = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres.")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula.")
    .regex(/[a-z]/, "Debe contener al menos una minúscula.")
    .regex(/[0-9]/, "Debe contener al menos un número.")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial."),
  confirmPassword: z.string(),
});

const step4Schema = step4Object.refine((data) => data.password === data.confirmPassword, {
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
});

type AllStepsData = z.infer<typeof allStepsSchema>;

const steps = [
    { number: 1, title: "Datos Personales", icon: User, schema: step1Schema, fields: Object.keys(step1Schema.shape) as (keyof AllStepsData)[] },
    { number: 2, title: "Datos de Contacto", icon: Phone, schema: step2Schema, fields: Object.keys(step2Schema.shape) as (keyof AllStepsData)[] },
    { number: 3, title: "Inscripción Académica", icon: BookOpen, schema: step3Schema, fields: Object.keys(step3Schema.shape) as (keyof AllStepsData)[] },
    { number: 4, title: "Datos de Acceso", icon: KeyRound, schema: step4Schema, fields: Object.keys(step4Object.shape) as (keyof AllStepsData)[] },
    { number: 5, title: "Datos de Inscripción", icon: CreditCard, schema: step5Schema, fields: Object.keys(step5Schema.shape) as (keyof AllStepsData)[] },
    { number: 6, title: "Confirmación", icon: CheckCircle, schema: step6Schema, fields: [] },
];

const LOCAL_STORAGE_KEY = 'registrationFormData';

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
        tipoIdentificacion: "",
        numeroIdentificacion: "",
        gender: "",
        birthDate: undefined,
        phone: "",
        address: "",
        country: "",
        city: "",
        correoPersonal: "",
        carreraId: "",
        modalidad: "",
        grupo: "",
        password: "",
        confirmPassword: "",
        metodoPago: "",
    },
  });

  const { handleSubmit, trigger, formState: { isSubmitting }, watch, reset } = methods;

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      try {
        const { formData, currentStep: savedStep } = JSON.parse(savedData);
        if (formData) {
            // Ensure date fields are correctly parsed back into Date objects
            if (formData.birthDate) {
              formData.birthDate = new Date(formData.birthDate);
            }
            reset(formData, { keepDefaultValues: true });
        }
        if (savedStep && typeof savedStep === 'number' && savedStep <= totalSteps) {
            setCurrentStep(savedStep);
        }
      } catch (e) {
        console.error("Failed to parse registration data from localStorage", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, [reset]);


  // Watch for form changes and save to localStorage
  useEffect(() => {
    const subscription = watch((value) => {
      try {
        const dataToSave = {
          formData: value,
          currentStep: currentStep
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (e) {
        console.error("Failed to save registration data to localStorage", e);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, currentStep]);

  const nextStep = async () => {
    const fields = steps[currentStep - 1].fields;
    
    const isValid = fields.length > 0 
      ? await trigger(fields, { shouldFocus: true }) 
      : true;
  
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
  
  const processSubmit = async (data: AllStepsData) => {
      try {
        const response = await fetch('/api/register-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (response.ok) {
          toast({
            title: "¡Solicitud de registro enviada!",
            description: responseData.message,
          });
          localStorage.removeItem(LOCAL_STORAGE_KEY); // Clean up on success
          router.push("/register/pending"); 
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
          title: "Error de conexión",
          description: "No se pudo comunicar con el servidor. Por favor, inténtalo de nuevo más tarde.",
        });
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
            <form onSubmit={handleSubmit(processSubmit)}>
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
                    {currentStep === 4 && <Step4_Access />}
                    {currentStep === 5 && <Step5_Payment />}
                    {currentStep === 6 && <Step6_Confirm />}
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
                    <Button type="submit" disabled={isSubmitting} className="rounded-full bg-[#2ecc71] px-6 py-3 text-white shadow-lg transition-transform hover:scale-105 hover:bg-green-600">
                      {isSubmitting ? "Finalizando..." : "Finalizar Registro"}
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
}
interface Grupo {
    id: string;
    codigoGrupo: string;
}

const Step3 = () => {
    const { control } = useFormContext();
    const [carreras, setCarreras] = useState<Carrera[]>([]);
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const carrerasSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
                const fetchedCarreras = carrerasSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));
                setCarreras(fetchedCarreras);

                const gruposSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"));
                const fetchedGrupos = gruposSnapshot.docs.map(doc => ({ id: doc.id, codigoGrupo: doc.data().codigoGrupo }));
                setGrupos(fetchedGrupos);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="carreraId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Carrera</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Cargando..." : "Selecciona una carrera"} />
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
        name="modalidad"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Modalidad</FormLabel>
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
          <FormItem>
            <FormLabel>Grupo</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Cargando..." : "Selecciona un grupo"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {grupos.map(grupo => (
                    <SelectItem key={grupo.id} value={grupo.id}>{grupo.codigoGrupo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

const Step4_Access = () => {
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

const Step5_Payment = () => {
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
        <FormLabel>Valor de la Inscripción</FormLabel>
        <Input value="$150,000 COP" disabled className="bg-gray-100"/>
        <p className="text-xs text-muted-foreground">Valor fijo autocalculado por el sistema.</p>
      </div>
    </div>
  );
};

const Step6_Confirm = () => (
    <div className="text-center flex flex-col items-center gap-4 py-8">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h3 className="text-2xl font-bold font-poppins text-gray-800">¡Todo listo!</h3>
        <p className="text-gray-600">Revisa que toda tu información sea correcta antes de finalizar.</p>
        <p className="text-sm text-muted-foreground">Al hacer clic en "Finalizar Registro", tus datos serán enviados para revisión.</p>
    </div>
);
