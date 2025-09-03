
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar, Building, BookCopy, Users, School, Plus, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Sede { id: string; nombre: string; }
interface Salon { id: string; nombre: string; }
interface Career { id: string; nombre: string; }
interface Group { id: string; codigoGrupo: string; materia: { nombre: string }; ciclo: number; docente: { nombre: string; }; horario?: any[]; }
interface ScheduleEntry { dia: string; hora: string; duracion: number; materia: string; grupo: string; docente: string; }

const timeSlots = Array.from({ length: 15 }, (_, i) => `${(7 + i).toString().padStart(2, '0')}:00`);
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function SchedulesAdminPage() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [carreras, setCarreras] = useState<Career[]>([]);
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [salones, setSalones] = useState<Salon[]>([]);
  
  const [allSchedules, setAllSchedules] = useState<{ [salonId: string]: ScheduleEntry[] }>({});

  const [selectedSede, setSelectedSede] = useState("");
  const [selectedCarrera, setSelectedCarrera] = useState("");
  const [selectedGrupo, setSelectedGrupo] = useState("");
  const [selectedSalon, setSelectedSalon] = useState("");
  
  const [isLoading, setIsLoading] = useState({ sedes: true, carreras: true, grupos: false, salones: false });
  const { toast } = useToast();

  useEffect(() => {
    const fetchSedesAndCarreras = async () => {
      try {
        const sedesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes"));
        setSedes(sedesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sede)));
        
        const carrerasSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
        setCarreras(carrerasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Career)));
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar sedes o carreras." });
      } finally {
        setIsLoading(prev => ({ ...prev, sedes: false, carreras: false }));
      }
    };
    fetchSedesAndCarreras();
  }, [toast]);
  
  useEffect(() => {
    if (!selectedSede) {
      setSalones([]);
      setGrupos([]);
      setSelectedCarrera("");
      setSelectedGrupo("");
      setSelectedSalon("");
      return;
    }

    const fetchSalonesAndGrupos = async () => {
      setIsLoading(prev => ({ ...prev, salones: true, grupos: true }));
      try {
        const salonesRef = collection(db, `Politecnico/mzIX7rzezDezczAV6pQ7/sedes/${selectedSede}/salones`);
        const salonesSnapshot = await getDocs(salonesRef);
        setSalones(salonesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salon)));
        
        const gruposQuery = query(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"), where("idSede", "==", selectedSede));
        const gruposSnapshot = await getDocs(gruposQuery);
        setGrupos(gruposSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group)));
        
      } catch (error) {
         toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar salones o grupos." });
      } finally {
        setIsLoading(prev => ({ ...prev, salones: false, grupos: false }));
      }
    };
    fetchSalonesAndGrupos();
  }, [selectedSede, toast]);


  const filteredGrupos = useMemo(() => {
      if (!selectedCarrera) return grupos;
      return grupos.filter(g => g.idCarrera === selectedCarrera);
  }, [grupos, selectedCarrera]);

  const scheduleForSalon = useMemo(() => allSchedules[selectedSalon] || [], [allSchedules, selectedSalon]);
  
  const scheduleGrid = useMemo(() => {
    const grid: (ScheduleEntry | null)[][] = timeSlots.map(() => Array(daysOfWeek.length).fill(null));
    scheduleForSalon.forEach(entry => {
      const dayIndex = daysOfWeek.indexOf(entry.dia);
      const timeIndex = timeSlots.indexOf(entry.hora);

      if (dayIndex !== -1 && timeIndex !== -1) {
        grid[timeIndex][dayIndex] = entry;
        for (let i = 1; i < entry.duracion; i++) {
          if (timeIndex + i < timeSlots.length) {
            grid[timeIndex + i][dayIndex] = { ...entry, materia: 'SPAN' };
          }
        }
      }
    });
    return grid;
  }, [scheduleForSalon]);

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
                <label className="text-sm font-medium">Paso 1: Sede</label>
                <Select value={selectedSede} onValueChange={setSelectedSede} disabled={isLoading.sedes}>
                    <SelectTrigger><div className="flex items-center gap-2"><Building className="h-4 w-4" /><SelectValue placeholder={isLoading.sedes ? "Cargando..." : "Selecciona una sede"} /></div></SelectTrigger>
                    <SelectContent>{sedes.map(sede => <SelectItem key={sede.id} value={sede.id}>{sede.nombre}</SelectItem>)}</SelectContent>
                </Select>
           </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Paso 2: Carrera</label>
                 <Select value={selectedCarrera} onValueChange={setSelectedCarrera} disabled={!selectedSede || isLoading.carreras}>
                    <SelectTrigger><div className="flex items-center gap-2"><BookCopy className="h-4 w-4" /><SelectValue placeholder={!selectedSede ? "Elige sede" : "Selecciona una carrera"} /></div></SelectTrigger>
                    <SelectContent>{carreras.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                </Select>
           </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Paso 3: Grupo</label>
                 <Select value={selectedGrupo} onValueChange={setSelectedGrupo} disabled={!selectedCarrera || isLoading.grupos}>
                    <SelectTrigger><div className="flex items-center gap-2"><Users className="h-4 w-4" /><SelectValue placeholder={!selectedCarrera ? "Elige carrera" : (isLoading.grupos ? "Cargando..." : "Selecciona un grupo")} /></div></SelectTrigger>
                    <SelectContent>{filteredGrupos.map(g => <SelectItem key={g.id} value={g.id}>{g.codigoGrupo}</SelectItem>)}</SelectContent>
                </Select>
           </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Paso 4: Salón</label>
                 <Select value={selectedSalon} onValueChange={setSelectedSalon} disabled={!selectedSede || isLoading.salones}>
                    <SelectTrigger><div className="flex items-center gap-2"><School className="h-4 w-4" /><SelectValue placeholder={!selectedSede ? "Elige sede" : (isLoading.salones ? "Cargando..." : "Selecciona un salón")} /></div></SelectTrigger>
                    <SelectContent>{salones.map(salon => <SelectItem key={salon.id} value={salon.id}>{salon.nombre}</SelectItem>)}</SelectContent>
                </Select>
           </div>
        </CardContent>
      </Card>
      
      {selectedSalon ? (
        <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <CardTitle>Horario para {salones.find(s => s.id === selectedSalon)?.nombre}</CardTitle>
                    <CardDescription>Sede: {sedes.find(s => s.id === selectedSede)?.nombre}</CardDescription>
                </div>
                 <AssignClassDialog 
                    key={`${selectedGrupo}-${selectedSalon}`} // Remount component on selection change
                    selectedGrupoId={selectedGrupo}
                    selectedSalonId={selectedSalon}
                    grupos={filteredGrupos}
                    onClassAssigned={() => {}} // Re-fetch logic needs to be implemented
                 />
            </CardHeader>
            <CardContent className="p-4 md:p-6">
                <div className="w-full overflow-x-auto">
                    <Table className="min-w-full border">
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-24 border-r text-center font-bold">Hora</TableHead>
                            {daysOfWeek.map(day => (
                            <TableHead key={day} className="border-r text-center font-bold">{day}</TableHead>
                            ))}
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {timeSlots.map((time, timeIndex) => (
                            <TableRow key={time}>
                            <TableCell className="border-r text-center font-mono text-xs text-muted-foreground">{time}</TableCell>
                            {daysOfWeek.map((day, dayIndex) => {
                                const entry = scheduleGrid[timeIndex][dayIndex];
                                if (entry?.materia === 'SPAN') return null;
                                return (
                                <TableCell key={day} rowSpan={entry?.duracion || 1} className={`border-r p-1 align-top h-20 ${entry ? 'bg-primary/5 cursor-pointer hover:bg-primary/10' : 'hover:bg-gray-50 cursor-pointer'}`}>
                                    {entry && (
                                    <div className="bg-white p-2 rounded-md border-l-4 border-blue-500 shadow-sm h-full flex flex-col justify-center">
                                        <p className="font-bold text-xs text-blue-800">{entry.materia}</p>
                                        <p className="text-xs text-muted-foreground">{entry.grupo}</p>
                                        <p className="text-xs text-muted-foreground">{entry.docente}</p>
                                    </div>
                                    )}
                                </TableCell>
                                );
                            })}
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
                Por favor, elige una sede y un salón para visualizar y gestionar el horario correspondiente.
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function AssignClassDialog({ selectedGrupoId, selectedSalonId, grupos, onClassAssigned }: { selectedGrupoId: string, selectedSalonId: string, grupos: Group[], onClassAssigned: () => void }) {
    const [open, setOpen] = useState(false);
    const [selectedDia, setSelectedDia] = useState("");
    const [selectedHora, setSelectedHora] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const selectedGrupo = useMemo(() => grupos.find(g => g.id === selectedGrupoId), [selectedGrupoId, grupos]);

    const handleSubmit = async () => {
        if (!selectedGrupo || !selectedDia || !selectedHora || !selectedSalonId) {
            toast({ variant: "destructive", title: "Campos incompletos", description: "Debes seleccionar un grupo, día, hora y salón." });
            return;
        }

        const horaFinNum = parseInt(selectedHora.split(':')[0]) + 2;
        const horaFin = `${horaFinNum.toString().padStart(2, '0')}:00`;
        const newSlot = { 
            dia: selectedDia, 
            hora: `${selectedHora} - ${horaFin}`,
            materia: selectedGrupo.materia.nombre,
            docente: selectedGrupo.docente.nombre,
            salonId: selectedSalonId,
        };

        setIsSaving(true);
        try {
            // Check for conflicts
            const allGroupsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
            const q = query(allGroupsRef, where("horario", "array-contains", { salonId: selectedSalonId, dia: selectedDia }));
            // This is a simplified check. A robust check would need to iterate and compare time ranges.
            // For now, we proceed, but log a warning.
            // console.warn("Conflict check needs to be more robust.");


            const grupoRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", selectedGrupo.id);
            await updateDoc(grupoRef, {
                horario: arrayUnion(newSlot)
            });
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
                <Button disabled={!selectedGrupoId || !selectedSalonId}><Plus className="mr-2 h-4 w-4" />Asignar Horario</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asignar Horario a Grupo</DialogTitle>
                    <DialogDescription>
                        Grupo: <span className="font-semibold">{selectedGrupo?.codigoGrupo || 'N/A'}</span> <br/>
                        Salón: <span className="font-semibold">{selectedSalonId}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label>Día</label>
                        <Select value={selectedDia} onValueChange={setSelectedDia}>
                            <SelectTrigger><SelectValue placeholder="Selecciona un día..." /></SelectTrigger>
                            <SelectContent>{daysOfWeek.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label>Hora de Inicio (clases de 2 horas)</label>
                        <Select value={selectedHora} onValueChange={setSelectedHora}>
                            <SelectTrigger><SelectValue placeholder="Selecciona una hora..." /></SelectTrigger>
                            <SelectContent>{timeSlots.slice(0, -2).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar Asignación"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
