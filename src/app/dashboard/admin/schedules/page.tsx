
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar, Building, BookCopy, Users, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, query, where, DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface Sede { id: string; nombre: string; }
interface Career { id: string; nombre: string; ciclos: { materias: { id: string; nombre: string }[] }[]; }
interface Docente { id: string; nombreCompleto: string; }
interface Salon { id: string; nombre: string; }

interface ScheduleEntry {
    dia: string;
    hora: string;
    materia: string;
    docente: string;
    modalidad: "Presencial" | "Virtual";
    ubicacion: string;
}

interface Group {
    id: string;
    codigoGrupo: string;
    idCarrera: string;
    idSede: string;
    ciclo: number;
    horario?: any[];
}

const timeSlots = Array.from({ length: 15 }, (_, i) => `${(7 + i).toString().padStart(2, '0')}:00`);
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function SchedulesAdminPage() {
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [carreras, setCarreras] = useState<Career[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [grupos, setGrupos] = useState<Group[]>([]);
    const [salones, setSalones] = useState<Salon[]>([]);
    
    const [selectedSede, setSelectedSede] = useState("");
    const [selectedCarrera, setSelectedCarrera] = useState("");
    const [selectedGrupo, setSelectedGrupo] = useState<Group | null>(null);
    
    const [isLoading, setIsLoading] = useState({ sedes: true, carreras: true, grupos: false, docentes: true });
    const { toast } = useToast();

    const fetchInitialData = useCallback(async () => {
        setIsLoading(prev => ({ ...prev, sedes: true, carreras: true, docentes: true }));
        try {
            const sedesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes"));
            setSedes(sedesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sede)));
            
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

    const handleSedeChange = async (sedeId: string) => {
        setSelectedSede(sedeId);
        setSelectedCarrera("");
        setSelectedGrupo(null);
        setGrupos([]);
        setSalones([]);

        if (!sedeId) return;

        try {
            const salonesRef = collection(db, `Politecnico/mzIX7rzezDezczAV6pQ7/sedes/${sedeId}/salones`);
            const salonesSnapshot = await getDocs(salonesRef);
            setSalones(salonesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salon)));
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los salones de la sede." });
        }
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

    const onClassAssigned = async () => {
        if (selectedGrupo) {
            const grupoRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", selectedGrupo.id);
            const grupoSnap = await getDoc(grupoRef);
            if (grupoSnap.exists()) {
                setSelectedGrupo({ id: grupoSnap.id, ...grupoSnap.data() } as Group);
            }
        }
    };
    
    const scheduleGrid = useMemo(() => {
        const grid: (ScheduleEntry | null)[][] = timeSlots.map(() => Array(daysOfWeek.length).fill(null));
        if (!selectedGrupo?.horario) return grid;

        selectedGrupo.horario.forEach(entry => {
            const [startTimeStr, _] = entry.hora.split(" - ");
            const dayIndex = daysOfWeek.indexOf(entry.dia);
            const timeIndex = timeSlots.indexOf(startTimeStr);

            if (dayIndex !== -1 && timeIndex !== -1) {
                grid[timeIndex][dayIndex] = {
                    dia: entry.dia,
                    horaInicio: startTimeStr,
                    horaFin: entry.hora.split(" - ")[1],
                    duracion: entry.duracion,
                    materia: entry.materiaNombre,
                    docente: entry.docenteNombre,
                    modalidad: entry.modalidad,
                    ubicacion: entry.modalidad === 'Presencial' ? `${entry.sedeNombre} - ${entry.salonNombre}` : 'Virtual'
                };
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
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            <SelectTrigger><div className="flex items-center gap-2"><BookCopy className="h-4 w-4" /><SelectValue placeholder={!selectedSede ? "Elige sede" : "Selecciona una carrera"} /></div></SelectTrigger>
                            <SelectContent>{carreras.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Paso 3: Grupo</Label>
                        <Select value={selectedGrupo?.id || ""} onValueChange={handleGrupoChange} disabled={!selectedCarrera || isLoading.grupos}>
                            <SelectTrigger><div className="flex items-center gap-2"><Users className="h-4 w-4" /><SelectValue placeholder={!selectedCarrera ? "Elige carrera" : (isLoading.grupos ? "Cargando..." : "Selecciona un grupo")} /></div></SelectTrigger>
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
                            key={selectedGrupo.id}
                            grupo={selectedGrupo}
                            carrera={carreras.find(c => c.id === selectedGrupo.idCarrera)}
                            docentes={docentes}
                            salones={salones}
                            onClassAssigned={onClassAssigned}
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
                                            {row.map((entry, dayIndex) => (
                                                <TableCell key={daysOfWeek[dayIndex]} className="border-r p-1 align-top h-24">
                                                    {entry && (
                                                        <div className="bg-primary/5 p-2 rounded-md border-l-4 border-primary h-full flex flex-col justify-center text-xs">
                                                            <p className="font-bold text-primary">{entry.materia}</p>
                                                            <p className="text-muted-foreground">{entry.docente}</p>
                                                            <p className="text-muted-foreground font-semibold">{entry.ubicacion}</p>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            ))}
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
                        Por favor, elige una sede, carrera y grupo para visualizar y gestionar el horario correspondiente.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

import { Label } from "@/components/ui/label";
import { getDoc } from "firebase/firestore";

function AssignClassDialog({ grupo, carrera, docentes, salones, onClassAssigned }: { grupo: Group, carrera?: Career, docentes: Docente[], salones: Salon[], onClassAssigned: () => void }) {
    const [open, setOpen] = useState(false);
    const [selectedDia, setSelectedDia] = useState("");
    const [selectedHora, setSelectedHora] = useState("");
    const [selectedMateria, setSelectedMateria] = useState("");
    const [selectedDocente, setSelectedDocente] = useState("");
    const [modalidad, setModalidad] = useState<"Presencial" | "Virtual">("Presencial");
    const [selectedSalon, setSelectedSalon] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    
    const materiasDelCiclo = carrera?.ciclos.find(c => c.numero === grupo.ciclo)?.materias || [];

    const handleSubmit = async () => {
        if (!selectedDia || !selectedHora || !selectedMateria || !selectedDocente || (modalidad === 'Presencial' && !selectedSalon)) {
            toast({ variant: "destructive", title: "Campos incompletos", description: "Debes completar todos los campos requeridos." });
            return;
        }

        const horaFinNum = parseInt(selectedHora.split(':')[0]) + 2;
        const horaFin = `${horaFinNum.toString().padStart(2, '0')}:00`;
        
        const newSlot = { 
            dia: selectedDia, 
            hora: `${selectedHora} - ${horaFin}`,
            duracion: 2,
            materiaId: selectedMateria,
            materiaNombre: materiasDelCiclo.find(m => m.id === selectedMateria)?.nombre,
            docenteId: selectedDocente,
            docenteNombre: docentes.find(d => d.id === selectedDocente)?.nombreCompleto,
            modalidad: modalidad,
            ...(modalidad === 'Presencial' && {
                sedeId: grupo.idSede,
                sedeNombre: salones.length > 0 ? (doc(db, "sedes", grupo.idSede).id) : 'N/A', // Simple placeholder
                salonId: selectedSalon,
                salonNombre: salones.find(s => s.id === selectedSalon)?.nombre,
            })
        };
        
        // TODO: Implementar validación de colisiones más robusta
        
        setIsSaving(true);
        try {
            const grupoRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", grupo.id);
            await updateDoc(grupoRef, { horario: arrayUnion(newSlot) });
            toast({ title: "Éxito", description: "La clase ha sido asignada correctamente." });
            onClassAssigned();
            setOpen(false);
        } catch (error) {
            console.error("Error assigning class:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo asignar la clase." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Asignar Horario</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Asignar Horario a {grupo.codigoGrupo}</DialogTitle>
                    <DialogDescription>Completa los detalles para una nueva clase.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Día</Label>
                        <Select value={selectedDia} onValueChange={setSelectedDia}><SelectTrigger><SelectValue placeholder="Selecciona un día..." /></SelectTrigger><SelectContent>{daysOfWeek.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Hora de Inicio</Label>
                        <Select value={selectedHora} onValueChange={setSelectedHora}><SelectTrigger><SelectValue placeholder="Selecciona una hora..." /></SelectTrigger><SelectContent>{timeSlots.slice(0, -2).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
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
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar Asignación"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
