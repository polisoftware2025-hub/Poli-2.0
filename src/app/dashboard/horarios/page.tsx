
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, CalendarDays, Eye, Edit, ListFilter, XCircle, ArrowLeft, Home, ChevronRight, Clock, User, MapPin } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


interface ScheduleEntry {
  dia: string;
  horaInicio: string;
  horaFin: string;
  materia: string;
  grupo: string;
  docente: string;
  aula: { sede: string; salon:string };
  duracion: number;
  color: string;
}

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const timeSlots = Array.from({ length: 16 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

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
  const [filterMateria, setFilterMateria] = useState('all');
  
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
                const [startTimeStr, endTimeStr] = slot.hora.split(" - ");
                const startHour = parseInt(startTimeStr.split(":")[0]);
                const endHour = parseInt(endTimeStr.split(":")[0]);
                const duration = endHour - startHour;

                parsedSchedule.push({
                    dia: slot.dia,
                    horaInicio: startTimeStr,
                    horaFin: endTimeStr,
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
    return allSchedule.filter(entry => filterMateria === 'all' || entry.materia === filterMateria);
  }, [allSchedule, filterMateria]);

  const getGridRowForTime = (time: string) => {
    const hour = parseInt(time.split(":")[0]);
    const minutes = parseInt(time.split(":")[1]);
    const totalMinutes = (hour - 7) * 60 + minutes;
    return (totalMinutes / 30) + 1; 
  };


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
                    Mi Horario Semanal
                  </CardTitle>
                  <CardDescription className="font-poppins text-gray-600">
                     Visualiza tu agenda de clases en formato de línea de tiempo.
                  </CardDescription>
                </div>
              </div>
            </div>
             <div className="flex flex-col md:flex-row gap-2">
                 <Select value={filterMateria} onValueChange={setFilterMateria}>
                    <SelectTrigger className="w-full md:w-56">
                        <ListFilter className="h-4 w-4 mr-2 text-muted-foreground"/>
                        <SelectValue placeholder="Filtrar por materia"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las materias</SelectItem>
                        {materias.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Button variant="secondary" onClick={handleDownloadPDF} className="w-full md:w-auto">
                    <Download className="mr-2 h-4 w-4"/>
                    Descargar
                </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="w-full overflow-x-auto">
        <div className="grid min-w-[1200px]" style={{ gridTemplateColumns: 'auto repeat(6, 1fr)' }}>
            <div className="relative">
                {/* Empty corner */}
            </div>
            {daysOfWeek.map(day => (
                <div key={day} className="text-center font-bold p-2 border-b border-r">{day}</div>
            ))}
            
            <div className="relative row-start-2 border-r">
                {timeSlots.map(time => (
                    <div key={time} className="relative h-14">
                        <span className="absolute -top-2.5 right-2 text-xs text-muted-foreground bg-background px-1">{time}</span>
                    </div>
                ))}
            </div>

            {daysOfWeek.map((day, dayIndex) => (
                <div key={day} className="relative row-start-2 border-r" style={{ gridColumn: dayIndex + 2 }}>
                    {/* Grid lines for hours */}
                    {timeSlots.map((_, index) => (
                        <div key={index} className="h-14 border-b"></div>
                    ))}
                    
                    {/* Schedule entries */}
                    {schedule.filter(s => s.dia === day).map((entry, index) => {
                        const startRow = getGridRowForTime(entry.horaInicio);
                        const endRow = getGridRowForTime(entry.horaFin);

                        return (
                            <div key={index} 
                                className={`absolute w-full p-2 rounded-lg shadow-md flex flex-col justify-center ${entry.color}`}
                                style={{
                                    top: `${(startRow - 1) * 3.5}rem`, // 3.5rem = 14 * 0.25rem (h-14)
                                    height: `${(endRow - startRow) * 3.5}rem`
                                }}
                            >
                                <p className="font-bold text-sm truncate">{entry.materia}</p>
                                <p className="text-xs">{entry.docente}</p>
                                <p className="text-xs text-muted-foreground">{entry.aula.sede} - {entry.aula.salon}</p>
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
      </div>
      
      {isLoading && (
          <div className="text-center text-muted-foreground p-8">Cargando horario...</div>
      )}

      {!isLoading && schedule.length === 0 && (
          <Alert>
              <CalendarIcon className="h-4 w-4"/>
              <AlertTitle>Sin Horario</AlertTitle>
              <AlertDescription>
                  No tienes un horario asignado o los filtros no devuelven resultados.
              </AlertDescription>
          </Alert>
      )}

    </div>
  );
}
