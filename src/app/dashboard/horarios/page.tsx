
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, CalendarDays, Eye, Edit, ListFilter, XCircle, ArrowLeft, Home, ChevronRight, Clock, User, MapPin } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [filterMateria, setFilterMateria] = useState('all');
  
  const router = useRouter();


  const materias = useMemo(() => {
    const uniqueMaterias = [...new Set(allSchedule.map(s => s.materia))];
    return uniqueMaterias.map(m => ({ value: m, label: m }));
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
        return materiaMatch;
    });
  }, [allSchedule, filterMateria]);

  const eventsByDay = useMemo(() => {
    const events: { [key: string]: ScheduleEntry[] } = {};
    daysOfWeek.forEach(day => events[day] = []);

    schedule.forEach(entry => {
      if (events[entry.dia]) {
        events[entry.dia].push(entry);
      }
    });

    for (const day in events) {
        events[day].sort((a,b) => a.horaInicio.localeCompare(b.horaInicio));
    }
    return events;
  }, [schedule]);
  

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const teacherName = allSchedule.length > 0 ? allSchedule[0].docente : 'Docente';
    const date = new Date().toLocaleDateString('es-CO');

    doc.text(`Horario de Clases - ${userRole === 'docente' ? teacherName : (userEmail || 'Estudiante')}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Generado el: ${date}`, 14, 22);

    const tableColumn = ["Día", "Hora", "Materia", "Grupo", "Aula", "Docente"];
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
            `${entry.aula.sede} - ${entry.aula.salon}`,
            entry.docente
        ];
        tableRows.push(scheduleData);
    });
    
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
    });
    
    doc.save(`Horario_${userRole}_${new Date().toISOString().split('T')[0]}.pdf`);
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
                     Consulta tu horario de clases de la semana.
                  </CardDescription>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      
        <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b">
                 <div className="flex items-center gap-4">
                    <div className="w-full md:w-64">
                         <Select value={filterMateria} onValueChange={setFilterMateria}>
                            <SelectTrigger>
                                <ListFilter className="h-4 w-4 mr-2 text-muted-foreground"/>
                                <SelectValue placeholder="Filtrar por materia"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las materias</SelectItem>
                                {materias.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button variant="secondary" onClick={handleDownloadPDF}>
                    <Download className="mr-2 h-4 w-4"/>
                    Descargar Horario
                </Button>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, index) => (
                        <Card key={index} className="space-y-4 p-4">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-5 w-1/2" />
                        </Card>
                    ))}
                </div>
            ) : schedule.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {daysOfWeek.map(day => (
                        <div key={day} className="flex flex-col gap-4">
                            <h3 className="font-bold text-xl text-center pb-2 border-b-2 border-primary">{day}</h3>
                             {eventsByDay[day] && eventsByDay[day].length > 0 ? (
                                <div className="space-y-4">
                                {eventsByDay[day].map((entry, index) => (
                                    <Card key={index} className={`shadow-md hover:shadow-lg transition-shadow border-l-4 ${entry.color}`}>
                                        <CardContent className="p-4 space-y-3">
                                            <p className="font-bold text-base">{entry.materia}</p>
                                            <div className="text-sm text-muted-foreground space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{entry.horaInicio} - {entry.horaFin}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    <span>{entry.docente}</span>
                                                </div>
                                                 <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{entry.aula.sede} - {entry.aula.salon} ({entry.grupo})</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground pt-8">
                                    <p>No hay clases este día.</p>
                                </div>
                            )}
                        </div>
                    ))}
                 </div>
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    <Alert>
                        <CalendarIcon className="h-4 w-4"/>
                        <AlertTitle>Sin Horario</AlertTitle>
                        <AlertDescription>
                            No tienes un horario asignado o los filtros no devuelven resultados.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            </CardContent>
        </Card>
    </div>
  );
}
