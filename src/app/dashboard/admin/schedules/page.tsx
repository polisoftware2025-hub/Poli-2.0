"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar, Building, BookCopy, Users, Plus, Edit, Trash2, School, Filter, Download, Expand, ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, query, where, DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { getDoc } from "firebase/firestore";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, getDay, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { sanitizeForFirestore } from "@/lib/firestore-utils";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Sede { id: string; nombre: string; }
interface Career { id: string; nombre: string; ciclos: { numero: number; materias: { id: string; nombre: string }[] }[]; }
interface Docente { id: string; nombreCompleto: string; }
interface Salon { id: string; nombre: string; }

interface ScheduleEntry {
    id: string; // Unique ID for the schedule entry, e.g., a timestamp or UUID
    dia: string;
    hora: string;
    duracion: number;
    materiaId: string;
    materiaNombre: string;
    docenteId: string;
    docenteNombre: string;
    modalidad: "Presencial" | "Virtual";
    sedeId?: string;
    sedeNombre?: string;
    salonId?: string;
    salonNombre?: string;
}

interface Group {
    id: string;
    codigoGrupo: string;
    idCarrera: string;
    idSede: string;
    ciclo: number;
    horario?: ScheduleEntry[];
}

const timeSlots = Array.from({ length: 16 * 2 }, (_, i) => {
    const hour = 7 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
});
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const stringToHslColor = (str: string, s: number, l: number): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};


