"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Wand2, Building, BookCopy, Users, Info, Clock, Calendar, AlertTriangle, Eye, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { Stepper, StepperItem } from "@/components/ui/stepper";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Card, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarSelector } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Sede { id: string; nombre: string; }
interface Career { id: string; nombre: string; ciclos: { numero: number; materias: { id: string; nombre: string, horasSemanales: number }[] }[]; }
interface Docente { id: string; nombreCompleto: string; disponibilidad?: any; horarioAsignado?: ScheduleEntry[]; }
interface Grupo { id: string; codigoGrupo: string; horario?: ScheduleEntry[] }

interface ScheduleEntry {
  id: string; dia: string; hora: string; duracion: number; materiaId: string; materiaNombre: string;
  docenteId: string; docenteNombre: string; modalidad: "Presencial" | "Virtual";
  sedeId?: string; sedeNombre?: string; salonId?: string; salonNombre?: string;
  grupoCodigo?: string;
}

const timeSlots = Array.from({ length: 15 }, (_, i) => `${(7 + i).toString().padStart(2, '0')}:00`);
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const stringToHslColor = (str: string, s: number, l: number): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const TeacherScheduleModal = ({ docente, onAvailabilityGenerated }: { docente: Docente, onAvailabilityGenerated: () => void }) => {
    const availability = docente.disponibilidad || {};
    const schedule = docente.horarioAsignado || [];
    const [isGenerating, setIsGenerating] = React.useState(false);
    const { toast } = useToast();

    const handleGenerateAvailability = async () => {
        setIsGenerating(true);
        try {
            const defaultAvailability = {
                dias: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
                franjas: {
                    Lunes: { inicio: "18:00", fin: "22:00" },
                    Martes: { inicio: "18:00", fin: "22:00" },
                    Miércoles: { inicio: "18:00", fin: "22:00" },
                    Jueves: { inicio: "18:00", fin: "22:00" },
                    Viernes: { inicio: "18:00", fin: "22:00" },
                },
                modalidad: "Ambas",
                fechasBloqueadas: []
            };
            const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", docente.id);
            await updateDoc(userRef, { disponibilidad: defaultAvailability });
            toast({ title: "Disponibilidad Generada", description: `Se ha asignado un horario estándar al docente ${docente.nombreCompleto}.` });
            onAvailabilityGenerated();
        } catch (error) {
            console.error("Error generating availability:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo generar la disponibilidad." });
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant={schedule.length > 0 ? "outline" : "secondary"} size="sm" className={cn("flex items-center gap-2", schedule.length > 0 && "border-amber-500 text-amber-700 hover:bg-amber-50")}>
                    <Eye className="h-4 w-4"/> Ver Horario
                    {schedule.length > 0 && <AlertTriangle className="h-4 w-4"/>}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Horario de {docente.nombreCompleto}</DialogTitle>
                    <DialogDescription>
                        Visualización de clases asignadas y disponibilidad general del docente.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        <h4 className="font-semibold">Disponibilidad</h4>
                        {availability.dias && availability.dias.length > 0 ? (
                            <div className="text-sm space-y-2 p-3 bg-muted rounded-md">
                                <p><strong className="text-primary">Modalidad:</strong> {availability.modalidad || "No especificada"}</p>
                                <ul className="list-disc pl-5">
                                    {availability.dias.map((dia: string) => (
                                        <li key={dia}>
                                            <strong>{dia}:</strong> de {availability.franjas?.[dia]?.inicio || 'N/A'} a {availability.franjas?.[dia]?.fin || 'N/A'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                             <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-center space-y-2">
                                <p className="text-sm text-yellow-800">Este docente no ha configurado su disponibilidad.</p>
                                <Button size="sm" variant="secondary" onClick={handleGenerateAvailability} disabled={isGenerating}>
                                    {isGenerating ? "Generando..." : "Generar Disponibilidad"}
                                </Button>
                             </div>
                        )}
                    </div>
                    <div className="md:col-span-3">
                         <div className="relative border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-24">Hora</TableHead>
                                        {daysOfWeek.map(day => <TableHead key={day} className="text-center">{day}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {timeSlots.map(time => (
                                        <TableRow key={time}>
                                            <TableCell className="font-medium text-xs">{time}</TableCell>
                                            {daysOfWeek.map(day => <TableCell key={day} className="p-0 h-12"></TableCell>)}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="absolute top-[41px] left-[105px] right-0 bottom-0 grid grid-cols-6 pointer-events-none">
                                {schedule.map(entry => {
                                    const dayIndex = daysOfWeek.indexOf(entry.dia);
                                    if(dayIndex === -1) return null;
                                    
                                    const [startHour] = entry.hora.split(' - ')[0].split(':').map(Number);
                                    const topOffset = (startHour - 7) * 48;
                                    const height = entry.duracion * 48;
                                    
                                    const color = stringToHslColor(entry.materiaNombre, 80, 85);
                                    const borderColor = stringToHslColor(entry.materiaNombre, 60, 60);

                                    return (
                                        <div key={entry.id} className="absolute p-1" style={{ top: `${topOffset}px`, height: `${height}px`, left: `calc(${dayIndex/6 * 100}%)`, width: 'calc(100% / 6)'}}>
                                            <div className="bg-white rounded-md p-1.5 text-xs border-l-4 h-full" style={{borderColor}}>
                                                <p className="font-bold truncate" style={{color: stringToHslColor(entry.materiaNombre, 80, 20)}}>{entry.materiaNombre}</p>
                                                <p className="text-muted-foreground truncate">{entry.grupoCodigo}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


export default function GenerateSchedulePage() {
    const { toast } = useToast();
    const [carreras, setCarreras] = useState<Career[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [selectedSede, setSelectedSede] = useState("");
    const [selectedCarrera, setSelectedCarrera] = useState("");
    const [selectedCiclo, setSelectedCiclo] = useState("");
    const [selectedGrupo, setSelectedGrupo] = useState("all");
    const [selectedDocentes, setSelectedDocentes] = useState<string[]>([]);
    
    // Step 3 state
    const [periodDates, setPeriodDates] = useState<{from: Date | undefined, to: Date | undefined}>({ from: undefined, to: undefined });
    const [batchTime, setBatchTime] = useState({ dia: "", horaInicio: "", horaFin: "" });

    const [activeStep, setActiveStep] = useState(0);
    const totalSteps = 4;

    const groupWithSchedule = useMemo(() => {
        if (selectedGrupo !== 'all') {
            const group = grupos.find(g => g.id === selectedGrupo);
            if (group && group.horario && group.horario.length > 0) {
                return group;
            }
        }
        const relevantGroups = selectedGrupo === 'all'
            ? grupos
            : grupos.filter(g => g.id === selectedGrupo);
        
        return relevantGroups.filter(g => g.horario && g.horario.length > 0);

    }, [selectedGrupo, grupos]);
    
    const fetchInitialData = useCallback(async () => {
        try {
            const sedesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes"));
            setSedes(sedesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sede)));

            const carrerasSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
            setCarreras(carrerasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Career)));
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos iniciales." });
        }
    }, [toast]);
    
    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);
    
    const fetchDocentesAndSchedules = useCallback(async () => {
        if (!selectedSede) return;
        const docentesQuery = query(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios"), where("rol.id", "==", "docente"));
        const docentesSnapshot = await getDocs(docentesQuery);
        const docentesList = docentesSnapshot.docs.map(doc => ({ id: doc.id, nombreCompleto: doc.data().nombreCompleto, disponibilidad: doc.data().disponibilidad, horarioAsignado: [] } as Docente));
        
        const gruposQuery = query(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"), where("idSede", "==", selectedSede));
        const gruposSnapshot = await getDocs(gruposQuery);
        
        docentesList.forEach(docente => {
            const assignedSchedule: ScheduleEntry[] = [];
            gruposSnapshot.forEach(groupDoc => {
                const groupData = groupDoc.data();
                if(groupData.horario && Array.isArray(groupData.horario)){
                    groupData.horario.forEach((slot: any) => {
                        if(slot.docenteId === docente.id){
                            assignedSchedule.push({...slot, grupoCodigo: groupData.codigoGrupo});
                        }
                    })
                }
            });
            docente.horarioAsignado = assignedSchedule;
        });
        
        setDocentes(docentesList);
    }, [selectedSede]);

    useEffect(() => {
        fetchDocentesAndSchedules();
    }, [selectedSede, fetchDocentesAndSchedules]);

    useEffect(() => {
        if (!selectedSede || !selectedCarrera || !selectedCiclo) {
            setGrupos([]);
            setSelectedGrupo("all");
            return;
        }

        const fetchGroups = async () => {
            try {
                const q = query(
                    collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"),
                    where("idSede", "==", selectedSede),
                    where("idCarrera", "==", selectedCarrera),
                    where("ciclo", "==", parseInt(selectedCiclo))
                );
                const querySnapshot = await getDocs(q);
                
                const fetchedGrupos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grupo));
                setGrupos(fetchedGrupos);
            } catch (error) {
                console.error("Error fetching groups:", error);
            }
        };

        fetchGroups();
    }, [selectedSede, selectedCarrera, selectedCiclo]);

    const ciclosDisponibles = useMemo(() => {
        const carrera = carreras.find(c => c.id === selectedCarrera);
        return carrera?.ciclos.map(c => c.numero) || [];
    }, [selectedCarrera, carreras]);
    
    const handleNextStep = () => {
      if (activeStep < totalSteps - 1) {
          if (activeStep === 0 && (!selectedSede || !selectedCarrera || !selectedCiclo)) {
              toast({ variant: "destructive", title: "Campos requeridos", description: "Debes seleccionar sede, carrera y ciclo para continuar." });
              return;
          }
           if (activeStep === 1 && selectedDocentes.length === 0) {
              toast({ variant: "destructive", title: "Selección requerida", description: "Debes seleccionar al menos un docente." });
              return;
          }
          setActiveStep(prev => prev + 1);
      }
    };

    const handlePrevStep = () => {
        if (activeStep > 0) {
            setActiveStep(prev => prev + 1);
        }
    };
    
    const handleGenerate = async () => {
        if (!selectedSede || !selectedCarrera || !selectedCiclo) {
            toast({ variant: "destructive", title: "Campos requeridos", description: "Debes seleccionar sede, carrera y ciclo." });
            return;
        }
        setIsGenerating(true);
        
        try {
            const response = await fetch('/api/admin/schedules/autogenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sedeId: selectedSede, 
                    carreraId: selectedCarrera, 
                    ciclo: parseInt(selectedCiclo),
                    grupoId: selectedGrupo,
                    docentesIds: selectedDocentes,
                    periodo: periodDates,
                    horarioLote: batchTime,
                 }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast({ title: "Éxito", description: data.message });
            setActiveStep(0);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error en la Generación", description: error.message });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 h-full">
            <PageHeader
                title="Asistente de Generación de Horarios"
                description="Configura las reglas y preferencias para generar un nuevo horario automáticamente."
                icon={<Wand2 className="h-8 w-8 text-primary" />}
                backPath="/dashboard/admin/schedules"
            />
            <Card>
                <Stepper initialStep={0} orientation="horizontal" activeStep={activeStep} setActiveStep={setActiveStep}>
                    <StepperItem title="Parámetros">
                        <div className="p-6 space-y-4 max-w-2xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Sede</Label>
                                    <Select onValueChange={setSelectedSede} value={selectedSede}><SelectTrigger><SelectValue placeholder="Selecciona una sede..." /></SelectTrigger><SelectContent>{sedes.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent></Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Carrera</Label>
                                    <Select onValueChange={v => { setSelectedCarrera(v); setSelectedCiclo(""); setSelectedGrupo("all"); }} value={selectedCarrera}><SelectTrigger><SelectValue placeholder="Selecciona una carrera..." /></SelectTrigger><SelectContent>{carreras.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent></Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Ciclo</Label>
                                    <Select onValueChange={v => { setSelectedCiclo(v); setSelectedGrupo("all"); }} value={selectedCiclo} disabled={!selectedCarrera}><SelectTrigger><SelectValue placeholder="Selecciona un ciclo..." /></SelectTrigger><SelectContent>{ciclosDisponibles.map(c => <SelectItem key={c} value={String(c)}>Ciclo {c}</SelectItem>)}</SelectContent></Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Grupo</Label>
                                    <Select onValueChange={setSelectedGrupo} value={selectedGrupo} disabled={!selectedCiclo}>
                                        <SelectTrigger><SelectValue placeholder="Selecciona un grupo..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los grupos de este ciclo</SelectItem>
                                            {grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.codigoGrupo}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {groupWithSchedule && Array.isArray(groupWithSchedule) && groupWithSchedule.length > 0 && (
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Horario Existente para Múltiples Grupos</AlertTitle>
                                    <AlertDescription>
                                        Los siguientes grupos ya tienen un horario: {groupWithSchedule.map(g => g.codigoGrupo).join(', ')}. Continuar sobrescribirá sus horarios.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </StepperItem>
                    <StepperItem title="Docentes">
                         <div className="p-6 space-y-4 max-w-3xl mx-auto">
                            <Label className="text-center block">Selecciona los docentes a considerar para este horario. Revisa sus horarios actuales para evitar conflictos.</Label>
                            <ScrollArea className="h-96 w-full rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12"></TableHead>
                                            <TableHead>Docente</TableHead>
                                            <TableHead className="text-center">Clases Asignadas</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {docentes.map(docente => {
                                            const hasConflict = docente.horarioAsignado && docente.horarioAsignado.length > 0;
                                            return (
                                                <TableRow key={docente.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedDocentes.includes(docente.id)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? setSelectedDocentes(prev => [...prev, docente.id])
                                                                    : setSelectedDocentes(prev => prev.filter(id => id !== docente.id))
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">{docente.nombreCompleto}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant={hasConflict ? "destructive" : "secondary"}>{docente.horarioAsignado?.length || 0}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <TeacherScheduleModal docente={docente} onAvailabilityGenerated={fetchDocentesAndSchedules}/>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </StepperItem>
                    <StepperItem title="Período y Horas">
                        <div className="p-6 space-y-6 max-w-2xl mx-auto">
                            <div className="space-y-2">
                                <h3 className="font-semibold">Definir Período Académico (Opcional)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <Popover><PopoverTrigger asChild>
                                        <div className="space-y-2"><Label>Fecha de Inicio</Label><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !periodDates.from && "text-muted-foreground")}><Calendar className="mr-2 h-4 w-4" />{periodDates.from ? format(periodDates.from, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}</Button></div>
                                     </PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarSelector mode="single" selected={periodDates.from} onSelect={(d) => setPeriodDates(p => ({...p, from: d}))} initialFocus /></PopoverContent></Popover>
                                     <Popover><PopoverTrigger asChild>
                                         <div className="space-y-2"><Label>Fecha de Fin</Label><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !periodDates.to && "text-muted-foreground")}><Calendar className="mr-2 h-4 w-4" />{periodDates.to ? format(periodDates.to, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}</Button></div>
                                     </PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarSelector mode="single" selected={periodDates.to} onSelect={(d) => setPeriodDates(p => ({...p, to: d}))} initialFocus /></PopoverContent></Popover>
                                </div>
                            </div>
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-semibold">Asignación Rápida de Horario (Opcional)</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2"><Label>Día</Label><Select value={batchTime.dia} onValueChange={v => setBatchTime(p => ({...p, dia: v}))}><SelectTrigger><SelectValue placeholder="Seleccionar día..." /></SelectTrigger><SelectContent>{daysOfWeek.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="space-y-2"><Label>Hora Inicio</Label><Select value={batchTime.horaInicio} onValueChange={v => setBatchTime(p => ({...p, horaInicio: v}))}><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="space-y-2"><Label>Hora Fin</Label><Select value={batchTime.horaFin} onValueChange={v => setBatchTime(p => ({...p, horaFin: v}))}><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                                </div>
                            </div>
                        </div>
                    </StepperItem>
                    <StepperItem title="Confirmar">
                        <div className="text-center p-8 space-y-4">
                             <Wand2 className="h-12 w-12 mx-auto text-primary"/>
                            <h3 className="text-2xl font-bold">Listo para Generar</h3>
                            <p className="text-muted-foreground">El sistema intentará generar el horario con las configuraciones proporcionadas. Revisa los pasos anteriores si necesitas hacer cambios.</p>
                        </div>
                    </StepperItem>
                </Stepper>
                <CardFooter className="flex justify-between p-6 bg-gray-50 border-t">
                    <Button variant="outline" onClick={handlePrevStep} disabled={activeStep === 0}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Anterior
                    </Button>
                    {activeStep < totalSteps - 1 ? (
                        <Button onClick={handleNextStep}>
                            Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? "Generando..." : "Finalizar y Generar"}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
