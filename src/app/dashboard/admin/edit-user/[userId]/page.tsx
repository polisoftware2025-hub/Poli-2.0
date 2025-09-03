"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/page-header";
import { User, Phone, KeyRound } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

const editUserSchema = z.object({
  nombre1: z.string().min(1, "Campo requerido"),
  nombre2: z.string().optional(),
  apellido1: z.string().min(1, "Campo requerido"),
  apellido2: z.string().min(1, "Campo requerido"),
  genero: z.string().min(1, "Campo requerido"),
  telefono: z.string().min(1, "Campo requerido"),
  direccion: z.string().min(1, "Campo requerido"),
  correo: z.string().email(),
  rol: z.string().min(1, "El rol es obligatorio"),
  contrasena: z.string().optional(),
});

type UserData = {
    nombre1: string;
    nombre2?: string;
    apellido1: string;
    apellido2: string;
    tipoIdentificacion: string;
    identificacion: string;
    genero: string;
    fechaNacimiento: Timestamp;
    telefono: string;
    direccion: string;
    correo: string;
    rol: { id: string; descripcion: string };
};


export default function EditUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const userId = params.userId as string;

  const form = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
        setIsFetching(true);
        try {
            const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
            const userSnap = await getDoc(userRef);
            if(userSnap.exists()) {
                const data = userSnap.data() as UserData;
                setUserData(data);
                form.reset({
                    nombre1: data.nombre1,
                    nombre2: data.nombre2,
                    apellido1: data.apellido1,
                    apellido2: data.apellido2,
                    genero: data.genero,
                    telefono: data.telefono,
                    direccion: data.direccion,
                    correo: data.correo,
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
  
  const onSubmit = async (values: z.infer<typeof editUserSchema>) => {
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
                        <FormField name="nombre1" render={({ field }) => (
                            <FormItem><FormLabel>Primer Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="nombre2" render={({ field }) => (
                            <FormItem><FormLabel>Segundo Nombre (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="apellido1" render={({ field }) => (
                            <FormItem><FormLabel>Primer Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="apellido2" render={({ field }) => (
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
                            <Input value={userData ? format(userData.fechaNacimiento.toDate(), "PPP", { locale: es }) : ""} disabled />
                        </div>
                         <FormField name="genero" render={({ field }) => (
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
                        <FormField name="telefono" render={({ field }) => (
                            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField name="correo" render={({ field }) => (
                            <FormItem><FormLabel>Correo Personal</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="direccion" render={({ field }) => (
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
                          <FormField name="rol" render={({ field }) => (
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
