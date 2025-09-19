
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
  CalendarIcon,
  Eye,
  EyeOff,
  School,
  Clock,
  Laptop,
  Users as UsersIcon
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useForm, FormProvider, useFormContext, useWatch, FieldValues, Path } from "react-hook-form";
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
import { collection, getDocs, query, where } from "firebase/firestore";
import { validateEmail, validateIdNumber, validateName, validatePassword, validatePhoneNumber, validateRequired, validateSelection, validateConfirmPassword } from "@/lib/validators";

type AllStepsData = {
    firstName: string;
    segundoNombre?: string;
    lastName: string;
    segundoApellido: string;
    tipoIdentificacion: string;
    numeroIdentificacion: string;
    gender: string;
    birthDate: Date;
    phone: string;
    address: string;
    country: string;
    city: string;
    correoPersonal: string;
    sedeId: string;
    carreraId: string;
    modalidad: string;
    jornada: string;
    grupo: string;
    password: string;
    confirmPassword: string;
};


const steps = [
    { number: 1, title: "Datos Personales", icon: User, fields: ["firstName", "segundoNombre", "lastName", "segundoApellido", "tipoIdentificacion", "numeroIdentificacion", "gender", "birthDate"] as Path<AllStepsData>[]},
    { number: 2, title: "Datos de Contacto", icon: Phone, fields: ["phone", "address", "country", "city", "correoPersonal"] as Path<AllStepsData>[] },
    { number: 3, title: "Inscripción Académica", icon: BookOpen, fields: ["sedeId", "carreraId", "modalidad", "jornada", "grupo"] as Path<AllStepsData>[] },
    { number: 4, title: "Datos de Acceso", icon: KeyRound, fields: ["password", "confirmPassword"] as Path<AllStepsData>[] },
    { number: 5, title: "Confirmación", icon: CheckCircle, fields: [] },
];

const LOCAL_STORAGE_KEY = 'registrationFormData';

const defaultFormValues: AllStepsData = {
    firstName: "",
    segundoNombre: "",
    lastName: "",
    segundoApellido: "",
    tipoIdentificacion: "",
    numeroIdentificacion: "",
    gender: "",
    birthDate: undefined as any, // Needs to be undefined for placeholder to work
    phone: "",
    address: "",
    country: "",
    city: "",
    correoPersonal: "",
    sedeId: "",
    carreraId: "",
    modalidad: "",
    jornada: "",
    grupo: "",
    password: "",
    confirmPassword: "",
};


