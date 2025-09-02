
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, Search, ArrowLeft, ArrowRight, View, Filter, RotateCcw, List, Calendar, Info } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addWeeks, startOfWeek, endOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ScheduleEntry {
  dia: string;
  horaInicio: string;
  horaFin: string;
  duracion: number;
  materia: string;
  grupo: string;
  docente: string;
  aula: { sede: string; salon: string };
}

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 7;
    return `${hour.toString().padStart(2, '0')}:00`;
});


const colorPalette = [
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-green-100 border-green-300 text-green-800",
  "bg-yellow-100 border-yellow-300 text-yellow-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-pink-100 border-pink-300 text-pink-800",
  "bg-indigo-100 border-indigo-300 text-indigo-800",
  "bg-teal-100 border-teal-300 text-teal-800",
];
let colorIndex = 0;
const subjectColorMap = new Map<string, string>();

const getSubjectColor = (subject: string) => {
    if (!subjectColorMap.has(subject)) {
        subjectColorMap.set(subject, colorPalette[colorIndex % colorPalette.length]);
        colorIndex++;
    }
    return subjectColorMap.get(subject)!;
};

export default function HorariosPage() {
  const [allGroups, setAllGroups] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [filterMateria, setFilterMateria] = useState('all');
  const [filterGrupo, setFilterGrupo] = useState('all');
  
  const [showSchedule, setShowSchedule] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');
    const storedUserEmail = localStorage.getItem('userEmail');
    setUserId(storedUserId);
    setUserRole(storedUserRole);
    setUserEmail(storedUserEmail);
  }, []);

  useEffect(() => {
    if (userRole !== 'docente' || !userEmail) {
        setIsLoading(false);
        return;
    };

    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const groupsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        const userGroupsQuery = query(groupsRef, where("docente.email", "==", userEmail));
        const querySnapshot = await getDocs(userGroupsQuery);
        const fetchedGroups: DocumentData[] = [];
        querySnapshot.forEach(doc => {
          fetchedGroups.push({ id: doc.id, ...doc.data() });
        });
        setAllGroups(fetchedGroups);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [userRole, userEmail]);
  
  const filteredSchedule = useMemo(() => {
    const schedule: ScheduleEntry[] = [];

    const groupsToProcess = allGroups.filter(group => {
      const materiaMatch = filterMateria === 'all' || group.materia.nombre === filterMateria;
      const grupoMatch = filterGrupo === 'all' || group.id === filterGrupo;
      return materiaMatch && grupoMatch;
    });

    groupsToProcess.forEach(group => {
        if (group.horario) {
            group.horario.forEach((slot: { dia: string; hora: string }) => {
                const [startTimeStr, endTimeStr] = slot.hora.split(" - ");
                const start = new Date(`1970-01-01T${startTimeStr}:00`);
                const end = new Date(`1970-01-01T${endTimeStr}:00`);
                const duracion = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                schedule.push({
                    dia: slot.dia,
                    horaInicio: startTimeStr,
                    horaFin: endTimeStr,
                    duracion: Math.max(1, Math.round(duracion)),
                    materia: group.materia.nombre,
                    grupo: group.codigoGrupo,
                    docente: group.docente.nombre,
                    aula: group.aula,
                });
            });
        }
    });
    return schedule;
  }, [allGroups, filterMateria, filterGrupo]);

  const materias = useMemo(() => {
    const uniqueMaterias = [...new Set(allGroups.map(g => g.materia.nombre))];
    return uniqueMaterias.map(m => ({ value: m, label: m }));
  }, [allGroups]);

  const grupos = useMemo(() => {
      if (filterMateria === 'all') return [];
      const filteredGroups = allGroups.filter(g => g.materia.nombre === filterMateria);
      return filteredGroups.map(g => ({ value: g.id, label: g.codigoGrupo }));
  }, [allGroups, filterMateria]);
  
  const scheduleGrid = useMemo(() => {
    const grid: (ScheduleEntry | null)[][] = Array(timeSlots.length).fill(null).map(() => Array(daysOfWeek.length).fill(null));

    filteredSchedule.forEach(entry => {
        const dayIndex = daysOfWeek.indexOf(entry.dia);
        const timeIndex = timeSlots.findIndex(slot => slot >= entry.horaInicio);
        if (dayIndex !== -1 && timeIndex !== -1) {
             grid[timeIndex][dayIndex] = entry;
        }
    });

    return grid;
  }, [filteredSchedule]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Mi Horario de Clases - ${filterMateria === 'all' ? 'Completo' : filterMateria}`, 14, 16);
    autoTable(doc, {
        head: [['Hora', ...daysOfWeek]],
        body: timeSlots.map((time, rowIndex) => [
            time,
            ...daysOfWeek.map((_, dayIndex) => {
                const entry = scheduleGrid[rowIndex][dayIndex];
                return entry ? `${entry.materia}\n${entry.grupo}\n${entry.aula.sede} - ${entry.aula.salon}` : '';
            })
        ]),
        startY: 20,
    });
    doc.save('horario.pdf');
  };
  
  const handleShowSchedule = () => {
    setShowSchedule(true);
  }

  const handleClearFilters = () => {
    setFilterMateria('all');
    setFilterGrupo('all');
    setShowSchedule(false);
  }

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  const renderFilters = () => (
    <Card className="max-w-4xl mx-auto w-full">
        <CardHeader>
            <CardTitle>Filtro de Horario</CardTitle>
            <CardDescription>Selecciona una materia o grupo para visualizar el horario correspondiente.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="space-y-2">
                <label className="text-sm font-medium">Materia</label>
                <Select value={filterMateria} onValueChange={(value) => { setFilterMateria(value); setFilterGrupo('all'); }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filtrar por materia"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las materias y grupos</SelectItem>
                        {materias.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Grupo</label>
                <Select value={filterGrupo} onValueChange={setFilterGrupo} disabled={filterMateria === 'all'}>
                    <SelectTrigger>
                        <SelectValue placeholder={filterMateria === 'all' ? "Selecciona una materia primero" : "Todos los grupos"}/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los grupos</SelectItem>
                        {grupos.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
        <CardContent className="flex flex-col items-center gap-4 pt-0 p-6">
             <Button onClick={handleShowSchedule} size="lg" className="w-full md:w-auto">
                <Calendar className="mr-2 h-4 w-4"/>
                Ver Horario
            </Button>
            <Button variant="link" size="sm" onClick={handleClearFilters} className="text-muted-foreground">
                Limpiar filtros
            </Button>
        </CardContent>
         {!showSchedule && (
            <CardContent className="p-6 pt-0">
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Información</AlertTitle>
                    <AlertDescription>
                        👉 Por favor seleccione una materia y/o grupo para visualizar el horario correspondiente.
                    </AlertDescription>
                </Alert>
            </CardContent>
        )}
    </Card>
  );

  const renderScheduleView = () => (
     <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <CardTitle>Horario de Clases</CardTitle>
                <CardDescription>
                    Semana del {format(weekStart, 'd \'de\' LLLL', { locale: es })} al {format(weekEnd, 'd \'de\' LLLL \'de\' yyyy', { locale: es })}
                </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                 <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => addWeeks(prev, -1))}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => addWeeks(prev, 1))}>
                    <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setViewMode(viewMode === 'week' ? 'day' : 'week')}>
                    {viewMode === 'week' ? 'Vista Día' : 'Vista Semana'}
                </Button>
                <Button variant="secondary" onClick={handleDownloadPDF}>
                    <Download className="mr-2 h-4 w-4"/>
                    Descargar
                </Button>
                <Button variant="ghost" onClick={() => setShowSchedule(false)}>
                    Cambiar Filtros
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <p>Cargando horario...</p>
            ) : filteredSchedule.length > 0 ? (
                 <div className="overflow-x-auto relative">
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
                            {timeSlots.map((time, timeIndex) => {
                                return (
                                    <TableRow key={time}>
                                        <TableCell className="border-r text-center font-mono text-xs text-muted-foreground align-top pt-2">
                                            {time}
                                        </TableCell>
                                        {daysOfWeek.map((day) => {
                                            const entry = filteredSchedule.find(e => e.dia === day && e.horaInicio === time);
                                            
                                            if (entry) {
                                                const prevEntry = filteredSchedule.find(e => e.dia === day && e.horaFin > time && e.horaInicio < time);
                                                if (prevEntry) return null;
                                            }

                                            return (
                                                <TableCell key={day} rowSpan={entry?.duracion || 1} className={`border-r p-1 align-top h-24 ${entry ? getSubjectColor(entry.materia) : ''}`}>
                                                    {entry && (
                                                        <div className="bg-white/70 p-2 rounded-md h-full flex flex-col justify-center text-xs">
                                                            <p className="font-bold">{entry.materia}</p>
                                                            <p>{entry.grupo}</p>
                                                            <p className="text-muted-foreground">{entry.docente}</p>
                                                            <p className="text-muted-foreground">{entry.aula.sede} - {entry.aula.salon}</p>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                 </div>
            ) : (
                <Alert>
                    <CalendarIcon className="h-4 w-4"/>
                    <AlertTitle>No hay clases</AlertTitle>
                    <AlertDescription>
                        No hay clases programadas según los filtros seleccionados o en tu horario general.
                    </AlertDescription>
                </Alert>
            )}
        </CardContent>
      </Card>
  );
  
   const renderForStudent = () => (
     <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <CardTitle>Horario de Clases</CardTitle>
                <CardDescription>
                    Semana del {format(weekStart, 'd \'de\' LLLL', { locale: es })} al {format(weekEnd, 'd \'de\' LLLL \'de\' yyyy', { locale: es })}
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => addWeeks(prev, -1))}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => addWeeks(prev, 1))}>
                    <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setViewMode(viewMode === 'week' ? 'day' : 'week')}>
                    {viewMode === 'week' ? 'Vista Día' : 'Vista Semana'}
                </Button>
                <Button variant="secondary" onClick={handleDownloadPDF}>
                    <Download className="mr-2 h-4 w-4"/>
                    Descargar
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            {/* Aquí iría la lógica de renderizado del horario para estudiantes */}
             <Alert>
                <CalendarIcon className="h-4 w-4"/>
                <AlertTitle>Horario de Estudiante</AlertTitle>
                <AlertDescription>
                   El horario detallado para estudiantes se cargará aquí.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mi Horario"
        description="Visualiza tu agenda de clases y planifica tu semana."
        icon={<CalendarIcon className="h-8 w-8 text-primary" />}
      />
      
      {userRole === 'docente' ? (
        showSchedule ? renderScheduleView() : renderFilters()
      ) : (
        renderForStudent()
      )}

    </div>
  );
}
