
"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/page-header";
import { UserPlus, User, Phone, BookOpen, KeyRound } from "lucide-react";
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

// Schemas simplificados para la maquetación
const editUserSchema = z.object({
  // Step 1
  firstName: z.string().min(1, "Campo requerido"),
  segundoNombre: z.string().optional(),
  lastName: z.string().min(1, "Campo requerido"),
  segundoApellido: z.string().min(1, "Campo requerido"),
  tipoIdentificacion: z.string().min(1, "Campo requerido"),
  numeroIdentificacion: z.string().min(1, "Campo requerido"),
  gender: z.string().min(1, "Campo requerido"),
  birthDate: z.date(),
  // Step 2
  phone: z.string().min(1, "Campo requerido"),
  address: z.string().min(1, "Campo requerido"),
  country: z.string().min(1, "Campo requerido"),
  city: z.string().min(1, "Campo requerido"),
  correoPersonal: z.string().email(),
  // Step 3
  program: z.string().optional(),
  ciclo: z.string().optional(),
  grupo: z.string().optional(),
  jornada: z.string().optional(),
  // Step 5
  password: z.string().optional(),
  // New field for Admin
  rol: z.string().min(1, "El rol es obligatorio")
});

export default function EditUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
  });
  
  const onSubmit = (values: z.infer<typeof editUserSchema>) => {
    // No functionality, as requested
    console.log(values);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Editar Usuario"
        description="Modifica los campos para actualizar la información del usuario."
        icon={<UserPlus className="h-8 w-8 text-primary" />}
      />
      <FormProvider {...form}>
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
                        <FormField name="firstName" render={({ field }) => (
                            <FormItem><FormLabel>Primer Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="segundoNombre" render={({ field }) => (
                            <FormItem><FormLabel>Segundo Nombre (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="lastName" render={({ field }) => (
                            <FormItem><FormLabel>Primer Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="segundoApellido" render={({ field }) => (
                            <FormItem><FormLabel>Segundo Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="tipoIdentificacion" render={({ field }) => (
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
                        <FormField name="numeroIdentificacion" render={({ field }) => (
                            <FormItem><FormLabel>Número de Identificación</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="birthDate" render={({ field }) => (
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
                         <FormField name="gender" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Género</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="M">Masculino</SelectItem>
                                        <SelectItem value="F">Femenino</SelectItem>
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
                        <FormField name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField name="correoPersonal" render={({ field }) => (
                            <FormItem><FormLabel>Correo Personal</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="address" render={({ field }) => (
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
                        <FormField name="password" render={({ field }) => (
                            <FormItem><FormLabel>Nueva Contraseña (Opcional)</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </section>

                </div>
            </CardContent>
            <CardFooter className="p-6 bg-gray-50 rounded-b-xl border-t">
                <div className="flex justify-end w-full gap-4">
                    <Button type="button" variant="outline">Cancelar</Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </div>
            </CardFooter>
          </Card>
        </form>
      </FormProvider>
    </div>
  );
}

    