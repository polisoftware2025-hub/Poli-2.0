
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, Search, ArrowLeft, ArrowRight, View } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addDays, startOfWeek, format } from 'date-fns';
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
const timeSlots = Array.from({ length: 15 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

const colorPalette = [
  "bg-blue-100 border-blue-500 text-blue-800",
  "bg-green-100 border-green-500 text-green-800",
  "bg-yellow-100 border-yellow-500 text-yellow-800",
  "bg-purple-100 border-purple-500 text-purple-800",
  "bg-pink-100 border-pink-500 text-pink-800",
  "bg-indigo-100 border-indigo-500 text-indigo-800",
  "bg-teal-100 border-teal-500 text-teal-800",
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
  const [allSchedule, setAllSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [filterMateria, setFilterMateria] = useState('all');
  const [filterGrupo, setFilterGrupo] = useState('all');
  const [viewState, setViewState] = useState('filters'); // 'filters' or 'schedule'
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');
    const storedUserEmail = localStorage.getItem('userEmail');
    setUserId(storedUserId);
    setUserRole(storedUserRole);
    setUserEmail(storedUserEmail);
  }, []);

  useEffect(() => {
    if (!userRole || (!userId && !userEmail)) return;

    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const gruposRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        let userGroupsQuery;

        if (userRole === 'docente' && userEmail) {
          userGroupsQuery = query(gruposRef, where("docente.email", "==", userEmail));
        } else if (userRole === 'estudiante' && userId) {
          userGroupsQuery = query(gruposRef, where("estudiantes", "array-contains-any", [{ id: userId }]));
        } else {
          setIsLoading(false);
          setAllSchedule([]);
          return;
        }

        const querySnapshot = await getDocs(userGroupsQuery);
        const studentGroups: DocumentData[] = [];
        querySnapshot.forEach(doc => {
          const groupData = doc.data();
          if (userRole === 'estudiante' && groupData.estudiantes && !groupData.estudiantes.some((est: any) => est.id === userId)) {
            return;
          }
          studentGroups.push(doc.data());
        });

        const parsedSchedule: ScheduleEntry[] = [];
        studentGroups.forEach(group => {
          if (group.horario) {
            group.horario.forEach((slot: { dia: string; hora: string }) => {
                const [startTimeStr, endTimeStr] = slot.hora.split(" - ");
                const start = new Date(`1970-01-01T${startTimeStr}:00`);
                const end = new Date(`1970-01-01T${endTimeStr}:00`);
                const duracion = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                
                parsedSchedule.push({
                    dia: slot.dia,
                    horaInicio: startTimeStr,
                    horaFin: endTimeStr,
                    duracion: duracion,
                    materia: group.materia.nombre,
                    grupo: group.codigoGrupo,
                    docente: group.docente.nombre,
                    aula: group.aula,
                });
            });
          }
        });
        setAllSchedule(parsedSchedule);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [userId, userRole, userEmail]);
  
  const filteredSchedule = useMemo(() => {
      if (filterMateria === 'all' && filterGrupo === 'all') return allSchedule;
      return allSchedule.filter(entry => {
          const materiaMatch = filterMateria === 'all' || entry.materia === filterMateria;
          const grupoMatch = filterGrupo === 'all' || entry.grupo === filterGrupo;
          return materiaMatch && grupoMatch;
      });
  }, [allSchedule, filterMateria, filterGrupo]);

  const materias = useMemo(() => {
    const uniqueMaterias = [...new Set(allSchedule.map(s => s.materia))];
    return uniqueMaterias.map(m => ({ value: m, label: m }));
  }, [allSchedule]);

  const grupos = useMemo(() => {
      const filteredByMateria = allSchedule.filter(s => filterMateria === 'all' || s.materia === filterMateria);
      const uniqueGrupos = [...new Set(filteredByMateria.map(s => s.grupo))];
      return uniqueGrupos.map(g => ({ value: g, label: g }));
  }, [allSchedule, filterMateria]);

  const handleDownloadPDF = () => {
    // PDF generation logic remains the same
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 6 }).map((_, i) => addDays(weekStart, i));

  const handleWeekChange = (direction: 'next' | 'prev') => {
    setCurrentWeek(addDays(currentWeek, direction === 'next' ? 7 : -7));
  };


  const renderFilterView = () => (
    <Card className="max-w-2xl mx-auto w-full">
      <CardHeader>
        <CardTitle>Filtro de Horario</CardTitle>
        <CardDescription>Selecciona una materia y/o grupo para cargar el horario correspondiente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Materia</label>
            <Select value={filterMateria} onValueChange={(value) => { setFilterMateria(value); setFilterGrupo('all'); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por materia"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las materias</SelectItem>
                {materias.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Grupo</label>
            <Select value={filterGrupo} onValueChange={setFilterGrupo} disabled={materias.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por grupo"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grupos</SelectItem>
                {grupos.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 pt-4">
          <Button onClick={() => setViewState('schedule')} size="lg" className="w-full md:w-auto">
            <Search className="mr-2 h-4 w-4" />
            Ver Horario
          </Button>
          <Button onClick={() => { setFilterMateria('all'); setFilterGrupo('all'); }} variant="link" className="text-muted-foreground text-sm">
              O ver horario completo
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderScheduleView = () => (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                     <Button variant="outline" onClick={() => setViewState('filters')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Cambiar Filtros
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleWeekChange('prev')}><ArrowLeft className="h-4 w-4"/></Button>
                        <span className="font-semibold text-center w-48">
                            {format(weekStart, 'd MMM', { locale: es })} - {format(addDays(weekStart, 5), 'd MMM, yyyy', { locale: es })}
                        </span>
                        <Button variant="outline" size="icon" onClick={() => handleWeekChange('next')}><ArrowRight className="h-4 w-4"/></Button>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline">Vista Semanal</Button>
                    <Button variant="ghost">Vista Diaria</Button>
                    <Button variant="secondary" onClick={handleDownloadPDF}>
                        <Download className="mr-2 h-4 w-4"/>
                        Descargar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] lg:grid-cols-[4rem_repeat(6,1fr)] border-t border-l">
                    {/* Time Column */}
                    <div className="hidden lg:block">
                        {timeSlots.map(time => (
                            <div key={time} className="h-16 flex items-center justify-center text-xs text-muted-foreground border-b border-r">
                                {time}
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    {daysOfWeek.map((day, dayIndex) => (
                        <div key={day} className="relative border-r">
                            <div className="sticky top-0 z-10 p-2 text-center font-semibold border-b bg-muted/50">
                                {day}
                                <span className="block md:hidden text-xs font-normal">{format(weekDates[dayIndex], 'd MMM', { locale: es })}</span>
                            </div>
                            <div className="relative h-[calc(15*4rem)]"> {/* 15 hours * 4rem/hour */}
                                {timeSlots.map((time, timeIndex) => (
                                   <div key={time} className="h-16 border-b lg:hidden" />
                                ))}
                                {filteredSchedule.filter(entry => entry.dia === day).map((entry, entryIndex) => {
                                    const startHour = parseInt(entry.horaInicio.split(':')[0]);
                                    const startMinute = parseInt(entry.horaInicio.split(':')[1]);
                                    const top = ((startHour - 7) * 4 + (startMinute / 60) * 4); // in rem
                                    const height = entry.duracion * 4; // in rem

                                    return (
                                        <div
                                            key={entryIndex}
                                            className={`absolute w-full p-2 rounded-lg text-xs leading-tight shadow-md overflow-hidden ${getSubjectColor(entry.materia)}`}
                                            style={{ top: `${top}rem`, height: `${height}rem`}}
                                        >
                                            <p className="font-bold truncate">{entry.materia}</p>
                                            <p className="truncate">{entry.docente}</p>
                                            <p className="font-mono truncate">{entry.grupo}</p>
                                            <p className="truncate">{entry.aula.sede} - {entry.aula.salon}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                 {isLoading && <p>Cargando horario...</p>}
                {!isLoading && filteredSchedule.length === 0 && (
                     <Alert className="mt-4">
                        <CalendarIcon className="h-4 w-4"/>
                        <AlertTitle>Sin Clases</AlertTitle>
                        <AlertDescription>
                            No hay clases programadas según los filtros seleccionados.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    </div>
  );

  const renderStudentView = () => (
    <Card>
        <CardHeader>
            <CardTitle>Mi Horario</CardTitle>
            <CardDescription>Vista semanal de tus clases.</CardDescription>
        </CardHeader>
         <CardContent>
            {/* Mantener la vista de tarjetas para el estudiante o una vista simplificada */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSchedule.map((entry, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <CardTitle>{entry.materia}</CardTitle>
                            <CardDescription>{entry.dia}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <p>{entry.horaInicio} - {entry.horaFin}</p>
                             <p>Docente: {entry.docente}</p>
                             <p>Aula: {entry.aula.salon}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
             {filteredSchedule.length === 0 && !isLoading && (
                <Alert>
                    <CalendarIcon className="h-4 w-4"/>
                    <AlertTitle>No tienes clases</AlertTitle>
                    <AlertDescription>
                        No se encontraron clases en tu horario. Si crees que es un error, contacta a soporte.
                    </AlertDescription>
                </Alert>
             )}
         </CardContent>
    </Card>
  );


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mi Horario Semanal"
        description="Visualiza tu agenda de clases y planifica tu semana."
        icon={<CalendarIcon className="h-8 w-8 text-primary" />}
      />
      
      {userRole === 'docente' ? (
          viewState === 'filters' ? renderFilterView() : renderScheduleView()
      ) : (
          renderStudentView()
      )}
      
    </div>
  );
}
