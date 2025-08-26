
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Briefcase, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/page-header";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria."),
  newPassword: z.string().min(8, "Mínimo 8 caracteres.")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula.")
    .regex(/[a-z]/, "Debe contener al menos una minúscula.")
    .regex(/[0-9]/, "Debe contener al menos un número.")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});


export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
    } else {
      router.push('/login');
    }
  }, [router]);
  
  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof changePasswordSchema>) => {
    setIsLoading(true);

    if (!userEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo encontrar tu sesión. Por favor, inicia sesión de nuevo.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Éxito",
          description: data.message,
        });
        form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Error al cambiar la contraseña",
          description: data.message || "Ocurrió un error inesperado.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de red",
        description: "No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mi Perfil"
        description="Visualiza y actualiza tu información personal."
        icon={<User className="h-8 w-8 text-primary" />}
      />
      <Card>
        <CardContent>
          <Tabs defaultValue="personal" className="pt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">
                <User className="mr-2 h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="mr-2 h-4 w-4" />
                Seguridad
              </TabsTrigger>
              <TabsTrigger value="academic">
                <Briefcase className="mr-2 h-4 w-4" />
                Académico
              </TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="mt-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName">Primer Nombre</Label>
                    <Input id="firstName" defaultValue="John" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Primer Apellido</Label>
                    <Input id="lastName" defaultValue="Doe" />
                  </div>
                  <div>
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" defaultValue={userEmail || ''} disabled />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" type="tel" defaultValue="3001234567" />
                  </div>
                   <div>
                    <Label htmlFor="idType">Tipo de Identificación</Label>
                    <Select defaultValue="cc">
                        <SelectTrigger id="idType">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cc">Cédula de Ciudadanía</SelectItem>
                            <SelectItem value="ti">Tarjeta de Identidad</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                   <div>
                    <Label htmlFor="idNumber">Número de Identificación</Label>
                    <Input id="idNumber" defaultValue="1234567890" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input id="address" defaultValue="Calle Falsa 123, Springfield" />
                  </div>
                </div>
                 <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancelar</Button>
                    <Button>Guardar Cambios</Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="security" className="mt-6">
              <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña Actual</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showCurrentPassword ? "text" : "password"} {...field} />
                             <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                               {showCurrentPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                             </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showNewPassword ? "text" : "password"} {...field} />
                             <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNewPassword(!showNewPassword)}>
                               {showNewPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                             </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showConfirmPassword ? "text" : "password"} {...field} />
                             <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                               {showConfirmPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                             </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => form.reset()}>Cancelar</Button>
                    <Button type="submit" disabled={isLoading}>{isLoading ? "Cambiando..." : "Cambiar Contraseña"}</Button>
                </div>
              </form>
              </Form>
            </TabsContent>
            <TabsContent value="academic" className="mt-6">
              <div className="space-y-4">
                  <div>
                    <Label>Carrera</Label>
                    <p className="text-sm font-medium text-gray-800">Ingeniería de Sistemas</p>
                  </div>
                   <div>
                    <Label>Periodo Académico Actual</Label>
                    <p className="text-sm font-medium text-gray-800">2024-2</p>
                  </div>
                   <div>
                    <Label>Jornada</Label>
                    <p className="text-sm font-medium text-gray-800">Diurna</p>
                  </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
