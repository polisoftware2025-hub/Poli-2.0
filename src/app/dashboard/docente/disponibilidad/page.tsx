"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Calendar, Laptop, Save, User } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarSelector } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { es } from "date-fns/locale";

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const timeSlots = Array.from({ length: 16 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

interface AvailabilityData {
    dias: string[];
    franjas: {
        [key: string]: { inicio: string; fin: string };
    };
    modalidad: "Presencial" | "Virtual" | "Ambas";
    fechasBloqueadas: Date[];
}

export default function AvailabilityPage() {
    const [availability, setAvailability] = useState<AvailabilityData>({
        dias: [], franjas: {}, modalidad: "Ambas", fechasBloqueadas: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const storedUserId = localStorage.getItem("userId");
        const userRole = localStorage.getItem("userRole");
        if (storedUserId && userRole === 'docente') {
            setUserId(storedUserId);
        } else {
            setIsLoading(false);
            toast({ variant: "destructive", title: "Acceso Denegado", description: "Esta página es solo para docentes." });
            router.push('/dashboard');
        }
    }, [toast, router]);
    
    useEffect(() => {
        if (!userId) return;

        const fetchAvailability = async () => {
            setIsLoading(true);
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
                toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la disponibilidad." });
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchAvailability();
    }, [userId, toast]);

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

    const handleSave = async () => {
        if (!userId) return;
        setIsSaving(true);
        try {
            const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
            await updateDoc(userRef, { disponibilidad: availability });
            toast({ title: "Éxito", description: "Tu disponibilidad ha sido actualizada." });
        } catch (error) {
             console.error("Error saving availability: ", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la disponibilidad." });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return (
             <div className="flex flex-col gap-8">
                <PageHeader title="Mi Disponibilidad" description="Configura tus horarios y preferencias." icon={<Clock className="h-8 w-8 text-primary"/>} />
                <Card><CardContent className="p-6"><Skeleton className="h-96 w-full"/></CardContent></Card>
             </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Mi Disponibilidad" description="Configura tus horarios y preferencias para la asignación de clases." icon={<Clock className="h-8 w-8 text-primary"/>}/>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Días y Horas Disponibles</CardTitle>
                            <CardDescription>Selecciona los días que puedes impartir clases y ajusta las franjas horarias.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {daysOfWeek.map(day => (
                                <div key={day} className="p-4 border rounded-lg space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={day}
                                            checked={availability.dias.includes(day)}
                                            onCheckedChange={() => handleDayToggle(day)}
                                        />
                                        <Label htmlFor={day} className="text-lg font-medium">{day}</Label>
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
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Laptop className="h-5 w-5"/> Modalidad de Preferencia</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Select value={availability.modalidad} onValueChange={v => setAvailability(p => ({...p, modalidad: v as any}))}>
                                <SelectTrigger className="w-full md:w-64"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ambas">Ambas (Presencial y Virtual)</SelectItem>
                                    <SelectItem value="Presencial">Solo Presencial</SelectItem>
                                    <SelectItem value="Virtual">Solo Virtual</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5"/> Fechas Bloqueadas</CardTitle>
                            <CardDescription>Selecciona los días en los que no estarás disponible (vacaciones, eventos, etc.).</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <CalendarSelector
                                mode="multiple"
                                locale={es}
                                selected={availability.fechasBloqueadas}
                                onSelect={(dates) => setAvailability(prev => ({ ...prev, fechasBloqueadas: dates || [] }))}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                    <Save className="mr-2 h-5 w-5"/>
                    {isSaving ? "Guardando..." : "Guardar mi Disponibilidad"}
                </Button>
            </div>
        </div>
    );
}
