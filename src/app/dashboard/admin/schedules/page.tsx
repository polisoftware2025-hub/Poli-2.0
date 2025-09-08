
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar, Building, BookCopy, Users, Plus, Edit, Trash2, School } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, query, where, DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { getDoc } from "firebase/firestore";

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

const timeSlots = Array.from({ length: 15 }, (_, i) => `${(7 + i).toString().padStart(2, '0')}:00`);
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function SchedulesAdminPage() {
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [carreras, setCarreras] = useState<Career[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [grupos, setGrupos] = useState<Group[]>([]);
    const [salonesBySede, setSalonesBySede] = useState<{ [key: string]: Salon[] }>({});
    
    const [selectedSede, setSelectedSede] = useState("");
    const [selectedSalon, setSelectedSalon] = useState("");
    const [selectedCarrera, setSelectedCarrera] = useState("");
    const [selectedGrupo, setSelectedGrupo] = useState<Group | null>(null);
    
    const [isLoading, setIsLoading] = useState({ sedes: true, carreras: true, grupos: false, docentes: true });
    const { toast } = useToast();

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

    const handleSedeChange = (sedeId: string) => {
        setSelectedSede(sedeId);
        setSelectedSalon("");
        setSelectedCarrera("");
        setSelectedGrupo(null);
        setGrupos([]);
    };
    
    const handleSalonChange = (salonId: string) => {
        setSelectedSalon(salonId);
        setSelectedCarrera("");
        setSelectedGrupo(null);
        setGrupos([]);
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
        if (selectedGrupo) {
            const grupoRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", selectedGrupo.id);
            const grupoSnap = await getDoc(grupoRef);
            if (grupoSnap.exists()) {
                setSelectedGrupo({ id: grupoSnap.id, ...grupoSnap.data() } as Group);
            }
        }
    }, [selectedGrupo]);
    
    const scheduleGrid = useMemo(() => {
        const grid: (ScheduleEntry | null)[][] = timeSlots.map(() => Array(daysOfWeek.length).fill(null));
        if (!selectedGrupo?.horario) return grid;

        selectedGrupo.horario.forEach(entry => {
            const [startTimeStr] = entry.hora.split(" - ");
            const dayIndex = daysOfWeek.indexOf(entry.dia);
            const timeIndex = timeSlots.indexOf(startTimeStr);

            if (dayIndex !== -1 && timeIndex !== -1) {
                for (let i = 0; i < entry.duracion; i++) {
                    if (timeIndex + i < timeSlots.length) {
                        grid[timeIndex + i][dayIndex] = entry;
                    }
                }
            }
        });
        return grid;
    }, [selectedGrupo]);

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="Gestión de Horarios y Aulas"
                description="Visualiza, asigna y modifica la programación de clases en las diferentes sedes."
                icon={<Calendar className="h-8 w-8 text-primary" />}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Filtro Jerárquico de Horarios</CardTitle>
                    <CardDescription>Sigue los pasos para encontrar y asignar horarios a los grupos.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label>Paso 1: Sede</Label>
                        <Select value={selectedSede} onValueChange={handleSedeChange} disabled={isLoading.sedes}>
                            <SelectTrigger><div className="flex items-center gap-2"><Building className="h-4 w-4" /><SelectValue placeholder={isLoading.sedes ? "Cargando..." : "Selecciona una sede"} /></div></SelectTrigger>
                            <SelectContent>{sedes.map(sede => <SelectItem key={sede.id} value={sede.id}>{sede.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Paso 2: Salón/Aula</Label>
                        <Select value={selectedSalon} onValueChange={handleSalonChange} disabled={!selectedSede}>
                            <SelectTrigger><div className="flex items-center gap-2"><School className="h-4 w-4" /><SelectValue placeholder="Selecciona un salón" /></div></SelectTrigger>
                            <SelectContent>{(salonesBySede[selectedSede] || []).map(salon => <SelectItem key={salon.id} value={salon.id}>{salon.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Paso 3: Carrera</Label>
                        <Select value={selectedCarrera} onValueChange={handleCarreraChange} disabled={!selectedSalon || isLoading.carreras}>
                             <SelectTrigger><div className="flex items-center gap-2"><BookCopy className="h-4 w-4" /><SelectValue className="truncate inline-block max-w-full" placeholder={!selectedSalon ? "Elige salón" : "Selecciona carrera"} /></div></SelectTrigger>
                            <SelectContent>{carreras.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Paso 4: Grupo</Label>
                        <Select value={selectedGrupo?.id || ""} onValueChange={handleGrupoChange} disabled={!selectedCarrera || isLoading.grupos}>
                            <SelectTrigger><div className="flex items-center gap-2"><Users className="h-4 w-4" /><SelectValue placeholder={!selectedCarrera ? "Elige carrera" : (isLoading.grupos ? "Cargando..." : "Selecciona grupo")} /></div></SelectTrigger>
                            <SelectContent>{grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.codigoGrupo}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedGrupo ? (
                <Card>
                    <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>Horario para el Grupo: {selectedGrupo.codigoGrupo}</CardTitle>
                            <CardDescription>
                                {carreras.find(c => c.id === selectedGrupo.idCarrera)?.nombre} - Sede: {sedes.find(s => s.id === selectedGrupo.idSede)?.nombre}
                            </CardDescription>
                        </div>
                        <AssignClassDialog
                            key={selectedGrupo.id} // Re-mount modal when group changes
                            grupo={selectedGrupo}
                            carrera={carreras.find(c => c.id === selectedGrupo.idCarrera)}
                            docentes={docentes}
                            salones={salonesBySede[selectedSede] || []}
                            onClassAssigned={onClassAssigned}
                            sedes={sedes}
                        />
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                        <div className="w-full overflow-x-auto">
                            <Table className="min-w-full border">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-24 border-r text-center font-bold">Hora</TableHead>
                                        {daysOfWeek.map(day => <TableHead key={day} className="border-r text-center font-bold">{day}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {scheduleGrid.map((row, timeIndex) => (
                                        <TableRow key={timeSlots[timeIndex]}>
                                            <TableCell className="border-r text-center font-mono text-xs text-muted-foreground">{timeSlots[timeIndex]}</TableCell>
                                            {row.map((entry, dayIndex) => {
                                                if (entry && entry.hora.split(' - ')[0] !== timeSlots[timeIndex]) return null;
                                                return (
                                                <TableCell key={`${dayIndex}-${timeIndex}`} rowSpan={entry?.duracion || 1} className="border-r p-1 align-top h-24">
                                                    {entry && (
                                                         <AssignClassDialog
                                                            key={entry.id}
                                                            grupo={selectedGrupo}
                                                            carrera={carreras.find(c => c.id === selectedGrupo.idCarrera)}
                                                            docentes={docentes}
                                                            salones={salonesBySede[selectedSede] || []}
                                                            onClassAssigned={onClassAssigned}
                                                            sedes={sedes}
                                                            existingSchedule={entry}
                                                        >
                                                            <div className="bg-primary/5 p-2 rounded-md border-l-4 border-primary h-full flex flex-col justify-center text-xs cursor-pointer hover:bg-primary/10">
                                                                <p className="font-bold text-primary">{entry.materiaNombre}</p>
                                                                <p className="text-muted-foreground">{entry.docenteNombre}</p>
                                                                <p className="text-muted-foreground font-semibold">{entry.modalidad === 'Presencial' ? entry.salonNombre : 'Virtual'}</p>
                                                            </div>
                                                        </AssignClassDialog>
                                                    )}
                                                </TableCell>
                                            )})}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertTitle>Completa la Selección</AlertTitle>
                    <AlertDescription>
                        Por favor, elige una sede, salón, carrera y grupo para visualizar y gestionar el horario correspondiente.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

function AssignClassDialog({ 
    grupo, 
    carrera, 
    docentes, 
    salones, 
    onClassAssigned, 
    sedes,
    existingSchedule, 
    children 
}: { 
    grupo: Group, 
    carrera?: Career, 
    docentes: Docente[], 
    salones: Salon[], 
    onClassAssigned: () => void,
    sedes: Sede[],
    existingSchedule?: ScheduleEntry | null,
    children?: React.ReactNode 
}) {
    const [open, setOpen] = useState(false);
    const [selectedDia, setSelectedDia] = useState(existingSchedule?.dia || "");
    const [selectedHoraInicio, setSelectedHoraInicio] = useState(existingSchedule?.hora.split(' - ')[0] || "");
    const [selectedHoraFin, setSelectedHoraFin] = useState(existingSchedule?.hora.split(' - ')[1] || "");
    const [selectedMateria, setSelectedMateria] = useState(existingSchedule?.materiaId || "");
    const [selectedDocente, setSelectedDocente] = useState(existingSchedule?.docenteId || "");
    const [modalidad, setModalidad] = useState<"Presencial" | "Virtual">(existingSchedule?.modalidad || "Presencial");
    const [selectedSalon, setSelectedSalon] = useState(existingSchedule?.salonId || "");
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    
    const materiasDelCiclo = carrera?.ciclos.find(c => c.numero === grupo.ciclo)?.materias || [];

    useEffect(() => {
        if(existingSchedule) {
            setSelectedDia(existingSchedule.dia);
            setSelectedHoraInicio(existingSchedule.hora.split(' - ')[0]);
            setSelectedHoraFin(existingSchedule.hora.split(' - ')[1]);
            setSelectedMateria(existingSchedule.materiaId);
            setSelectedDocente(existingSchedule.docenteId);
            setModalidad(existingSchedule.modalidad);
            setSelectedSalon(existingSchedule.salonId || "");
        }
    }, [existingSchedule]);


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

        const newSlot: ScheduleEntry = { 
            id: existingSchedule?.id || crypto.randomUUID(),
            dia: selectedDia, 
            hora: `${selectedHoraInicio} - ${selectedHoraFin}`,
            duracion: duracion,
            materiaId: selectedMateria,
            materiaNombre: materiasDelCiclo.find(m => m.id === selectedMateria)?.nombre || 'N/A',
            docenteId: selectedDocente,
            docenteNombre: docentes.find(d => d.id === selectedDocente)?.nombreCompleto || 'N/A',
            modalidad: modalidad,
            ...(modalidad === 'Presencial' && {
                sedeId: grupo.idSede,
                sedeNombre: sedes.find(s => s.id === grupo.idSede)?.nombre,
                salonId: selectedSalon,
                salonNombre: salones.find(s => s.id === selectedSalon)?.nombre,
            })
        };
        
        // TODO: Implementar validación de colisiones más robusta
        
        setIsSaving(true);
        try {
            const grupoRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", grupo.id);
            if (existingSchedule) {
                // Remove the old entry and add the new one
                await updateDoc(grupoRef, { horario: arrayRemove(existingSchedule) });
                await updateDoc(grupoRef, { horario: arrayUnion(newSlot) });
                toast({ title: "Éxito", description: "La clase ha sido actualizada correctamente." });
            } else {
                await updateDoc(grupoRef, { horario: arrayUnion(newSlot) });
                toast({ title: "Éxito", description: "La clase ha sido asignada correctamente." });
            }
            onClassAssigned();
            setOpen(false);
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
            await updateDoc(grupoRef, { horario: arrayRemove(existingSchedule) });
            toast({ title: "Clase Eliminada", description: "La clase ha sido eliminada del horario." });
            onClassAssigned();
            setOpen(false);
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? children : <Button><Plus className="mr-2 h-4 w-4" />Asignar Horario</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{existingSchedule ? 'Editar' : 'Asignar'} Horario a {grupo.codigoGrupo}</DialogTitle>
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
                        <Select value={selectedMateria} onValueChange={setSelectedMateria}><SelectTrigger><SelectValue placeholder="Selecciona una materia..." /></SelectTrigger><SelectContent>{materiasDelCiclo.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}</SelectContent></Select>
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
                            <Select value={selectedSalon} onValueChange={setSelectedSalon}><SelectTrigger><SelectValue placeholder="Selecciona un salón..." /></SelectTrigger><SelectContent>{salones.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent></Select>
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
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
