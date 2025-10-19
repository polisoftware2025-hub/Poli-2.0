
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
import { User, Shield, Briefcase, Eye, EyeOff, Clock } from "lucide-react";
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
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { validatePassword, validateName, validateEmail, validateIdNumber, validateSelection } from "@/lib/validators";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarSelector } from "@/components/ui/calendar";
import { es } from "date-fns/locale";


type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ProfileInfoFormValues = {
    nombre1: string;
    nombre2?: string;
    apellido1: string;
    apellido2: string;
    telefono: string;
    direccion: string;
    correo: string;
    correoInstitucional?: string;
    tipoIdentificacion: string;
    identificacion: string;
};

interface AcademicInfo {
    carrera: string;
    sede: string;
    grupo: string;
    periodo: string;
}

interface UserInfo extends ProfileInfoFormValues {}

// Availability Types
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const timeSlots = Array.from({ length: 16 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

interface AvailabilityData {
    dias: string[];
    franjas: { [key: string]: { inicio: string; fin: string; }; };
    modalidad: "Presencial" | "Virtual" | "Ambas";
    fechasBloqueadas: Date[];
}


export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoadingAcademic, setIsLoadingAcademic] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [availability, setAvailability] = useState<AvailabilityData>({ dias: [], franjas: {}, modalidad: "Ambas", fechasBloqueadas: [] });
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordForm = useForm<ChangePasswordFormValues>({
    mode: "onTouched",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  
  const profileForm = useForm<ProfileInfoFormValues>({
      mode: "onTouched",
      defaultValues: { 
          nombre1: '', nombre2: '', apellido1: '', apellido2: '', telefono: '', direccion: '',
          correo: '', correoInstitucional: '', tipoIdentificacion: '', identificacion: ''
      }
  });

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
                const data = userSnap.data() as UserInfo;
                setUserInfo(data);
                profileForm.reset({
                    nombre1: data.nombre1 || '',
                    nombre2: data.nombre2 || '',
                    apellido1: data.apellido1 || '',
                    apellido2: data.apellido2 || '',
                    telefono: data.telefono || '',
                    direccion: data.direccion || '',
                    correo: data.correo || '',
                    correoInstitucional: data.correoInstitucional || '',
                    tipoIdentificacion: data.tipoIdentificacion || '',
                    identificacion: data.identificacion || ''
                })
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
    
    const fetchAvailability = async () => {
        setIsLoadingAvailability(true);
        try {
            const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists() && userSnap.data().disponibilidad) {
                const data = userSnap.data().disponibilidad;
                setAvailability({
                    dias: data.dias || [],
                    franjas: data.franjas || {},
                    modalidad: data.modalidad || "Ambas",
                    fechasBloqueadas: (data.fechasBloqueadas || []).map((d: any) => d.toDate()),
                });
            }
        } catch (error) {
            console.error("Error fetching availability: ", error);
        } finally {
            setIsLoadingAvailability(false);
        }
    };

    fetchUserInfo();
    if (userRole === 'estudiante') {
        fetchAcademicInfo();
    } else {
        setIsLoadingAcademic(false);
    }
    if (userRole === 'docente') {
        fetchAvailability();
    } else {
        setIsLoadingAvailability(false);
    }
  }, [userId, userRole, toast, profileForm]);
  

  const onSubmitPassword = async (values: ChangePasswordFormValues) => {
    setIsUpdatingPassword(true);
    if (!userEmail) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo encontrar tu sesión. Por favor, inicia sesión de nuevo." });
      setIsUpdatingPassword(false);
      return;
    }
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, currentPassword: values.currentPassword, newPassword: values.newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Éxito", description: data.message });
        passwordForm.reset();
      } else {
        toast({ variant: "destructive", title: "Error al cambiar la contraseña", description: data.message || "Ocurrió un error inesperado." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error de red", description: "No se pudo conectar con el servidor." });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateProfile = async (values: ProfileInfoFormValues) => {
    if (!userId) return;
    setIsUpdatingProfile(true);
    try {
        const response = await fetch('/api/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ...values })
        });
        const data = await response.json();
        if (response.ok) {
            toast({ title: "Éxito", description: "Tu perfil ha sido actualizado." });
             if (userEmail !== values.correoInstitucional) {
                localStorage.setItem('userEmail', values.correoInstitucional || '');
             }
        } else {
            throw new Error(data.message || "No se pudo actualizar el perfil.");
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsUpdatingProfile(false);
    }
  };

  const handleDayToggle = (day: string) => {
        setAvailability(prev => {
            const newDias = prev.dias.includes(day)
                ? prev.dias.filter(d => d !== day)
                : [...prev.dias, day];
            
            const newFranjas = { ...prev.franjas };
            if (!newDias.includes(day)) {
                delete newFranjas[day];
            } else if (!newFranjas[day]) {
                newFranjas[day] = { inicio: "08:00", fin: "12:00" };
            }
            
            return { ...prev, dias: newDias, franjas: newFranjas };
        });
    };
    
    const handleTimeChange = (day: string, type: "inicio" | "fin", value: string) => {
        setAvailability(prev => ({
            ...prev,
            franjas: {
                ...prev.franjas,
                [day]: { ...prev.franjas[day], [type]: value },
            },
        }));
    };
    
  const handleUpdateAvailability = async () => {
    if (!userId) return;
    setIsUpdatingAvailability(true);
    try {
        const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
        await updateDoc(userRef, { disponibilidad: availability });
        toast({ title: "Éxito", description: "Tu disponibilidad ha sido actualizada." });
    } catch (error) {
         console.error("Error saving availability: ", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la disponibilidad." });
    } finally {
        setIsUpdatingAvailability(false);
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
            <TabsList className={`grid w-full ${userRole === 'docente' ? 'grid-cols-4' : (userRole === 'estudiante' ? 'grid-cols-3' : 'grid-cols-2')}`}>
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
               {userRole === 'docente' && (
                  <TabsTrigger value="availability">
                    <Clock className="mr-2 h-4 w-4" />
                    Disponibilidad
                  </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="personal" className="mt-6">
              {isLoadingUser ? (
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" />
                    </div>
                 </div>
              ) : (
                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                             <FormField control={profileForm.control} name="nombre1" rules={{ validate: validateName }} render={({ field }) => (
                                <FormItem><FormLabel>Primer Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={profileForm.control} name="nombre2" render={({ field }) => (
                                <FormItem><FormLabel>Segundo Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={profileForm.control} name="apellido1" rules={{ validate: validateName }} render={({ field }) => (
                                <FormItem><FormLabel>Primer Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={profileForm.control} name="apellido2" rules={{ validate: validateName }} render={({ field }) => (
                                <FormItem><FormLabel>Segundo Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={profileForm.control} name="telefono" render={({ field }) => (
                                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={profileForm.control} name="direccion" render={({ field }) => (
                                <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            
                             <FormField control={profileForm.control} name="correo" rules={{validate: validateEmail}} render={({ field }) => (
                                <FormItem><FormLabel>Correo Electrónico Personal</FormLabel><FormControl><Input type="email" {...field} disabled={userRole !== 'rector'} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={profileForm.control} name="correoInstitucional" rules={{validate: validateEmail}} render={({ field }) => (
                                <FormItem><FormLabel>Correo Institucional</FormLabel><FormControl><Input type="email" {...field} disabled={userRole !== 'rector'} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={profileForm.control} name="tipoIdentificacion" rules={{validate: validateSelection}} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Identificación</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={userRole !== 'rector'}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="cc">Cédula de Ciudadanía</SelectItem>
                                            <SelectItem value="ti">Tarjeta de Identidad</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={profileForm.control} name="identificacion" rules={{validate: validateIdNumber}} render={({ field }) => (
                                <FormItem><FormLabel>Número de Identificación</FormLabel><FormControl><Input {...field} disabled={userRole !== 'rector'} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="submit" disabled={isUpdatingProfile}>{isUpdatingProfile ? "Actualizando..." : "Actualizar Datos"}</Button>
                        </div>
                    </form>
                </Form>
              )}
            </TabsContent>
            <TabsContent value="security" className="mt-6">
              <Form {...passwordForm}>
               <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6">
                 <FormField control={passwordForm.control} name="currentPassword" rules={{ required: "La contraseña actual es obligatoria." }} render={({ field }) => (
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
                 <FormField control={passwordForm.control} name="newPassword" rules={{ validate: validatePassword }} render={({ field }) => (
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
                  <FormField control={passwordForm.control} name="confirmPassword" rules={{ validate: (value) => value === passwordForm.getValues("newPassword") || "Las contraseñas no coinciden."}} render={({ field }) => (
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
                    <Button type="button" variant="outline" onClick={() => passwordForm.reset()}>Cancelar</Button>
                    <Button type="submit" disabled={isUpdatingPassword}>{isUpdatingPassword ? "Cambiando..." : "Cambiar Contraseña"}</Button>
                </div>
              </form>
              </Form>
            </TabsContent>
            {userRole === 'estudiante' && (
                <TabsContent value="academic" className="mt-6">
                {isLoadingAcademic ? (
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-1/3" /> <Skeleton className="h-8 w-1/2" /> <Skeleton className="h-8 w-1/4" />
                    </div>
                ) : academicInfo ? (
                    <div className="space-y-4">
                        <div><Label>Carrera</Label><p className="text-sm font-medium text-gray-800">{academicInfo.carrera}</p></div>
                        <div><Label>Sede</Label><p className="text-sm font-medium text-gray-800">{academicInfo.sede}</p></div>
                        <div><Label>Grupo</Label><p className="text-sm font-medium text-gray-800">{academicInfo.grupo}</p></div>
                        <div><Label>Periodo Académico Actual</Label><p className="text-sm font-medium text-gray-800">{academicInfo.periodo}</p></div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No se encontró información académica.</p>
                )}
                </TabsContent>
            )}
             {userRole === 'docente' && (
                <TabsContent value="availability" className="mt-6">
                {isLoadingAvailability ? (<Skeleton className="h-96 w-full"/>) : (
                    <div className="space-y-6">
                         <div className="space-y-4">
                            <h3 className="font-semibold">Días y Horas Disponibles</h3>
                            {daysOfWeek.map(day => (
                                <div key={day} className="p-3 border rounded-md space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`day-${day}`}
                                            checked={availability.dias.includes(day)}
                                            onCheckedChange={() => handleDayToggle(day)}
                                        />
                                        <Label htmlFor={`day-${day}`} className="text-base font-medium">{day}</Label>
                                    </div>
                                    {availability.dias.includes(day) && (
                                        <div className="grid grid-cols-2 gap-4 pl-6">
                                            <div className="space-y-2">
                                                <Label>Desde</Label>
                                                <Select value={availability.franjas[day]?.inicio} onValueChange={value => handleTimeChange(day, 'inicio', value)}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Hasta</Label>
                                                 <Select value={availability.franjas[day]?.fin} onValueChange={value => handleTimeChange(day, 'fin', value)}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleUpdateAvailability} disabled={isUpdatingAvailability}>
                                {isUpdatingAvailability ? "Guardando..." : "Guardar Disponibilidad"}
                            </Button>
                        </div>
                    </div>
                )}
                </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
