
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar, Building, BookCopy, Users, Plus, Edit, Trash2, School, Filter, Download, Expand, ChevronLeft, ChevronRight } from "lucide-react";
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
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { sanitizeForFirestore } from "@/lib/firestore-utils";

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

const allTimeSlots = Array.from({ length: 16 }, (_, i) => 7 + i); // 7 AM a 10 PM (22:00)
const daysOfWeekMap: { [key: string]: number } = {
  "Lunes": 1, "Martes": 2, "Miércoles": 3, "Jueves": 4, "Viernes": 5, "Sábado": 6
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

    const getGridPosition = (entry: ScheduleEntry) => {
        const dayIndex = daysOfWeekMap[entry.dia as keyof typeof daysOfWeekMap];
        if (dayIndex === undefined) return {}; 

        const startTime = parseInt(entry.hora.split(':')[0]);
        const startRow = startTime - 7;
        const duration = entry.duracion;

        if (startRow < 0 || startRow >= allTimeSlots.length) return {};

        return {
            gridColumn: `${dayIndex}`,
            gridRow: `${startRow + 1} / span ${duration}`
        }
    }

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
                <Card>
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
                                 <Button onClick={() => handleOpenDialog(null)}>
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
                         <div className="grid grid-cols-[auto_repeat(6,_minmax(140px,_1fr))]">
                            {/* Time Column Placeholder */}
                            <div className="row-start-1 col-start-1"></div>
                            {/* Days Header */}
                            <div className="col-start-2 col-span-6 grid grid-cols-6 border-b">
                                {Object.keys(daysOfWeekMap).map(day => (
                                    <div key={day} className="p-2 text-center font-semibold border-r">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            {/* Grid Body */}
                            <div className="col-start-1 row-start-2 grid border-r" style={{ gridTemplateRows: `repeat(${allTimeSlots.length}, minmax(60px, 1fr))` }}>
                                {/* Time Column */}
                                {allTimeSlots.map(hour => (
                                    <div key={hour} className="pr-2 text-right text-xs text-muted-foreground flex items-start justify-end pt-1 border-b h-[60px]">
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>
                            <div className="col-start-2 col-span-6 row-start-2 grid relative grid-cols-6" style={{ gridTemplateRows: `repeat(${allTimeSlots.length}, minmax(60px, 1fr))`}}>
                                {/* Grid background lines */}
                                {Array.from({ length: allTimeSlots.length * 6 }).map((_, i) => (
                                    <div key={i} className="border-b border-r h-[60px]"></div>
                                ))}
                                {/* Schedule Entries */}
                                {(selectedGrupo.horario || []).map((entry, index) => (
                                    <div key={entry.id || index} style={getGridPosition(entry)} className="absolute p-1 m-px w-[calc(100%_-_2px)] h-full">
                                        <button className="w-full h-full text-left" onClick={() => handleOpenDialog(entry)}>
                                            <div className="flex flex-col w-full h-full cursor-pointer p-2 rounded-lg bg-blue-50 border-l-4 border-blue-500 shadow-sm overflow-hidden text-xs">
                                                <p className="font-bold text-blue-800 truncate">{entry.materiaNombre}</p>
                                                <p className="text-gray-600 truncate">{entry.docenteNombre}</p>
                                                <div className="flex-grow"></div>
                                                <p className="text-gray-600 font-semibold truncate">{entry.modalidad === 'Presencial' ? entry.salonNombre : 'Virtual'}</p>
                                            </div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
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
              setSelectedHoraInicio(existingSchedule.hora.split(' - ')[0]);
              setSelectedHoraFin(existingSchedule.hora.split(' - ')[1]);
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
    
    const availableSalones = useMemo(() => {
        if (modalidad === 'Virtual' || !selectedDia || !selectedHoraInicio || !selectedHoraFin) return salones;

        const start = parseInt(selectedHoraInicio.split(':')[0]);
        const end = parseInt(selectedHoraFin.split(':')[0]);

        const occupiedSalons = allSchedules
            .filter(entry => {
                if (existingSchedule && entry.id === existingSchedule.id) return false;
                if (entry.grupoId === grupo.id) return false;
                return entry.dia === selectedDia && entry.modalidad === 'Presencial';
            })
            .filter(entry => {
                const entryStart = parseInt(entry.hora.split(':')[0]);
                const entryEnd = entryStart + entry.duracion;
                return Math.max(start, entryStart) < Math.min(end, entryEnd);
            })
            .map(entry => entry.salonId);
            
        return salones.filter(salon => !occupiedSalons.includes(salon.id));

    }, [salones, allSchedules, selectedDia, selectedHoraInicio, selectedHoraFin, modalidad, existingSchedule, grupo.id]);


    const handleSubmit = async () => {
        if (!selectedDia || !selectedHoraInicio || !selectedHoraFin || !selectedMateria || !selectedDocente || (modalidad === 'Presencial' && !selectedSalon)) {
            toast({ variant: "destructive", title: "Campos incompletos", description: "Debes completar todos los campos requeridos." });
            return;
        }

        const horaInicioNum = parseInt(selectedHoraInicio.split(':')[0]);
        const horaFinNum = parseInt(selectedHoraFin.split(':')[0]);
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
        const startIndex = allTimeSlots.indexOf(parseInt(selectedHoraInicio.split(':')[0]));
        if (startIndex === -1) return [];
        return allTimeSlots.slice(startIndex + 1).map(h => `${h.toString().padStart(2, '0')}:00`);
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
                        <Select value={selectedDia} onValueChange={setSelectedDia}><SelectTrigger><SelectValue placeholder="Selecciona un día..." /></SelectTrigger><SelectContent>{Object.keys(daysOfWeekMap).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Hora de Inicio</Label>
                        <Select value={selectedHoraInicio} onValueChange={setSelectedHoraInicio}><SelectTrigger><SelectValue placeholder="Selecciona una hora..." /></SelectTrigger><SelectContent>{allTimeSlots.slice(0, -1).map(t => <SelectItem key={t} value={`${t.toString().padStart(2, '0')}:00`}>{`${t.toString().padStart(2, '0')}:00`}</SelectItem>)}</SelectContent></Select>
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
                    {modalidad === 'Presencial' && (
                        <div className="space-y-2">
                            <Label>Salón</Label>
                            <Select value={selectedSalon} onValueChange={setSelectedSalon} disabled={!selectedDia || !selectedHoraFin}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un salón..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {salones.map(s => (
                                        <SelectItem key={s.id} value={s.id} disabled={!availableSalones.some(as => as.id === s.id)}>
                                            {s.nombre} {!availableSalones.some(as => as.id === s.id) && "(Ocupado)"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
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
