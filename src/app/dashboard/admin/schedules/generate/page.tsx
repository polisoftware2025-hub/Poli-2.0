"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Wand2, Building, BookCopy, Users, Info, Clock, Calendar, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Stepper, StepperItem } from "@/components/ui/stepper";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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

const TeacherScheduleModal = ({ docente }: { docente: Docente }) => {
    const availability = docente.disponibilidad || {};
    const schedule = docente.horarioAsignado || [];
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant={schedule.length > 0 ? "outline" : "secondary"} size="sm" className={schedule.length > 0 ? "border-amber-500 text-amber-700 hover:bg-amber-50" : ""}>
                    <Eye className="mr-2 h-4 w-4"/> Ver Horario
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
                            <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">Este docente no ha configurado su disponibilidad.</p>
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


export default function GenerateSchedulePage({ setActiveStep, activeStep }: {setActiveStep: any, activeStep: any}) {
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
    const [subjectConfig, setSubjectConfig] = useState<any>({});
    
    const groupWithSchedule = useMemo(() => {
        if (selectedGrupo !== 'all') {
            const group = grupos.find(g => g.id === selectedGrupo);
            if (group && group.horario && group.horario.length > 0) {
                return group;
            }
        }
        return null;
    }, [selectedGrupo, grupos]);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const sedesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes"));
                setSedes(sedesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sede)));

                const carrerasSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
                setCarreras(carrerasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Career)));
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos iniciales." });
            }
        };
        fetchInitialData();
    }, [toast]);
    
    useEffect(() => {
        if (!selectedSede) return;

        const fetchDocentesAndSchedules = async () => {
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
        };
        
        fetchDocentesAndSchedules();
    }, [selectedSede]);

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
    
    const materiasDelCiclo = useMemo(() => {
        if (!selectedCarrera || !selectedCiclo) return [];
        const carrera = carreras.find(c => c.id === selectedCarrera);
        const ciclo = carrera?.ciclos.find(c => c.numero === parseInt(selectedCiclo));
        return ciclo?.materias || [];
    }, [selectedCarrera, selectedCiclo, carreras]);
    
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
                body: JSON.stringify({ sedeId: selectedSede, carreraId: selectedCarrera, ciclo: parseInt(selectedCiclo) }),
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
    
    const handleSubjectConfigChange = (materiaId: string, field: string, value: any) => {
        setSubjectConfig((prev: any) => ({
            ...prev,
            [materiaId]: {
                ...(prev[materiaId] || {}),
                [field]: value,
            }
        }));
    };
    
    return (
        <div className="flex flex-col gap-8 h-full">
            <PageHeader
                title="Asistente de Generación de Horarios"
                description="Configura las reglas y preferencias para generar un nuevo horario automáticamente."
                icon={<Wand2 className="h-8 w-8 text-primary" />}
                backPath="/dashboard/admin/schedules"
            />
            <Stepper initialStep={0} orientation="horizontal">
                <StepperItem title="Parámetros">
                    <div className="py-4 space-y-4 max-w-2xl mx-auto">
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
                        {groupWithSchedule && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Horario Existente para {groupWithSchedule.codigoGrupo}</AlertTitle>
                                <AlertDescription>
                                    Este grupo ya tiene un horario. Continuar lo sobrescribirá.
                                    <Table className="mt-2 text-xs bg-white">
                                        <TableHeader><TableRow><TableHead>Materia</TableHead><TableHead>Día</TableHead><TableHead>Hora</TableHead><TableHead>Docente</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {groupWithSchedule.horario?.map(h => (
                                                <TableRow key={h.id}><TableCell>{h.materiaNombre}</TableCell><TableCell>{h.dia}</TableCell><TableCell>{h.hora}</TableCell><TableCell>{h.docenteNombre}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </StepperItem>
                <StepperItem title="Docentes">
                    <div className="py-4 space-y-4 max-w-3xl mx-auto">
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
                                                    <TeacherScheduleModal docente={docente} />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </StepperItem>
                <StepperItem title="Materias">
                    <div className="py-4 space-y-4">
                        <Label className="text-center block">Configura cada materia (opcional). Lo que no definas, el sistema lo asignará automáticamente.</Label>
                        <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader><TableRow><TableHead>Materia</TableHead><TableHead>Modalidad</TableHead><TableHead>Docente (Opcional)</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {materiasDelCiclo.map(materia => (
                                    <TableRow key={materia.id}>
                                        <TableCell className="font-medium">{materia.nombre}</TableCell>
                                        <TableCell>
                                            <Select onValueChange={(val) => handleSubjectConfigChange(materia.id, 'modalidad', val)}><SelectTrigger><SelectValue placeholder="Auto"/></SelectTrigger><SelectContent><SelectItem value="Presencial">Presencial</SelectItem><SelectItem value="Virtual">Virtual</SelectItem></SelectContent></Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select onValueChange={(val) => handleSubjectConfigChange(materia.id, 'docenteId', val)}><SelectTrigger><SelectValue placeholder="Automático"/></SelectTrigger><SelectContent>{docentes.filter(d => selectedDocentes.includes(d.id)).map(d => <SelectItem key={d.id} value={d.id}>{d.nombreCompleto}</SelectItem>)}</SelectContent></Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    </div>
                </StepperItem>
            </Stepper>
        </div>
    );
}
