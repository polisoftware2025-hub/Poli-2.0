
"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider, useWatch, useFormContext } from "react-hook-form";
import { PageHeader } from "@/components/page-header";
import { UserPlus, User, Phone, BookOpen, KeyRound, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { validateEmail, validateIdNumber, validateName, validatePassword, validatePhoneNumber, validateRequired, validateSelection } from "@/lib/validators";

type AddUserFormValues = {
  nombre1: string;
  nombre2?: string;
  apellido1: string;
  apellido2: string;
  tipoIdentificacion: string;
  identificacion: string;
  genero: string;
  fechaNacimiento: Date;
  telefono: string;
  direccion: string;
  correo: string;
  rol: string;
  contrasena: string;
  sedeId?: string;
  carreraId?: string;
  grupo?: string;
};

interface Carrera { id: string; nombre: string; }
interface Grupo { id: string; codigoGrupo: string; }
interface Sede { id: string; nombre: string; }

export default function AddUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AddUserFormValues>({
    mode: 'onTouched',
    defaultValues: {
      nombre1: "",
      nombre2: "",
      apellido1: "",
      apellido2: "",
      tipoIdentificacion: "",
      identificacion: "",
      genero: "",
      fechaNacimiento: undefined,
      telefono: "",
      direccion: "",
      correo: "",
      rol: "",
      contrasena: "",
      sedeId: "",
      carreraId: "",
      grupo: "",
    },
  });

  const selectedRole = useWatch({ control: form.control, name: "rol" });
  
  const onSubmit = async (values: AddUserFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Usuario Creado",
          description: `El usuario ${data.nombreCompleto} ha sido creado exitosamente.`,
        });
        router.push('/dashboard/admin/users');
      } else {
        throw new Error(data.message || "No se pudo crear el usuario.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Agregar Nuevo Usuario"
        description="Completa los siguientes campos para registrar un nuevo miembro en el sistema."
        icon={<UserPlus className="h-8 w-8 text-primary" />}
      />
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardContent className="p-6">
                  <div className="space-y-8">
                  {/* Sección de Información Personal */}
                  <section>
                      <div className="flex items-center gap-3 mb-4">
                          <User className="h-6 w-6 text-primary" />
                          <h3 className="text-xl font-semibold">Información Personal</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField name="nombre1" rules={{ validate: validateName }} render={({ field }) => (
                              <FormItem><FormLabel>Primer Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField name="nombre2" render={({ field }) => (
                              <FormItem><FormLabel>Segundo Nombre (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField name="apellido1" rules={{ validate: validateName }} render={({ field }) => (
                              <FormItem><FormLabel>Primer Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField name="apellido2" rules={{ validate: validateName }} render={({ field }) => (
                              <FormItem><FormLabel>Segundo Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField name="tipoIdentificacion" rules={{ validate: validateSelection }} render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Tipo de Identificación</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                      <SelectContent>
                                          <SelectItem value="cc">Cédula de Ciudadanía</SelectItem>
                                          <SelectItem value="ti">Tarjeta de Identidad</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )} />
                          <FormField name="identificacion" rules={{ validate: validateIdNumber }} render={({ field }) => (
                              <FormItem><FormLabel>Número de Identificación</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField name="fechaNacimiento" rules={{ validate: (value: Date) => validateRequired(value) }} render={({ field }) => (
                              <FormItem className="flex flex-col justify-end">
                                  <FormLabel>Fecha de Nacimiento</FormLabel>
                                  <Popover>
                                      <PopoverTrigger asChild><FormControl>
                                          <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                              {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                      </FormControl></PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                      </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                              </FormItem>
                          )} />
                          <FormField name="genero" rules={{ validate: validateSelection }} render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Género</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                      <SelectContent>
                                          <SelectItem value="Masculino">Masculino</SelectItem>
                                          <SelectItem value="Femenino">Femenino</SelectItem>
                                          <SelectItem value="Otro">Otro</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )} />
                      </div>
                  </section>
                  
                  <Separator/>
                  
                  {/* Sección de Datos de Contacto */}
                  <section>
                      <div className="flex items-center gap-3 mb-4">
                          <Phone className="h-6 w-6 text-primary" />
                          <h3 className="text-xl font-semibold">Datos de Contacto</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField name="telefono" rules={{ validate: validatePhoneNumber }} render={({ field }) => (
                              <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField name="correo" rules={{ validate: validateEmail }} render={({ field }) => (
                              <FormItem><FormLabel>Correo Personal</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField name="direccion" rules={{ validate: validateRequired }} render={({ field }) => (
                              <FormItem className="md:col-span-2"><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                      </div>
                  </section>

                  <Separator/>

                  {/* Sección de Credenciales */}
                  <section>
                      <div className="flex items-center gap-3 mb-4">
                          <KeyRound className="h-6 w-6 text-primary" />
                          <h3 className="text-xl font-semibold">Credenciales y Rol</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField name="rol" rules={{ validate: validateSelection }} render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Rol del Usuario</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar Rol..." /></SelectTrigger></FormControl>
                                      <SelectContent>
                                          <SelectItem value="admin">Administrador</SelectItem>
                                          <SelectItem value="gestor">Gestor</SelectItem>
                                          <SelectItem value="docente">Docente</SelectItem>
                                          <SelectItem value="estudiante">Estudiante</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )} />
                          <FormField name="contrasena" rules={{ validate: validatePassword }} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contraseña Provisional</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                        <Input type={showPassword ? "text" : "password"} {...field} className="pr-10" />
                                    </FormControl>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                <FormMessage />
                              </FormItem>
                          )} />
                      </div>
                  </section>
                  
                   {selectedRole === 'estudiante' && (
                        <>
                            <Separator />
                            <AcademicInfoSection />
                        </>
                    )}

                  </div>
              </CardContent>
              <CardFooter className="p-6 bg-muted rounded-b-xl border-t">
                  <div className="flex justify-end w-full gap-4">
                      <Button type="button" variant="outline" asChild>
                          <Link href="/dashboard/admin/users">Cancelar</Link>
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Creando..." : "Crear Usuario"}
                      </Button>
                  </div>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </FormProvider>
    </div>
  );
}

function AcademicInfoSection() {
    const { control, setValue } = useFormContext();
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [carreras, setCarreras] = useState<Carrera[]>([]);
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [isLoading, setIsLoading] = useState({ sedes: true, carreras: true, grupos: false });

    const selectedSede = useWatch({ control, name: "sedeId" });
    const selectedCarrera = useWatch({ control, name: "carreraId" });

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(prev => ({ ...prev, sedes: true, carreras: true }));
            try {
                const sedesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes"));
                setSedes(sedesSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));

                const carrerasSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
                setCarreras(carrerasSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));
            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setIsLoading(prev => ({ ...prev, sedes: false, carreras: false }));
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
                const q = query(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"),
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
        <section>
            <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">Información Académica</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={control} name="sedeId" rules={{validate: validateSelection}} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sede</FormLabel>
                        <Select onValueChange={(value) => { field.onChange(value); setValue("carreraId", ""); setValue("grupo", ""); }} defaultValue={field.value} disabled={isLoading.sedes}>
                            <FormControl><SelectTrigger><SelectValue placeholder={isLoading.sedes ? "Cargando..." : "Selecciona una sede"} /></SelectTrigger></FormControl>
                            <SelectContent>{sedes.map(sede => <SelectItem key={sede.id} value={sede.id}>{sede.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={control} name="carreraId" rules={{validate: validateSelection}} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Carrera</FormLabel>
                        <Select onValueChange={(value) => { field.onChange(value); setValue("grupo", ""); }} defaultValue={field.value} disabled={isLoading.carreras || !selectedSede}>
                            <FormControl><SelectTrigger><SelectValue placeholder={!selectedSede ? "Elige sede" : "Selecciona carrera"} /></SelectTrigger></FormControl>
                            <SelectContent>{carreras.map(carrera => <SelectItem key={carrera.id} value={carrera.id}>{carrera.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={control} name="grupo" rules={{validate: validateSelection}} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Grupo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading.grupos || !selectedCarrera}>
                            <FormControl><SelectTrigger><SelectValue placeholder={!selectedCarrera ? "Elige carrera" : "Selecciona grupo"} /></SelectTrigger></FormControl>
                            <SelectContent>{grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.codigoGrupo}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
        </section>
    );
}

    