
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, ListFilter } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Clock, User, MapPin } from "lucide-react";

interface ScheduleEntry {
  dia: string;
  horaInicio: string;
  horaFin: string;
  materia: string;
  grupo: string;
  docente: string;
  aula: { sede: string; salon: string };
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

export default function HorariosPage() {
  const [allSchedule, setAllSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [filterMateria, setFilterMateria] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
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
                parsedSchedule.push({
                    dia: slot.dia,
                    horaInicio: startTimeStr,
                    horaFin: endTimeStr,
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
  
  const scheduleForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = daysOfWeek[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1];
    return allSchedule
      .filter(entry => entry.dia === dayOfWeek)
      .filter(entry => filterMateria === 'all' || entry.materia === filterMateria)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }, [allSchedule, selectedDate, filterMateria]);


  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const teacherName = allSchedule.length > 0 ? allSchedule[0].docente : 'Docente';
    const date = new Date().toLocaleDateString('es-CO');

    doc.text(`Horario de Clases - ${userRole === 'docente' ? teacherName : (userEmail || 'Estudiante')}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Generado el: ${date}`, 14, 22);

    const tableColumn = ["Día", "Hora", "Materia", "Grupo", "Aula", "Docente"];
    const tableRows: (string|null)[][] = [];

    allSchedule.sort((a,b) => {
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
      <PageHeader
        title="Mi Horario Semanal"
        description="Visualiza tu agenda de clases y planifica tu semana."
        icon={<CalendarIcon className="h-8 w-8 text-primary" />}
      />

       <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                <ListFilter className="h-5 w-5 text-muted-foreground"/>
                <Select value={filterMateria} onValueChange={setFilterMateria}>
                    <SelectTrigger className="w-full md:w-56">
                        <SelectValue placeholder="Filtrar por materia"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las materias</SelectItem>
                        {materias.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <Button variant="secondary" onClick={handleDownloadPDF} className="w-full md:w-auto">
                <Download className="mr-2 h-4 w-4"/>
                Descargar Horario PDF
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="p-0 w-full"
              markedDays={allSchedule.map(entry => {
                  // This is a naive implementation. For a real app, you'd need a robust date library.
                  // This just marks days of the week that have events.
                  const targetDayIndex = daysOfWeek.indexOf(entry.dia);
                  const today = new Date();
                  const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
                  const date = new Date(today);
                  date.setDate(today.getDate() - currentDayIndex + targetDayIndex);
                  return date;
              })}
          />
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
               <CardTitle>
                Clases para el {selectedDate ? selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'día seleccionado'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : scheduleForSelectedDay.length > 0 ? (
                 <div className="space-y-6">
                    {scheduleForSelectedDay.map((entry, index) => (
                        <div key={index} className={`p-4 rounded-lg border-l-4 ${getSubjectColor(entry.materia)}`}>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                                <h3 className="font-bold text-lg">{entry.materia}</h3>
                                <p className="font-mono font-semibold text-sm flex items-center gap-2"><Clock className="h-4 w-4"/> {entry.horaInicio} - {entry.horaFin}</p>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p className="flex items-center gap-2"><User className="h-4 w-4"/> Docente: {entry.docente}</p>
                                <p className="flex items-center gap-2"><MapPin className="h-4 w-4"/> Aula: {entry.aula.sede} - {entry.aula.salon}</p>
                            </div>
                        </div>
                    ))}
                 </div>
              ) : (
                <Alert>
                    <CalendarIcon className="h-4 w-4"/>
                    <AlertTitle>Día Libre</AlertTitle>
                    <AlertDescription>
                        No tienes clases programadas para este día.
                    </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
