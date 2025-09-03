
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar, Building, School, Plus, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Sede { id: string; nombre: string; }
interface Salon { id: string; nombre: string; }
interface Group { id: string; codigoGrupo: string; materia: { nombre: string } }
interface ScheduleEntry { dia: string; hora: string; duracion: number; materia: string; grupo: string; docente: string; }

const timeSlots = Array.from({ length: 15 }, (_, i) => `${(7 + i).toString().padStart(2, '0')}:00`);
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function SchedulesManagerPage() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [salones, setSalones] = useState<Salon[]>([]);
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [allSchedules, setAllSchedules] = useState<{ [salonId: string]: ScheduleEntry[] }>({});

  const [selectedSede, setSelectedSede] = useState("");
  const [selectedSalon, setSelectedSalon] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const sedesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes"));
      const fetchedSedes = sedesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sede));
      setSedes(fetchedSedes);

      const gruposSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"));
      const fetchedGrupos = gruposSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
      setGrupos(fetchedGrupos);

      const schedulesMap: { [salonId: string]: ScheduleEntry[] } = {};
      gruposSnapshot.forEach(doc => {
          const grupo = doc.data();
          if (grupo.horario && grupo.aula?.salonId) {
              if (!schedulesMap[grupo.aula.salonId]) schedulesMap[grupo.aula.salonId] = [];
              grupo.horario.forEach((slot: any) => {
                  const [startTimeStr, endTimeStr] = slot.hora.split(" - ");
                  const start = new Date(`1970-01-01T${startTimeStr}:00`);
                  const end = new Date(`1970-01-01T${endTimeStr}:00`);
                  const duracion = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                  schedulesMap[grupo.aula.salonId].push({
                      dia: slot.dia,
                      hora: startTimeStr,
                      duracion: Math.max(1, Math.round(duracion)),
                      materia: grupo.materia.nombre,
                      grupo: grupo.codigoGrupo,
                      docente: grupo.docente.nombre
                  });
              });
          }
      });
      setAllSchedules(schedulesMap);

    } catch (error) {
      console.error("Error fetching initial data: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos iniciales." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const fetchSalones = async () => {
      if (!selectedSede) {
        setSalones([]);
        setSelectedSalon("");
        return;
      }
      const salonesRef = collection(db, `Politecnico/mzIX7rzezDezczAV6pQ7/sedes/${selectedSede}/salones`);
      const salonesSnapshot = await getDocs(salonesRef);
      const fetchedSalones = salonesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salon));
      setSalones(fetchedSalones);
    };
    fetchSalones();
  }, [selectedSede]);
  
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
          <CardTitle>Filtro de Horarios</CardTitle>
          <CardDescription>Selecciona una sede y un salón para ver y editar su horario semanal.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
                <label className="text-sm font-medium">Sede</label>
                <Select value={selectedSede} onValueChange={setSelectedSede} disabled={isLoading}>
                    <SelectTrigger>
                        <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder={isLoading ? "Cargando..." : "Selecciona una sede"} />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {sedes.map(sede => <SelectItem key={sede.id} value={sede.id}>{sede.nombre}</SelectItem>)}
                    </SelectContent>
                </Select>
           </div>
           <div className="space-y-2">
                <label className="text-sm font-medium">Salón</label>
                 <Select value={selectedSalon} onValueChange={setSelectedSalon} disabled={!selectedSede}>
                    <SelectTrigger>
                        <div className="flex items-center gap-2">
                            <School className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder={selectedSede ? "Selecciona un salón" : "Elige una sede primero"} />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {salones.map(salon => <SelectItem key={salon.id} value={salon.id}>{salon.nombre}</SelectItem>)}
                    </SelectContent>
                </Select>
           </div>
        </CardContent>
      </Card>
      
      {selectedSede && selectedSalon ? (
        <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <CardTitle>Horario para {salones.find(s => s.id === selectedSalon)?.nombre}</CardTitle>
                    <CardDescription>Sede: {sedes.find(s => s.id === selectedSede)?.nombre}</CardDescription>
                </div>
                 <AssignClassDialog 
                    grupos={grupos} 
                    scheduleForSalon={scheduleForSalon}
                    selectedSalonId={selectedSalon}
                    onClassAssigned={fetchInitialData}
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
            <AlertTitle>Selecciona una Sede y Salón</AlertTitle>
            <AlertDescription>
                Por favor, elige una sede y un salón para visualizar y gestionar el horario correspondiente.
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function AssignClassDialog({ grupos, scheduleForSalon, selectedSalonId, onClassAssigned }: { grupos: Group[], scheduleForSalon: ScheduleEntry[], selectedSalonId: string, onClassAssigned: () => void }) {
    const [open, setOpen] = useState(false);
    const [selectedGrupo, setSelectedGrupo] = useState("");
    const [selectedDia, setSelectedDia] = useState("");
    const [selectedHora, setSelectedHora] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!selectedGrupo || !selectedDia || !selectedHora) {
            toast({ variant: "destructive", title: "Campos incompletos", description: "Por favor, completa todos los campos." });
            return;
        }

        const horaFinNum = parseInt(selectedHora.split(':')[0]) + 2;
        const horaFin = `${horaFinNum.toString().padStart(2, '0')}:00`;
        const newSlot = { dia: selectedDia, hora: `${selectedHora} - ${horaFin}` };

        // Basic conflict check
        const conflict = scheduleForSalon.find(entry => 
            entry.dia === selectedDia && 
            (
                (selectedHora >= entry.hora && selectedHora < entry.hora.split(' - ')[1]) ||
                (horaFin > entry.hora && horaFin <= entry.hora.split(' - ')[1])
            )
        );

        if(conflict) {
            toast({
                variant: "destructive",
                title: "Conflicto de Horario",
                description: `El salón ya está ocupado por ${conflict.materia} (${conflict.grupo}) en ese horario.`
            });
            return;
        }

        setIsSaving(true);
        try {
            const grupoRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", selectedGrupo);
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
                <Button><Plus className="mr-2 h-4 w-4" />Asignar Clase</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asignar Nueva Clase</DialogTitle>
                    <DialogDescription>Selecciona el grupo, día y hora para la nueva clase en este salón.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label>Grupo</label>
                        <Select value={selectedGrupo} onValueChange={setSelectedGrupo}>
                            <SelectTrigger><SelectValue placeholder="Selecciona un grupo..." /></SelectTrigger>
                            <SelectContent>{grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.materia.nombre} ({g.codigoGrupo})</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
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


    