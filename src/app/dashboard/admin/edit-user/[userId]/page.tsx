
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, FormProvider, useWatch, useFormContext } from "react-hook-form";
import { PageHeader } from "@/components/page-header";
import { User, Phone, KeyRound, BookOpen } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp, query, where, collection, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { validateEmail, validateName, validatePassword, validatePhoneNumber, validateRequired, validateSelection } from "@/lib/validators";

type EditUserFormValues = {
  nombre1: string;
  nombre2?: string;
  apellido1: string;
  apellido2: string;
  genero: string;
  telefono: string;
  direccion: string;
  correo: string;
  rol: string;
  contrasena?: string;
  sedeId?: string;
  carreraId?: string;
  grupo?: string;
};

type UserData = {
    nombre1: string;
    nombre2?: string;
    apellido1: string;
    apellido2: string;
    tipoIdentificacion: string;
    identificacion: string;
    genero: string;
    fechaNacimiento?: Timestamp;
    telefono: string;
    direccion: string;
    correo: string;
    rol: { id: string; descripcion: string };
    sedeId?: string;
    carreraId?: string;
    grupo?: string;
};

interface Carrera { id: string; nombre: string; }
interface Grupo { id: string; codigoGrupo: string; }
interface Sede { id: string; nombre: string; }


export default function EditUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const userId = params.userId as string;

  const form = useForm<EditUserFormValues>({
    mode: 'onTouched',
  });
  
  const selectedRole = useWatch({ control: form.control, name: "rol" });
  
  const birthDateValue = useMemo(() => {
    if (userData?.fechaNacimiento && userData.fechaNacimiento.toDate) {
      return format(userData.fechaNacimiento.toDate(), "PPP", { locale: es });
    }
    return "No disponible";
  }, [userData]);


  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
        setIsFetching(true);
        try {
            const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
            const userSnap = await getDoc(userRef);
            if(userSnap.exists()) {
                const data = userSnap.data() as UserData;
                
                if(data.rol.id === 'estudiante') {
                    const studentRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", userId);
                    const studentSnap = await getDoc(studentRef);
                    if(studentSnap.exists()){
                       Object.assign(data, studentSnap.data());
                    }
                }
                
                setUserData(data);
                form.reset({
                    ...data,
                    rol: data.rol.id,
                });

            } else {
                toast({ variant: "destructive", title: "Error", description: "Usuario no encontrado." });
                router.push('/dashboard/admin/users');
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la información del usuario." });
        } finally {
            setIsFetching(false);
        }
    };

    fetchUser();
  }, [userId, form, router, toast]);
  
  const onSubmit = async (values: EditUserFormValues) => {
    if (!userId) return;
    setIsLoading(true);
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });

        const data = await response.json();
        if (response.ok) {
            toast({ title: "Éxito", description: "Usuario actualizado correctamente." });
            router.push('/dashboard/admin/users');
        } else {
            throw new Error(data.message || "No se pudo actualizar el usuario.");
        }

    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsLoading(false);
    }
  };


  if (isFetching) {
    return (
        <div className="flex flex-col gap-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-96" />
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Editar Usuario"
        description={`Modifica los datos de ${userData?.nombre1} ${userData?.apellido1}.`}
        icon={<User className="h-8 w-8 text-primary" />}
        backPath="/dashboard/admin/users"
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
                        <FormField name="nombre1" rules={{validate: validateName}} render={({ field }) => (
                            <FormItem><FormLabel>Primer Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="nombre2" render={({ field }) => (
                            <FormItem><FormLabel>Segundo Nombre (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="apellido1" rules={{validate: validateName}} render={({ field }) => (
                            <FormItem><FormLabel>Primer Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="apellido2" rules={{validate: validateName}} render={({ field }) => (
                            <FormItem><FormLabel>Segundo Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div>
                            <Label>Tipo de Identificación</Label>
                            <Input value={userData?.tipoIdentificacion} disabled />
                        </div>
                         <div>
                            <Label>Número de Identificación</Label>
                            <Input value={userData?.identificacion} disabled />
                        </div>
                        <div>
                            <Label>Fecha de Nacimiento</Label>
                            <Input value={birthDateValue} disabled />
                        </div>
                         <FormField name="genero" rules={{validate: validateSelection}} render={({ field }) => (
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
                        <FormField name="telefono" rules={{validate: validatePhoneNumber}} render={({ field }) => (
                            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField name="correo" rules={{validate: validateEmail}} render={({ field }) => (
                            <FormItem><FormLabel>Correo Personal</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="direccion" rules={{validate: validateRequired}} render={({ field }) => (
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
                          <FormField name="rol" rules={{validate: validateSelection}} render={({ field }) => (
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
                        <FormField name="contrasena" render={({ field }) => (
                            <FormItem><FormLabel>Nueva Contraseña (Opcional)</FormLabel><FormControl><Input type="password" {...field} placeholder="Dejar en blanco para no cambiar" /></FormControl><FormMessage /></FormItem>
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
            <CardFooter className="p-6 bg-gray-50 rounded-b-xl border-t">
                <div className="flex justify-end w-full gap-4">
                    <Button type="button" variant="outline" asChild>
                      <Link href="/dashboard/admin/users">Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Guardando..." : "Guardar Cambios"}
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