export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const { toast } = useToast();
  const router = useRouter();
  
  const methods = useForm<AllStepsData>({
    mode: "onTouched",
    defaultValues: defaultFormValues,
  });

  const { handleSubmit, formState: { isSubmitting }, watch, reset, trigger } = methods;
  
  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      try {
        const { formData, currentStep: savedStep } = JSON.parse(savedData);
        if (formData) {
            const parsedData = { ...defaultFormValues, ...formData };
            if (parsedData.birthDate) {
              parsedData.birthDate = new Date(parsedData.birthDate);
            }
            reset(parsedData as AllStepsData);
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

  const handleGoBack = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    router.push('/');
  };

  const nextStep = async () => {
    const currentFields = steps[currentStep - 1].fields;
    const isValid = await trigger(currentFields, { shouldFocus: true });
    
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
          localStorage.removeItem(LOCAL_STORAGE_KEY);
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
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-all hover:bg-gray-100 hover:shadow-md active:scale-95 sm:px-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
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
                    {currentStep === 5 && <Step5_Confirm />}
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
      <FormField control={control} name="firstName" rules={{ validate: validateName }} render={({ field }) => (
          <FormItem>
            <FormLabel>Primer Nombre <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input placeholder="John" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
       <FormField control={control} name="segundoNombre" rules={{ validate: (v) => !v || validateName(v) }} render={({ field }) => (
          <FormItem>
            <FormLabel>Segundo Nombre (Opcional)</FormLabel>
            <FormControl>
              <Input placeholder="Fitzgerald" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="lastName" rules={{ validate: validateName }} render={({ field }) => (
          <FormItem>
            <FormLabel>Primer Apellido <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input placeholder="Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="segundoApellido" rules={{ validate: validateName }} render={({ field }) => (
          <FormItem>
            <FormLabel>Segundo Apellido <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input placeholder="Smith" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
       <FormField control={control} name="tipoIdentificacion" rules={{ validate: validateSelection }} render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Identificación <span className="text-destructive">*</span></FormLabel>
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
       <FormField control={control} name="numeroIdentificacion" rules={{ validate: validateIdNumber }} render={({ field }) => (
          <FormItem>
            <FormLabel>Número de Identificación <span className="text-destructive">*</span></FormLabel>
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
        rules={{ validate: (v) => validateRequired(v) }}
        render={({ field }) => (
          <FormItem className="flex flex-col justify-end">
            <FormLabel>Fecha de Nacimiento <span className="text-destructive">*</span></FormLabel>
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
      <FormField control={control} name="gender" rules={{ validate: validateSelection }} render={({ field }) => (
          <FormItem className="flex flex-col justify-end">
            <FormLabel>Género <span className="text-destructive">*</span></FormLabel>
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
      <FormField control={control} name="phone" rules={{ validate: validatePhoneNumber }} render={({ field }) => (
          <FormItem>
            <FormLabel>Teléfono / Celular <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input placeholder="3001234567" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="address" rules={{ validate: validateRequired }} render={({ field }) => (
          <FormItem>
            <FormLabel>Dirección de Residencia <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input placeholder="Calle 123 #45-67, Apto 101" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField control={control} name="country" rules={{ validate: validateSelection }} render={({ field }) => (
        <FormItem>
          <FormLabel>País <span className="text-destructive">*</span></FormLabel>
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
      <FormField control={control} name="city" rules={{ validate: validateSelection }} render={({ field }) => (
        <FormItem>
          <FormLabel>Ciudad <span className="text-destructive">*</span></FormLabel>
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
      <FormField control={control} name="correoPersonal" rules={{ validate: validateEmail }} render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Correo Personal <span className="text-destructive">*</span></FormLabel>
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
interface Sede {
    id: string;
    nombre: string;
}
interface Grupo {
    id: string;
    codigoGrupo: string;
}

const Step3 = () => {
    const { control, setValue } = useFormContext();
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [carreras, setCarreras] = useState<Carrera[]>([]);
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [isLoading, setIsLoading] = useState({ sedes: true, carreras: true, grupos: false });

    const selectedSede = useWatch({ control, name: "sedeId" });
    const selectedCarrera = useWatch({ control, name: "carreraId" });

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(prev => ({...prev, sedes: true, carreras: true}));
            try {
                const sedesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes"));
                setSedes(sedesSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));

                const carrerasSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
                setCarreras(carrerasSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));
            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setIsLoading(prev => ({...prev, sedes: false, carreras: false}));
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedSede || !selectedCarrera) {
            setGrupos([]);
            return;
        }

        const fetchGrupos = async () => {
            setIsLoading(prev => ({ ...prev, grupos: true }));
            try {
                const q = query(
                    collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"),
                    where("idSede", "==", selectedSede),
                    where("idCarrera", "==", selectedCarrera)
                );
                const gruposSnapshot = await getDocs(q);
                setGrupos(gruposSnapshot.docs.map(doc => ({ id: doc.id, codigoGrupo: doc.data().codigoGrupo })));
            } catch (error) {
                console.error("Error fetching grupos:", error);
            } finally {
                setIsLoading(prev => ({ ...prev, grupos: false }));
            }
        };
        
        fetchGrupos();
    }, [selectedSede, selectedCarrera]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField control={control} name="sedeId" rules={{ validate: validateSelection }} render={({ field }) => (
            <FormItem>
                <FormLabel>Sede de Interés <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={(value) => { field.onChange(value); setValue("carreraId", "", { shouldValidate: true }); setValue("grupo", "", { shouldValidate: true }); }} defaultValue={field.value} disabled={isLoading.sedes}>
                <FormControl>
                    <SelectTrigger><div className="flex items-center gap-2"><School className="h-4 w-4" /><SelectValue placeholder={isLoading.sedes ? "Cargando..." : "Selecciona una sede"} /></div></SelectTrigger>
                </FormControl>
                <SelectContent>{sedes.map(sede => <SelectItem key={sede.id} value={sede.id}>{sede.nombre}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField control={control} name="carreraId" rules={{ validate: validateSelection }} render={({ field }) => (
            <FormItem>
                <FormLabel>Carrera <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={(value) => { field.onChange(value); setValue("grupo", "", { shouldValidate: true }); }} defaultValue={field.value} disabled={isLoading.carreras || !selectedSede}>
                <FormControl>
                    <SelectTrigger><div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /><SelectValue placeholder={!selectedSede ? "Elige sede" : (isLoading.carreras ? "Cargando..." : "Selecciona una carrera")} /></div></SelectTrigger>
                </FormControl>
                <SelectContent>{carreras.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField control={control} name="modalidad" rules={{ validate: validateSelection }} render={({ field }) => (
            <FormItem>
                <FormLabel>Modalidad <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger><div className="flex items-center gap-2"><Laptop className="h-4 w-4" /><SelectValue placeholder={"Selecciona modalidad"} /></div></SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="Virtual">Virtual</SelectItem>
                    <SelectItem value="Presencial">Presencial</SelectItem>
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField control={control} name="jornada" rules={{ validate: validateSelection }} render={({ field }) => (
            <FormItem>
                <FormLabel>Jornada <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger><div className="flex items-center gap-2"><Clock className="h-4 w-4" /><SelectValue placeholder={"Selecciona jornada"} /></div></SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="Diurna">Diurna</SelectItem>
                    <SelectItem value="Nocturna">Nocturna</SelectItem>
                    <SelectItem value="Especial">Especial</SelectItem>
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
         <FormField control={control} name="grupo" rules={{ validate: validateSelection }} render={({ field }) => (
            <FormItem className="md:col-span-2">
                <FormLabel>Grupo <span className="text-destructive">*</span></FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading.grupos || !selectedCarrera}>
                    <FormControl>
                        <SelectTrigger><div className="flex items-center gap-2"><UsersIcon className="h-4 w-4" /><SelectValue placeholder={!selectedCarrera ? "Elige carrera" : (isLoading.grupos ? "Cargando..." : "Selecciona un grupo")} /></div></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {grupos.length > 0 ? (
                            grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.codigoGrupo}</SelectItem>)
                        ) : (
                            <SelectItem value="no-groups" disabled>No hay grupos disponibles</SelectItem>
                        )}
                    </SelectContent>
                 </Select>
                <FormMessage />
            </FormItem>
         )} />
      </div>
    </div>
  );
};

const Step4_Access = () => {
  const { control, getValues } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <FormField control={control} name="password" rules={{ validate: validatePassword }} render={({ field }) => (
          <FormItem>
            <FormLabel>Contraseña <span className="text-destructive">*</span></FormLabel>
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
      <FormField control={control} name="confirmPassword" rules={{ validate: (value) => validateConfirmPassword(getValues('password'), value) }} render={({ field }) => (
          <FormItem>
            <FormLabel>Confirmar Contraseña <span className="text-destructive">*</span></FormLabel>
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

const Step5_Confirm = () => (
    <div className="text-center flex flex-col items-center gap-4 py-8">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h3 className="text-2xl font-bold font-poppins text-gray-800">¡Todo listo!</h3>
        <p className="text-gray-600">Revisa que toda tu información sea correcta antes de finalizar.</p>
        <p className="text-sm text-muted-foreground">Al hacer clic en "Finalizar Registro", tus datos serán enviados para revisión.</p>
    </div>
);
