
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, ArrowLeft, ArrowRight, Info } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addWeeks, startOfWeek, endOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";


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

  const [filterMateria, setFilterMateria] = useState<string | undefined>(undefined);
  const [filterGrupo, setFilterGrupo] = useState<string | undefined>(undefined);
  
  const [showSchedule, setShowSchedule] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const { toast } = useToast();

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');
    const storedUserEmail = localStorage.getItem('userEmail');
    setUserId(storedUserId);
    setUserRole(storedUserRole);
    setUserEmail(storedUserEmail);
  }, []);

  useEffect(() => {
    if (userRole !== 'docente' && userRole !== null) {
      setIsLoading(false);
      return;
    }
    if (!userEmail) return;

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
      if (filterGrupo && filterGrupo !== 'todos') {
        return group.id === filterGrupo;
      }
      if (filterMateria && filterMateria !== 'todos') {
        return group.materia.nombre === filterMateria;
      }
      if ((!filterMateria || filterMateria === 'todos') && (!filterGrupo || filterGrupo === 'todos')) {
        return true;
      }
      return false;
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
    return schedule.sort((a, b) => daysOfWeek.indexOf(a.dia) - daysOfWeek.indexOf(b.dia) || a.horaInicio.localeCompare(b.horaInicio));
  }, [allGroups, filterMateria, filterGrupo]);

  const materias = useMemo(() => {
    const uniqueMaterias = [...new Set(allGroups.map(g => g.materia.nombre))];
    return uniqueMaterias.map(m => ({ value: m, label: m }));
  }, [allGroups]);

  const grupos = useMemo(() => {
      let filteredGroups = allGroups;
      if (filterMateria && filterMateria !== 'todos') {
          filteredGroups = allGroups.filter(g => g.materia.nombre === filterMateria);
      }
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
    const materiaTitle = filterMateria && filterMateria !== 'todos' ? filterMateria : 'Completo';
    const grupoTitle = filterGrupo && filterGrupo !== 'todos' ? grupos.find(g => g.value === filterGrupo)?.label : 'Todos';
    doc.text(`Mi Horario de Clases - Materia: ${materiaTitle}, Grupo: ${grupoTitle}`, 14, 16);
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

  const renderFilters = () => (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filtro de Horario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="materia-select">Materia</Label>
                <Select value={filterMateria} onValueChange={(value) => { 
                    setFilterMateria(value);
                    setFilterGrupo(undefined);
                }}>
                    <SelectTrigger id="materia-select">
                        <SelectValue placeholder="Selecciona una materia"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todas mis materias</SelectItem>
                        {materias.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="grupo-select">Grupo</Label>
                <Select value={filterGrupo} onValueChange={setFilterGrupo} disabled={isLoading || !filterMateria}>
                    <SelectTrigger id="grupo-select">
                        <SelectValue placeholder="Selecciona un grupo"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos los grupos</SelectItem>
                        {grupos.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            
            <Button onClick={handleShowSchedule} size="lg" className="w-full">
                Ver Horario
            </Button>
        </CardContent>
      </Card>
    </div>
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
          <Tabs defaultValue="semanal">
            <TabsList>
              <TabsTrigger value="diaria">Vista Diaria</TabsTrigger>
              <TabsTrigger value="semanal">Vista Semanal</TabsTrigger>
            </TabsList>
            <TabsContent value="diaria" className="mt-4">
               <Alert>
                  <CalendarIcon className="h-4 w-4"/>
                  <AlertTitle>Vista en desarrollo</AlertTitle>
                  <AlertDescription>
                    La vista diaria estará disponible próximamente.
                  </AlertDescription>
                </Alert>
            </TabsContent>
            <TabsContent value="semanal" className="mt-4">
              {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-48 w-full" />
                  </div>
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
                                  let renderedInRow: { [key:string]: boolean } = {};
                                  return (
                                      <TableRow key={time}>
                                          <TableCell className="border-r text-center font-mono text-xs text-muted-foreground align-top pt-2 h-24">
                                              {time}
                                          </TableCell>
                                          {daysOfWeek.map((day) => {
                                              const entry = filteredSchedule.find(e => e.dia === day && e.horaInicio === time);
                                              
                                              if (entry) {
                                                  // Mark subsequent cells as rendered to handle rowSpan
                                                  for(let i=1; i<entry.duracion; i++){
                                                    const nextTime = timeSlots[timeIndex + i];
                                                    if(nextTime){
                                                      renderedInRow[day] = true;
                                                    }
                                                  }

                                                  return (
                                                    <TableCell key={day} rowSpan={entry.duracion} className={`border-r p-1 align-top ${getSubjectColor(entry.materia)}`}>
                                                        <div className="bg-white/70 p-2 rounded-md h-full flex flex-col justify-center text-xs">
                                                            <p className="font-bold">{entry.materia}</p>
                                                            <p>{entry.grupo}</p>
                                                            <p className="text-muted-foreground">{entry.docente}</p>
                                                            <p className="text-muted-foreground">{entry.aula.sede} - {entry.aula.salon}</p>
                                                        </div>
                                                    </TableCell>
                                                  );
                                              }
                                              if (renderedInRow[day]) return null;
                                              
                                              return (<TableCell key={day} className="border-r"></TableCell>)
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
                          No hay clases programadas según los filtros seleccionados.
                      </AlertDescription>
                  </Alert>
              )}
            </TabsContent>
          </Tabs>
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
                <Button variant="secondary" onClick={handleDownloadPDF}>
                    <Download className="mr-2 h-4 w-4"/>
                    Descargar
                </Button>
            </div>
        </CardHeader>
        <CardContent>
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

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mi Horario"
        description="Visualiza tu agenda de clases y planifica tu semana."
        icon={<CalendarIcon className="h-8 w-8 text-primary" />}
      />
      
      {userRole === 'docente' ? (
        showSchedule ? renderScheduleView() : (
          <>
            {renderFilters()}
            {!showSchedule && !isLoading && (
              <div className="w-full max-w-4xl mx-auto mt-4 p-4 bg-primary text-primary-foreground rounded-lg text-center">
                 <p>Por favor seleccione una materia y/o grupo para visualizar el horario correspondiente.</p>
              </div>
            )}
          </>
        )
      ) : userRole === 'estudiante' ? (
        renderForStudent()
      ) : (
         <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
                {isLoading ? "Cargando..." : "La vista de horario no está disponible para tu rol."}
            </CardContent>
        </Card>
      )}

    </div>
  );
}