export default function SchedulesAdminPage() {
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [carreras, setCarreras] = useState<Career[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [grupos, setGrupos] = useState<Group[]>([]);
    const [salonesBySede, setSalonesBySede] = useState<{ [key: string]: Salon[] }>({});
    const [allSedeSchedules, setAllSedeSchedules] = useState<(ScheduleEntry & { grupoId?: string })[]>([]);
    
    const [selectedSede, setSelectedSede] = useState("");
    const [selectedCarrera, setSelectedCarrera] = useState("");
    const [selectedGrupo, setSelectedGrupo] = useState<Group | null>(null);
    const [selectedScheduleEntry, setSelectedScheduleEntry] = useState<ScheduleEntry | null>(null);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    
    const [isLoading, setIsLoading] = useState({ sedes: true, carreras: true, grupos: false, docentes: true });
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());

    const week = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return {
            start,
            end,
            days: eachDayOfInterval({ start, end: endOfWeek(currentDate, { weekStartsOn: 1 }) }).slice(0, 6), // Only Mon-Sat
        };
    }, [currentDate]);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(prev => ({ ...prev, sedes: true, carreras: true, docentes: true }));
        try {
            const sedesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes"));
            const fetchedSedes = sedesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sede));
            setSedes(fetchedSedes);

            const salonesData: { [key: string]: Salon[] } = {};
            for (const sede of fetchedSedes) {
                const salonesRef = collection(db, `Politecnico/mzIX7rzezDezczAV6pQ7/sedes/${sede.id}/salones`);
                const salonesSnapshot = await getDocs(salonesRef);
                salonesData[sede.id] = salonesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salon));
            }
            setSalonesBySede(salonesData);
            
            const carrerasSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
            setCarreras(carrerasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Career)));

            const docentesQuery = query(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios"), where("rol.id", "==", "docente"));
            const docentesSnapshot = await getDocs(docentesQuery);
            setDocentes(docentesSnapshot.docs.map(doc => ({ id: doc.id, nombreCompleto: doc.data().nombreCompleto })));

        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos iniciales." });
        } finally {
            setIsLoading(prev => ({ ...prev, sedes: false, carreras: false, docentes: false }));
        }
    }, [toast]);
    
    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const fetchAllSchedulesForSede = useCallback(async (sedeId: string) => {
        if (!sedeId) return [];
        try {
            const q = query(
                collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"),
                where("idSede", "==", sedeId)
            );
            const gruposSnapshot = await getDocs(q);
            const allSedeGroups = gruposSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
            
            const allSchedules = allSedeGroups.flatMap(g => {
                const groupHorario = g.horario || [];
                return groupHorario.map(h => ({ ...h, grupoId: g.id }));
            });
            setAllSedeSchedules(allSchedules);
        } catch (error) {
            console.error("Error fetching all sede schedules:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudieron refrescar los horarios para la detección de conflictos." });
        }
    }, [toast]);


    const handleSedeChange = (sedeId: string) => {
        setSelectedSede(sedeId);
        setSelectedCarrera("");
        setSelectedGrupo(null);
        setGrupos([]);
        setAllSedeSchedules([]);
    };

    const handleCarreraChange = async (carreraId: string) => {
        setSelectedCarrera(carreraId);
        setSelectedGrupo(null);
        if (!carreraId || !selectedSede) {
            setGrupos([]);
            return;
        }

        setIsLoading(prev => ({ ...prev, grupos: true }));
        try {
            const q = query(
                collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"),
                where("idSede", "==", selectedSede),
                where("idCarrera", "==", carreraId)
            );
            const gruposSnapshot = await getDocs(q);
            setGrupos(gruposSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group)));
            
            await fetchAllSchedulesForSede(selectedSede);
            
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los grupos." });
        } finally {
            setIsLoading(prev => ({ ...prev, grupos: false }));
        }
    };

    const handleGrupoChange = (grupoId: string) => {
        const grupo = grupos.find(g => g.id === grupoId) || null;
        setSelectedGrupo(grupo);
    };
    
    const onClassAssigned = useCallback(async () => {
        if (!selectedGrupo) return;

        const grupoRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", selectedGrupo.id);
        const grupoSnap = await getDoc(grupoRef);

        if (grupoSnap.exists()) {
            const updatedGroupData = { id: grupoSnap.id, ...grupoSnap.data() } as Group;
            setSelectedGrupo(updatedGroupData);
            setGrupos(prev => prev.map(g => g.id === updatedGroupData.id ? updatedGroupData : g));
            await fetchAllSchedulesForSede(selectedSede);
        }
    }, [selectedGrupo, selectedSede, fetchAllSchedulesForSede]);


    const handleOpenDialog = (entry: ScheduleEntry | null) => {
        setSelectedScheduleEntry(entry);
        setIsAssignDialogOpen(true);
    };
    
    const changeWeek = (direction: 'next' | 'prev' | 'today') => {
        if (direction === 'today') {
            setCurrentDate(new Date());
        } else {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
            setCurrentDate(newDate);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="Gestión de Horarios y Aulas"
                description="Visualiza, asigna y modifica la programación de clases en las diferentes sedes."
                icon={<Calendar className="h-8 w-8 text-primary" />}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Filtro de Horarios</CardTitle>
                    <CardDescription>Sigue los pasos para encontrar y asignar horarios a los grupos.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>Paso 1: Sede</Label>
                        <Select value={selectedSede} onValueChange={handleSedeChange} disabled={isLoading.sedes}>
                            <SelectTrigger><div className="flex items-center gap-2"><Building className="h-4 w-4" /><SelectValue placeholder={isLoading.sedes ? "Cargando..." : "Selecciona una sede"} /></div></SelectTrigger>
                            <SelectContent>{sedes.map(sede => <SelectItem key={sede.id} value={sede.id}>{sede.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Paso 2: Carrera</Label>
                        <Select value={selectedCarrera} onValueChange={handleCarreraChange} disabled={!selectedSede || isLoading.carreras}>
                             <SelectTrigger><div className="flex items-center gap-2"><BookCopy className="h-4 w-4" /><SelectValue className="truncate inline-block max-w-full" placeholder={!selectedSede ? "Elige sede" : "Selecciona carrera"} /></div></SelectTrigger>
                            <SelectContent>{carreras.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Paso 3: Grupo</Label>
                        <Select value={selectedGrupo?.id || ""} onValueChange={handleGrupoChange} disabled={!selectedCarrera || isLoading.grupos}>
                            <SelectTrigger><div className="flex items-center gap-2"><Users className="h-4 w-4" /><SelectValue placeholder={!selectedCarrera ? "Elige carrera" : (isLoading.grupos ? "Cargando..." : "Selecciona grupo")} /></div></SelectTrigger>
                            <SelectContent>{grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.codigoGrupo}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedGrupo ? (
                <ScheduleView
                    schedule={selectedGrupo.horario || []}
                    week={week}
                    changeWeek={changeWeek}
                    onOpenAssignDialog={handleOpenDialog}
                />
            ) : (
                <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertTitle>Completa la Selección</AlertTitle>
                    <AlertDescription>
                        Por favor, elige una sede, carrera y grupo para visualizar y gestionar el horario correspondiente.
                    </AlertDescription>
                </Alert>
            )}

            {isAssignDialogOpen && selectedGrupo && (
                 <AssignClassDialog
                    key={selectedGrupo.id + (selectedScheduleEntry?.id || 'new')}
                    open={isAssignDialogOpen}
                    onOpenChange={setIsAssignDialogOpen}
                    grupo={selectedGrupo}
                    carrera={carreras.find(c => c.id === selectedGrupo.idCarrera)}
                    docentes={docentes}
                    salones={salonesBySede[selectedSede] || []}
                    onClassAssigned={onClassAssigned}
                    sedes={sedes}
                    existingSchedule={selectedScheduleEntry}
                    allSchedules={allSedeSchedules}
                />
            )}
        </div>
    );
}

function ScheduleView({ schedule, week, changeWeek, onOpenAssignDialog }: any) {
    
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const timeToPosition = (date: Date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        if (hours < 7) return 0;
        if (hours >= 23) return 100;
        const totalMinutes = (hours - 7) * 60 + minutes;
        const totalDayMinutes = (23-7) * 60;
        return (totalMinutes / totalDayMinutes) * 100;
    };
    
    const currentTimePosition = timeToPosition(currentTime);
    const currentDayOfWeek = getDay(currentTime); // Sunday is 0, Monday is 1
    const isCurrentWeek = isSameDay(week.start, startOfWeek(new Date(), { weekStartsOn: 1 }));

    return (
        <Card className="overflow-hidden">
            <CardHeader className="border-b p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => changeWeek('today')}>Hoy</Button>
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeWeek('prev')}><ChevronLeft className="h-5 w-5"/></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeWeek('next')}><ChevronRight className="h-5 w-5"/></Button>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                            {format(week.start, "dd/MM/yyyy")} - {format(week.end, "dd/MM/yyyy")}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => onOpenAssignDialog(null)}>
                            <Plus className="mr-2 h-4 w-4" />Asignar Horario
                        </Button>
                        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/>Exportar</Button>
                        <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4"/>Filtrar</Button>
                        <Button variant="outline" size="sm" className="hidden md:flex"><Expand className="mr-2 h-4 w-4" /> Ampliar</Button>
                        <Select defaultValue="week">
                            <SelectTrigger className="w-[180px] h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">Semana completa</SelectItem>
                                <SelectItem value="day">Día</SelectItem>
                                <SelectItem value="month">Mes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <div className="grid grid-cols-[4rem_repeat(6,minmax(0,1fr))]">
                    {/* Placeholder for top-left corner */}
                    <div className="row-start-1 col-start-1 sticky left-0 z-10 bg-card border-b border-r"></div>
                    
                    {/* Days Header */}
                    {daysOfWeek.map((day, index) => (
                        <div key={day} className="col-start-auto text-center py-2 border-b border-r">
                            <p className="text-xs uppercase text-muted-foreground">{day}</p>
                             <p className={cn("text-lg font-semibold", isToday(week.days[index]) && "text-primary")}>
                                {format(week.days[index], 'd')}
                            </p>
                        </div>
                    ))}
                    
                    {/* Time Column */}
                    <div className="row-start-2 col-start-1 sticky left-0 z-10 bg-card border-r">
                        {timeSlots.map((time, index) => (
                            index % 2 === 0 && (
                                <div key={time} className="h-16 relative flex justify-end pr-2 pt-1">
                                    <span className="text-xs text-muted-foreground -translate-y-1/2">{time}</span>
                                </div>
                            )
                        ))}
                    </div>
                    
                    {/* Grid Body */}
                    <div className="row-start-2 col-start-2 col-span-6 grid grid-cols-6 relative">
                        {/* Background lines */}
                        {timeSlots.map((time, index) => daysOfWeek.map(day => (
                            <div key={`${day}-${time}`} className="h-8 border-b border-r"></div>
                        )))}

                         {/* Current Time Indicator */}
                        {isCurrentWeek && currentDayOfWeek >= 1 && currentDayOfWeek <= 6 && (
                            <div
                                className="absolute w-full h-px bg-red-500 z-20"
                                style={{ top: `${currentTimePosition}%` }}
                            >
                                <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500"></div>
                            </div>
                        )}
                        
                        {/* Schedule Entries */}
                        {schedule.map((entry: any, index: number) => {
                            const dayIndex = daysOfWeek.indexOf(entry.dia);
                            if (dayIndex === -1) return null;
                            
                            const [startHourStr, startMinuteStr] = entry.hora.split(' - ')[0].split(':');
                            const startHour = parseInt(startHourStr);
                            const startMinute = parseInt(startMinuteStr);
                            
                            // Each hour has 2 slots of 30 minutes
                            const startRowIndex = (startHour - 7) * 2 + (startMinute / 30);
                            const top = (startRowIndex / (timeSlots.length)) * 100;

                            const [endHourStr, endMinuteStr] = entry.hora.split(' - ')[1].split(':');
                            const endHour = parseInt(endHourStr);
                            const endMinute = parseInt(endMinuteStr);
                            const endRowIndex = (endHour - 7) * 2 + (endMinute / 30);
                            
                            const durationInSlots = endRowIndex - startRowIndex;
                            const height = (durationInSlots / (timeSlots.length)) * 100;
                            
                            const color = stringToHslColor(entry.materiaNombre, 80, 85);
                            const borderColor = stringToHslColor(entry.materiaNombre, 60, 60);

                            return (
                                <div
                                    key={entry.id || index}
                                    className="absolute w-full p-1"
                                    style={{
                                        top: `${top}%`,
                                        height: `${height}%`,
                                        left: `${(dayIndex / 6) * 100}%`,
                                        width: `${100 / 6}%`
                                    }}
                                >
                                     <button className="w-full h-full text-left" onClick={() => onOpenAssignDialog(entry)}>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex flex-col w-full h-full cursor-pointer p-2 rounded-lg border-l-4 overflow-hidden text-xs" style={{ backgroundColor: color, borderColor: borderColor }}>
                                                        <p className="font-bold text-gray-800 truncate" style={{ color: stringToHslColor(entry.materiaNombre, 80, 20) }}>{entry.materiaNombre}</p>
                                                        <p className="text-gray-600 truncate">{entry.docenteNombre}</p>
                                                        <div className="flex-grow"></div>
                                                        <p className="text-gray-600 font-semibold truncate">{entry.modalidad === 'Presencial' ? entry.salonNombre : 'Virtual'}</p>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="font-bold">{entry.materiaNombre}</p>
                                                    <p><span className="font-semibold">Horario:</span> {entry.hora}</p>
                                                    <p><span className="font-semibold">Docente:</span> {entry.docenteNombre}</p>
                                                    <p><span className="font-semibold">Ubicación:</span> {entry.modalidad === 'Presencial' ? entry.salonNombre : 'Virtual'}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function AssignClassDialog({ 
    open,
    onOpenChange,
    grupo, 
    carrera, 
    docentes, 
    salones, 
    onClassAssigned, 
    sedes,
    existingSchedule,
    allSchedules,
}: { 
    open: boolean;
    onOpenChange: (open: boolean) => void;
    grupo: Group;
    carrera?: Career;
    docentes: Docente[];
    salones: Salon[];
    onClassAssigned: () => void;
    sedes: Sede[];
    existingSchedule?: ScheduleEntry | null;
    allSchedules: (ScheduleEntry & { grupoId?: string })[];
}) {
    const [selectedDia, setSelectedDia] = useState(existingSchedule?.dia || "");
    const [selectedHoraInicio, setSelectedHoraInicio] = useState(existingSchedule?.hora.split(' - ')[0] || "");
    const [selectedHoraFin, setSelectedHoraFin] = useState(existingSchedule?.hora.split(' - ')[1] || "");
    const [selectedMateria, setSelectedMateria] = useState(existingSchedule?.materiaId || "");
    const [selectedDocente, setSelectedDocente] = useState(existingSchedule?.docenteId || "");
    const [modalidad, setModalidad] = useState<"Presencial" | "Virtual">(existingSchedule?.modalidad || "Presencial");
    const [selectedSalon, setSelectedSalon] = useState(existingSchedule?.salonId || "");
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    
    const materiasDelCiclo = useMemo(() => {
        if (!carrera) return [];
        const ciclo = carrera.ciclos.find(c => c.numero === grupo.ciclo);
        return ciclo ? ciclo.materias : [];
    }, [carrera, grupo.ciclo]);

    useEffect(() => {
        if(open) {
          if(existingSchedule) {
              setSelectedDia(existingSchedule.dia);
              const [start, end] = existingSchedule.hora.split(' - ');
              setSelectedHoraInicio(start);
              setSelectedHoraFin(end);
              setSelectedMateria(existingSchedule.materiaId);
              setSelectedDocente(existingSchedule.docenteId);
              setModalidad(existingSchedule.modalidad);
              setSelectedSalon(existingSchedule.salonId || "");
          } else {
              setSelectedDia("");
              setSelectedHoraInicio("");
              setSelectedHoraFin("");
              setSelectedMateria("");
              setSelectedDocente("");
              setModalidad("Presencial");
              setSelectedSalon("");
          }
        }
    }, [existingSchedule, open]);
    
    useEffect(() => {
      setSelectedHoraFin("");
    }, [selectedHoraInicio]);
    
    const occupiedSalonIds = useMemo(() => {
        if (modalidad === 'Virtual' || !selectedDia || !selectedHoraInicio || !selectedHoraFin) return new Set();

        const start = parseInt(selectedHoraInicio.split(':')[0]) + parseInt(selectedHoraInicio.split(':')[1]) / 60;
        const end = parseInt(selectedHoraFin.split(':')[0]) + parseInt(selectedHoraFin.split(':')[1]) / 60;
        
        return new Set(allSchedules
            .filter(entry => {
                if (existingSchedule && entry.id === existingSchedule.id) return false; // Exclude self
                return entry.dia === selectedDia && entry.modalidad === 'Presencial';
            })
            .filter(entry => {
                const [entryStartHour, entryStartMinute] = entry.hora.split(' - ')[0].split(':').map(Number);
                const entryStart = entryStartHour + entryStartMinute / 60;
                
                const [entryEndHour, entryEndMinute] = entry.hora.split(' - ')[1].split(':').map(Number);
                const entryEnd = entryEndHour + entryEndMinute / 60;

                return Math.max(start, entryStart) < Math.min(end, entryEnd);
            })
            .map(entry => entry.salonId));
            
    }, [allSchedules, selectedDia, selectedHoraInicio, selectedHoraFin, modalidad, existingSchedule]);


    const handleSubmit = async () => {
        if (!selectedDia || !selectedHoraInicio || !selectedHoraFin || !selectedMateria || !selectedDocente || (modalidad === 'Presencial' && !selectedSalon)) {
            toast({ variant: "destructive", title: "Campos incompletos", description: "Debes completar todos los campos requeridos." });
            return;
        }

        const [startHour, startMinute] = selectedHoraInicio.split(':').map(Number);
        const [endHour, endMinute] = selectedHoraFin.split(':').map(Number);

        const horaInicioNum = startHour + startMinute / 60;
        const horaFinNum = endHour + endMinute / 60;
        const duracion = horaFinNum - horaInicioNum;
        
        if (duracion <= 0) {
            toast({ variant: "destructive", title: "Horario inválido", description: "La hora de finalización debe ser posterior a la hora de inicio." });
            return;
        }

        const newSlotData = { 
            id: existingSchedule?.id || crypto.randomUUID(),
            dia: selectedDia, 
            hora: `${selectedHoraInicio} - ${selectedHoraFin}`,
            duracion: duracion,
            materiaId: selectedMateria,
            materiaNombre: materiasDelCiclo.find(m => m.id === selectedMateria)?.nombre,
            docenteId: selectedDocente,
            docenteNombre: docentes.find(d => d.id === selectedDocente)?.nombreCompleto,
            modalidad: modalidad,
            sedeId: modalidad === 'Presencial' ? grupo.idSede : undefined,
            sedeNombre: modalidad === 'Presencial' ? sedes.find(s => s.id === grupo.idSede)?.nombre : undefined,
            salonId: modalidad === 'Presencial' ? selectedSalon : undefined,
            salonNombre: modalidad === 'Presencial' ? salones.find(s => s.id === selectedSalon)?.nombre : undefined,
        };

        const sanitizedSlot = sanitizeForFirestore(newSlotData);
        
        setIsSaving(true);
        try {
            const grupoRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", grupo.id);
            if (existingSchedule) {
                const currentHorario = grupo.horario?.filter(h => h.id !== existingSchedule.id) || [];
                const newHorario = [...currentHorario, sanitizedSlot];
                await updateDoc(grupoRef, { horario: newHorario });
                toast({ title: "Éxito", description: "La clase ha sido actualizada correctamente." });
            } else {
                await updateDoc(grupoRef, { horario: arrayUnion(sanitizedSlot) });
                toast({ title: "Éxito", description: "La clase ha sido asignada correctamente." });
            }
            onClassAssigned();
            onOpenChange(false);
        } catch (error) {
            console.error("Error assigning class:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo asignar la clase." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => {
        if (!existingSchedule) return;

        setIsSaving(true);
        try {
            const grupoRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", grupo.id);
            const fullScheduleEntryToRemove = grupo.horario?.find(h => h.id === existingSchedule.id);
            if(fullScheduleEntryToRemove){
                await updateDoc(grupoRef, { horario: arrayRemove(fullScheduleEntryToRemove) });
                toast({ title: "Clase Eliminada", description: "La clase ha sido eliminada del horario." });
                onClassAssigned();
                onOpenChange(false);
            } else {
                 throw new Error("No se encontró la clase para eliminar.");
            }
        } catch (error) {
            console.error("Error deleting class:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la clase." });
        } finally {
            setIsSaving(false);
        }
    };

    const availableEndTimes = useMemo(() => {
        if (!selectedHoraInicio) return [];
        const startIndex = timeSlots.indexOf(selectedHoraInicio);
        if (startIndex === -1) return [];
        return timeSlots.slice(startIndex + 1);
    }, [selectedHoraInicio]);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{existingSchedule ? 'Editar' : 'Asignar'} Clase a {grupo.codigoGrupo}</DialogTitle>
                    <DialogDescription>Completa los detalles para una nueva clase.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Día</Label>
                        <Select value={selectedDia} onValueChange={setSelectedDia}><SelectTrigger><SelectValue placeholder="Selecciona un día..." /></SelectTrigger><SelectContent>{daysOfWeek.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Hora de Inicio</Label>
                        <Select value={selectedHoraInicio} onValueChange={setSelectedHoraInicio}><SelectTrigger><SelectValue placeholder="Selecciona una hora..." /></SelectTrigger><SelectContent>{timeSlots.slice(0, -1).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Hora Fin</Label>
                        <Select value={selectedHoraFin} onValueChange={setSelectedHoraFin} disabled={!selectedHoraInicio}>
                            <SelectTrigger><SelectValue placeholder="Selecciona una hora..." /></SelectTrigger>
                            <SelectContent>{availableEndTimes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label>Materia</Label>
                        <Select value={selectedMateria} onValueChange={setSelectedMateria}><SelectTrigger><SelectValue placeholder="Selecciona una materia..." /></SelectTrigger><SelectContent>{materiasDelCiclo.map((m, i) => <SelectItem key={m.id + '-' + i} value={m.id}>{m.nombre}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label>Docente</Label>
                        <Select value={selectedDocente} onValueChange={setSelectedDocente}><SelectTrigger><SelectValue placeholder="Selecciona un docente..." /></SelectTrigger><SelectContent>{docentes.map(d => <SelectItem key={d.id} value={d.id}>{d.nombreCompleto}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Modalidad</Label>
                        <Select value={modalidad} onValueChange={(v) => setModalidad(v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Presencial">Presencial</SelectItem><SelectItem value="Virtual">Virtual</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Salón</Label>
                        <Select value={selectedSalon} onValueChange={setSelectedSalon} disabled={modalidad === 'Virtual'}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un salón..." />
                            </SelectTrigger>
                            <SelectContent>
                                {salones.map(s => {
                                    const isOccupied = occupiedSalonIds.has(s.id);
                                    // The salon is selectable if it's NOT occupied, OR if it's the one currently being edited.
                                    const isSelectable = !isOccupied || s.id === existingSchedule?.salonId;
                                    return (
                                        <SelectItem key={s.id} value={s.id} disabled={!isSelectable}>
                                            {s.nombre} {!isSelectable && "(Ocupado)"}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="flex justify-between w-full">
                     <div>
                        {existingSchedule && (
                            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Eliminar
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
    

    
