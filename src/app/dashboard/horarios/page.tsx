
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, Info, Clock, User, Building, BookOpen, Filter, View } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { startOfWeek, format } from 'date-fns';
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

export default function HorariosPage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const studentDocRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", userId);
        const studentSnap = await getDoc(studentDocRef);

        if (!studentSnap.exists()) {
          setSchedule([]);
          setIsLoading(false);
          return;
        }

        const studentData = studentSnap.data();
        const enrolledSubjectIds = (studentData.materiasInscritas || []).map((m: any) => m.id);

        if (enrolledSubjectIds.length === 0) {
            setSchedule([]);
            setIsLoading(false);
            return;
        }

        const groupsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        const studentGroupsQuery = query(groupsRef, where("materia.id", "in", enrolledSubjectIds));
        const groupsSnapshot = await getDocs(studentGroupsQuery);

        const finalSchedule: ScheduleEntry[] = [];
        groupsSnapshot.forEach(groupDoc => {
            const group = groupDoc.data();
            if (group.estudiantes?.some((est: any) => est.id === userId)) {
                if (group.horario) {
                    group.horario.forEach((slot: { dia: string; hora: string }) => {
                        const [startTimeStr, endTimeStr] = slot.hora.split(" - ");
                        const start = new Date(`1970-01-01T${startTimeStr}:00`);
                        const end = new Date(`1970-01-01T${endTimeStr}:00`);
                        const duracion = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                        finalSchedule.push({
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
            }
        });

        finalSchedule.sort((a, b) => daysOfWeek.indexOf(a.dia) - daysOfWeek.indexOf(b.dia) || a.horaInicio.localeCompare(a.horaInicio));
        setSchedule(finalSchedule);

      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedule();
  }, [userId]);

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
                        markedDays={markedDays}
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
                                                <p className="font-semibold">{entry.materia}</p>
                                            </div>
                                        </div>
                                         <div className="flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-primary"/>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Horario</p>
                                                <p className="font-semibold">{entry.horaInicio} - {entry.horaFin}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-5 w-5 text-primary"/>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Docente</p>
                                                <p className="font-semibold">{entry.docente}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Building className="h-5 w-5 text-primary"/>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Ubicación</p>
                                                <p className="font-semibold">{entry.aula.sede} - {entry.aula.salon}</p>
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
