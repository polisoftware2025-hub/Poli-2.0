
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, CalendarDays, Eye, Edit, ListFilter, XCircle, ArrowLeft, Home, ChevronRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { es } from "date-fns/locale";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


interface ScheduleEntry {
  dia: string;
  horaInicio: string;
  horaFin: string;
  materia: string;
  grupo: string;
  docente: string;
  aula: { sede: string; salon: string };
  duracion: number;
  color: string;
}

const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = 7 + i;
  return `${hour.toString().padStart(2, "0")}:00`;
});

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

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

// Componente de Breadcrumbs personalizado para esta página
const HorarioBreadcrumbs = () => {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const homePath = userRole ? `/dashboard/${userRole}` : '/dashboard';
  
  return (
    <nav className="flex items-center text-sm text-muted-foreground">
      <Link href={homePath} className="hover:text-primary transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4 mx-1" />
      <span className="font-medium text-foreground">Horarios</span>
    </nav>
  );
};


export default function HorariosPage() {
  const [allSchedule, setAllSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"semana" | "dia">("semana");
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [filterMateria, setFilterMateria] = useState('all');
  const [filterGrupo, setFilterGrupo] = useState('all');
  const [showSchedule, setShowSchedule] = useState(false);
  
  const router = useRouter();


  const materias = useMemo(() => {
    const uniqueMaterias = [...new Set(allSchedule.map(s => s.materia))];
    return uniqueMaterias.map(m => ({ value: m, label: m }));
  }, [allSchedule]);

  const grupos = useMemo(() => {
    const uniqueGrupos = [...new Set(allSchedule.map(g => g.grupo))];
    return uniqueGrupos.map(g => ({ value: g, label: g }));
  }, [allSchedule]);


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
              const [startTime, endTime] = slot.hora.split(" - ");
              const startHour = parseInt(startTime.split(":")[0]);
              const endHour = parseInt(endTime.split(":")[0]);
              const duration = endHour - startHour;

              parsedSchedule.push({
                dia: slot.dia,
                horaInicio: startTime.replace(" AM", "").replace(" PM", ""),
                horaFin: endTime.replace(" AM", "").replace(" PM", ""),
                materia: group.materia.nombre,
                grupo: group.codigoGrupo,
                docente: group.docente.nombre,
                aula: group.aula,
                duracion: duration,
                color: getSubjectColor(group.materia.nombre),
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
  
  const schedule = useMemo(() => {
    return allSchedule.filter(entry => {
        const materiaMatch = filterMateria === 'all' || entry.materia === filterMateria;
        const grupoMatch = filterGrupo === 'all' || entry.grupo === filterGrupo;
        return materiaMatch && grupoMatch;
    });
  }, [allSchedule, filterMateria, filterGrupo]);

  const scheduleGrid = useMemo(() => {
    const grid: (ScheduleEntry | null)[][] = timeSlots.map(() => Array(daysOfWeek.length).fill(null));
    schedule.forEach(entry => {
      const dayIndex = daysOfWeek.indexOf(entry.dia);
      const timeIndex = timeSlots.indexOf(entry.horaInicio);

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
  }, [schedule]);

  const eventsByDay = useMemo(() => {
    const events: { [key: string]: ScheduleEntry[] } = {};
    schedule.forEach(entry => {
      if (!events[entry.dia]) {
        events[entry.dia] = [];
      }
      events[entry.dia].push(entry);
    });
    // Sort events within each day
    for (const day in events) {
        events[day].sort((a,b) => a.horaInicio.localeCompare(b.horaInicio));
    }
    return events;
  }, [schedule]);
  
  const handleShowSchedule = () => {
    setShowSchedule(true);
  };
  
  const handleBackToFilters = () => {
    setShowSchedule(false);
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const teacherName = allSchedule.length > 0 ? allSchedule[0].docente : 'Docente';
    const date = new Date().toLocaleDateString('es-CO');

    doc.text(`Horario de Clases - ${teacherName}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Generado el: ${date}`, 14, 22);

    const tableColumn = ["Día", "Hora", "Materia", "Grupo", "Aula"];
    const tableRows: (string|null)[][] = [];

    schedule.sort((a,b) => {
        const dayA = daysOfWeek.indexOf(a.dia);
        const dayB = daysOfWeek.indexOf(b.dia);
        if(dayA !== dayB) return dayA - dayB;
        return a.horaInicio.localeCompare(b.horaInicio);
    }).forEach(entry => {
        const scheduleData = [
            entry.dia,
            `${entry.horaInicio} - ${entry.horaFin}`,
            entry.materia,
            entry.grupo,
            `${entry.aula.sede} - ${entry.aula.salon}`
        ];
        tableRows.push(scheduleData);
    });
    
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
    });
    
    doc.save(`Horario_Docente_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const renderWeekView = () => (
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
                  if (entry && entry.materia === 'SPAN') {
                    return null;
                  }
                  return (
                    <TableCell key={day} rowSpan={entry?.duracion || 1} className={`border-r p-1 align-top h-24 ${entry ? 'bg-muted/30' : ''}`}>
                      {entry && (
                        <div className={`p-2 rounded-md border-l-4 h-full flex flex-col justify-center text-xs ${entry.color}`}>
                          <p className="font-bold">{entry.materia}</p>
                          <p className="font-mono text-xs">{entry.grupo} - {entry.aula.salon}</p>
                          <p className="mt-1 text-xs opacity-80">{entry.docente}</p>
                          <p className="mt-1 font-semibold text-xs">{entry.horaInicio} - ${entry.horaFin}</p>
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
  );
  
  const renderDayView = () => {
    const dayName = daysOfWeek[selectedDate.getDay() -1] ?? daysOfWeek[(selectedDate.getDay() + 6) % 7];
    const dayEntries = eventsByDay[dayName] || [];

    return (
        <div className="space-y-4">
            {dayEntries.length > 0 ? dayEntries.map((entry, index) => (
                 <Card key={index} className={`border-l-4 ${entry.color}`}>
                    <CardHeader className="flex flex-row justify-between items-center p-4">
                        <div>
                            <p className="font-bold">{entry.materia}</p>
                            <p className="text-sm text-muted-foreground">{entry.grupo} - {entry.docente}</p>
                        </div>
                         <div className="text-right">
                             <p className="font-semibold text-sm">{entry.horaInicio} - ${entry.horaFin}</p>
                             <p className="text-xs text-muted-foreground">{entry.aula.sede} - {entry.aula.salon}</p>
                         </div>
                    </CardHeader>
                 </Card>
            )) : <p className="text-center text-muted-foreground pt-8">No hay clases programadas para este día.</p>}
        </div>
    )
  };


  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-4">
              <HorarioBreadcrumbs />
              <div className="flex items-center gap-4">
                <CalendarDays className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="font-poppins text-3xl font-bold text-gray-800">
                    Mi Horario
                  </CardTitle>
                  <CardDescription className="font-poppins text-gray-600">
                     {!showSchedule 
                        ? "Selecciona los filtros para visualizar el horario." 
                        : "Consulta tu horario de clases de la semana."
                    }
                  </CardDescription>
                </div>
              </div>
            </div>
             <Button variant="outline" onClick={handleBackToFilters}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      {!showSchedule ? (
        <Card>
            <CardHeader className="border-b">
                <CardTitle>Filtro de Horario</CardTitle>
                <CardDescription>Selecciona los filtros para visualizar el horario.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Materia</label>
                        <Select value={filterMateria} onValueChange={setFilterMateria} disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por materia" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las materias</SelectItem>
                                {materias.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Grupo</label>
                        <Select value={filterGrupo} onValueChange={setFilterGrupo} disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por grupo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los grupos</SelectItem>
                                {grupos.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleShowSchedule} className="w-full">
                        <Eye className="mr-2 h-4 w-4"/>
                        Ver Horario
                    </Button>
                </div>
                <div className="mt-6">
                    <Alert>
                        <ListFilter className="h-4 w-4" />
                        <AlertTitle>Guía de uso</AlertTitle>
                        <AlertDescription>
                           Seleccione un grupo o materia en los filtros para visualizar su horario de clases.
                        </AlertDescription>
                    </Alert>
                </div>
            </CardContent>
        </Card>
      ) : (
        <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b">
                 <div className="flex items-center gap-4">
                    <div className="w-48">
                         <Select value={viewMode} onValueChange={(value) => setViewMode(value as "semana" | "dia")}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="semana">Vista semanal</SelectItem>
                                <SelectItem value="dia">Vista diaria</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {viewMode === "dia" && (
                        <h3 className="font-semibold text-lg text-center">
                            {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={handleDownloadPDF}>
                        <Download className="mr-2 h-4 w-4"/>
                        Descargar
                    </Button>
                     <Button variant="outline" onClick={() => setShowSchedule(false)}>
                        <Edit className="mr-2 h-4 w-4"/>
                        Cambiar Filtros
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : schedule.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {viewMode === 'dia' && (
                        <div className="lg:col-span-1">
                            <Calendar
                                mode="single"
                                locale={es}
                                selected={selectedDate}
                                onSelect={(date) => setSelectedDate(date || new Date())}
                                className="p-0 w-full rounded-md border"
                                disabled={(date) => date.getDay() === 0}
                            />
                        </div>
                    )}
                    <div className={viewMode === 'dia' ? 'lg:col-span-3' : 'lg:col-span-4'}>
                        {viewMode === 'semana' && renderWeekView()}
                        {viewMode === 'dia' && renderDayView()}
                    </div>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>No tienes clases programadas que coincidan con los filtros seleccionados.</p>
                </div>
            )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
