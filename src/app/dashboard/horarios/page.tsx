
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, Clock, User, Building, BookOpen } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { startOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ScheduleEntry {
    id: string;
    dia: string;
    hora: string;
    duracion: number;
    materiaId: string;
    materiaNombre: string;
    docenteId: string;
    docenteNombre: string;
    modalidad: "Presencial" | "Virtual";
    sedeId?: string;
    sedeNombre?: string;
    salonId?: string;
    salonNombre?: string;
}

interface Group {
    id: string;
    codigoGrupo: string;
    horario?: ScheduleEntry[];
}


const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function HorariosPage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');
    setUserId(storedUserId);
    setUserRole(storedUserRole);
  }, []);

  useEffect(() => {
    if (!userId || !userRole) return;

    const fetchSchedule = async () => {
      setIsLoading(true);
      let userGroups: Group[] = [];
      
      try {
        const groupsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        let q;

        if (userRole === 'estudiante') {
          const studentDoc = await getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", userId));
          if(studentDoc.exists()){
              const studentGroupsSnapshot = await getDocs(query(groupsRef, where('idCarrera', '==', studentDoc.data().carreraId), where('idSede', '==', studentDoc.data().sedeId)));
              userGroups = studentGroupsSnapshot.docs.map(d => ({id: d.id, ...d.data()} as Group));
          }
        } else if (userRole === 'docente') {
          q = query(groupsRef, where("docente.usuarioId", "==", userId));
          const teacherGroupsSnapshot = await getDocs(q);
          userGroups = teacherGroupsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Group));
        }

        const finalSchedule = userGroups.flatMap(g => g.horario || []);
        sortAndSetSchedule(finalSchedule);

      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedule();
  }, [userId, userRole]);


  const sortAndSetSchedule = (finalSchedule: ScheduleEntry[]) => {
      finalSchedule.sort((a, b) => daysOfWeek.indexOf(a.dia) - daysOfWeek.indexOf(b.dia) || a.hora.localeCompare(b.hora));
      setSchedule(finalSchedule);
  };

  const markedDays = useMemo(() => {
    const datesWithClasses: Date[] = [];
    const referenceDate = new Date();
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });

    schedule.forEach(entry => {
      const dayIndex = daysOfWeek.indexOf(entry.dia);
      if (dayIndex !== -1) {
        const classDate = new Date(weekStart);
        classDate.setDate(weekStart.getDate() + dayIndex);
        datesWithClasses.push(classDate);
      }
    });
    return datesWithClasses;
  }, [schedule]);

  const classesForSelectedDay = useMemo(() => {
    if (!currentDate) return [];
    const dayOfWeek = format(currentDate, 'EEEE', { locale: es });
    return schedule.filter(entry => entry.dia.toLowerCase() === dayOfWeek.toLowerCase());
  }, [currentDate, schedule]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mi Horario"
        description="Visualiza tu agenda de clases y planifica tu semana."
        icon={<CalendarIcon className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Horario de Clases</CardTitle>
            <Button variant="outline"><Download className="mr-2 h-4 w-4"/>Descargar</Button>
          </div>
        </CardHeader>
        {isLoading ? (
            <CardContent><p>Cargando horario...</p></CardContent>
        ) : schedule.length > 0 ? (
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Calendar
                        mode="single"
                        selected={currentDate}
                        onSelect={setCurrentDate}
                        locale={es}
                        modifiers={{ marked: markedDays }}
                        modifiersClassNames={{ marked: 'bg-primary/20 rounded-full' }}
                    />
                </div>
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                        Clases para el {currentDate ? format(currentDate, "EEEE, d 'de' MMMM", { locale: es }) : ''}
                    </h3>
                    {classesForSelectedDay.length > 0 ? (
                        <div className="space-y-4">
                            {classesForSelectedDay.map((entry, index) => (
                                <Card key={index} className="bg-muted/50">
                                    <CardContent className="p-4 grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-primary"/>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Materia</p>
                                                <p className="font-semibold">{entry.materiaNombre}</p>
                                            </div>
                                        </div>
                                         <div className="flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-primary"/>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Horario</p>
                                                <p className="font-semibold">{entry.hora}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-5 w-5 text-primary"/>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Docente</p>
                                                <p className="font-semibold">{entry.docenteNombre}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Building className="h-5 w-5 text-primary"/>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Ubicación</p>
                                                <p className="font-semibold">{entry.modalidad === "Presencial" ? `${entry.sedeNombre} - ${entry.salonNombre}` : 'Virtual'}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Alert>
                            <CalendarIcon className="h-4 w-4"/>
                            <AlertTitle>No hay clases programadas</AlertTitle>
                            <AlertDescription>
                                No tienes clases asignadas para el día seleccionado.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </CardContent>
        ) : (
            <CardContent>
                <Alert>
                    <CalendarIcon className="h-4 w-4"/>
                    <AlertTitle>Horario no disponible</AlertTitle>
                    <AlertDescription>
                       No se encontró un horario de clases para ti. Si crees que esto es un error, por favor contacta a soporte.
                    </AlertDescription>
                </Alert>
            </CardContent>
        )}
      </Card>
    </div>
  );
}
