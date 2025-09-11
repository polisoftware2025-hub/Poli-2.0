"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { User, Shield, Briefcase, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/page-header";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { validatePassword } from "@/lib/validators";

type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

interface AcademicInfo {
    carrera: string;
    sede: string;
    grupo: string;
    periodo: string;
}

interface UserInfo {
    nombre1: string;
    nombre2?: string;
    apellido1: string;
    apellido2: string;
    tipoIdentificacion: string;
    identificacion: string;
    telefono: string;
    direccion: string;
    correo: string;
}

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoadingAcademic, setIsLoadingAcademic] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedUserId = localStorage.getItem('userId');
    const storedRole = localStorage.getItem('userRole');

    if (storedEmail && storedUserId && storedRole) {
      setUserEmail(storedEmail);
      setUserId(storedUserId);
      setUserRole(storedRole);
    } else {
      router.push('/login');
    }
  }, [router]);
  
  useEffect(() => {
    if (!userId || !userRole) return;

    const fetchUserInfo = async () => {
        setIsLoadingUser(true);
        try {
            const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                setUserInfo(userSnap.data() as UserInfo);
            } else {
                toast({ variant: "destructive", title: "Error", description: "No se encontró tu información de usuario." });
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo cargar tu información personal." });
        } finally {
            setIsLoadingUser(false);
        }
    };

    const fetchAcademicInfo = async () => {
        setIsLoadingAcademic(true);
        try {
            const studentRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", userId);
            const studentSnap = await getDoc(studentRef);

            if (studentSnap.exists()) {
                const studentData = studentSnap.data();
                
                const [carreraDoc, sedeDoc, grupoDoc] = await Promise.all([
                    studentData.carreraId ? getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", studentData.carreraId)) : Promise.resolve(null),
                    studentData.sedeId ? getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes", studentData.sedeId)) : Promise.resolve(null),
                    studentData.grupo ? getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", studentData.grupo)) : Promise.resolve(null),
                ]);

                setAcademicInfo({
                    carrera: carreraDoc?.exists() ? carreraDoc.data().nombre : "No asignada",
                    sede: sedeDoc?.exists() ? sedeDoc.data().nombre : "No asignada",
                    grupo: grupoDoc?.exists() ? grupoDoc.data().codigoGrupo : "No asignado",
                    periodo: "2024-2" // Placeholder, can be dynamic later
                });
            } else {
                 setAcademicInfo(null); // No academic info if not found
            }
        } catch (error) {
            console.error("Error fetching academic info: ", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la información académica." });
        } finally {
            setIsLoadingAcademic(false);
        }
    };

    fetchUserInfo();
    if (userRole === 'estudiante') {
        fetchAcademicInfo();
    } else {
        setIsLoadingAcademic(false);
    }
  }, [userId, userRole, toast]);
  
  const form = useForm<ChangePasswordFormValues>({
    mode: "onTouched",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
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
            <TabsList className={`grid w-full ${userRole === 'estudiante' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="personal">
                <User className="mr-2 h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="mr-2 h-4 w-4" />
                Seguridad
              </TabsTrigger>
              {userRole === 'estudiante' && (
                  <TabsTrigger value="academic">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Académico
                  </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="personal" className="mt-6">
              {isLoadingUser ? (
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                 </div>
              ) : (
                <form className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <Label htmlFor="firstName">Primer Nombre</Label>
                        <Input id="firstName" value={userInfo?.nombre1 || ''} readOnly />
                    </div>
                    <div>
                        <Label htmlFor="secondName">Segundo Nombre</Label>
                        <Input id="secondName" value={userInfo?.nombre2 || ''} readOnly />
                    </div>
                    <div>
                        <Label htmlFor="lastName">Primer Apellido</Label>
                        <Input id="lastName" value={userInfo?.apellido1 || ''} readOnly />
                    </div>
                    <div>
                        <Label htmlFor="secondLastName">Segundo Apellido</Label>
                        <Input id="secondLastName" value={userInfo?.apellido2 || ''} readOnly />
                    </div>
                    <div>
                        <Label htmlFor="email">Correo Electrónico Personal</Label>
                        <Input id="email" type="email" value={userInfo?.correo || ''} readOnly />
                    </div>
                    <div>
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input id="phone" type="tel" value={userInfo?.telefono || ''} readOnly />
                    </div>
                    <div>
                        <Label htmlFor="idType">Tipo de Identificación</Label>
                        <Input id="idType" value={userInfo?.tipoIdentificacion || ''} readOnly />
                    </div>
                    <div>
                        <Label htmlFor="idNumber">Número de Identificación</Label>
                        <Input id="idNumber" value={userInfo?.identificacion || ''} readOnly />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input id="address" value={userInfo?.direccion || ''} readOnly />
                    </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" disabled>Actualizar Datos (Próximamente)</Button>
                    </div>
                </form>
              )}
            </TabsContent>
            <TabsContent value="security" className="mt-6">
              <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                    control={form.control}
                    name="currentPassword"
                    rules={{ required: "La contraseña actual es obligatoria." }}
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
                    rules={{ validate: validatePassword }}
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
                    rules={{
                        validate: (value) => value === form.getValues("newPassword") || "Las contraseñas no coinciden."
                    }}
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
            {userRole === 'estudiante' && (
                <TabsContent value="academic" className="mt-6">
                {isLoadingAcademic ? (
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-8 w-1/4" />
                    </div>
                ) : academicInfo ? (
                    <div className="space-y-4">
                        <div>
                            <Label>Carrera</Label>
                            <p className="text-sm font-medium text-gray-800">{academicInfo.carrera}</p>
                        </div>
                        <div>
                            <Label>Sede</Label>
                            <p className="text-sm font-medium text-gray-800">{academicInfo.sede}</p>
                        </div>
                        <div>
                            <Label>Grupo</Label>
                            <p className="text-sm font-medium text-gray-800">{academicInfo.grupo}</p>
                        </div>
                        <div>
                            <Label>Periodo Académico Actual</Label>
                            <p className="text-sm font-medium text-gray-800">{academicInfo.periodo}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No se encontró información académica.</p>
                )}
                </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
