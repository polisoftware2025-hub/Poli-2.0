
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar, Clock } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduleEntry {
  dia: string;
  hora: string;
  materia: string;
  grupo: string;
  docente: string;
  duracion: number;
}

const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = 7 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const gruposRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        const studentGroups: DocumentData[] = [];
        
        const querySnapshot = await getDocs(gruposRef);
        querySnapshot.forEach(doc => {
            const group = doc.data();
            if (group.estudiantes && group.estudiantes.some((est: any) => est.id === userId)) {
                studentGroups.push({ id: doc.id, ...group });
            }
        });

        const parsedSchedule: ScheduleEntry[] = [];
        studentGroups.forEach(group => {
          group.horario.forEach((slot: { dia: string; hora: string }) => {
            const [startTime, endTime] = slot.hora.split(" - ");
            const startHour = parseInt(startTime.split(":")[0]);
            const endHour = parseInt(endTime.split(":")[0]);
            const duration = endHour - startHour;

            parsedSchedule.push({
              dia: slot.dia,
              hora: startTime.replace(" AM", "").replace(" PM", ""),
              materia: group.materia.nombre,
              grupo: group.codigoGrupo,
              docente: group.docente.nombre,
              duracion: duration,
            });
          });
        });
        
        setSchedule(parsedSchedule);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [userId]);

  const scheduleGrid: (ScheduleEntry | null)[][] = timeSlots.map(() => Array(daysOfWeek.length).fill(null));

  schedule.forEach(entry => {
    const dayIndex = daysOfWeek.indexOf(entry.dia);
    const timeIndex = timeSlots.indexOf(entry.hora);

    if (dayIndex !== -1 && timeIndex !== -1) {
      scheduleGrid[timeIndex][dayIndex] = entry;
      for (let i = 1; i < entry.duracion; i++) {
        if (timeIndex + i < timeSlots.length) {
          scheduleGrid[timeIndex + i][dayIndex] = { ...entry, materia: 'SPAN' }; // Mark as spanned
        }
      }
    }
  });


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mi Horario"
        description="Consulta tu horario de clases de la semana."
        icon={<Calendar className="h-8 w-8 text-primary" />}
      />

       <Card>
        <CardContent className="p-4 md:p-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : schedule.length > 0 ? (
            <div className="overflow-x-auto">
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
                          return null; // Don't render cell for spanned entries
                        }
                        return (
                          <TableCell key={day} rowSpan={entry?.duracion || 1} className={`border-r p-1 align-top h-20 ${entry ? 'bg-primary/5' : ''}`}>
                            {entry && (
                              <div className="bg-white p-2 rounded-md border-l-4 border-primary shadow-sm h-full flex flex-col justify-center">
                                <p className="font-bold text-xs text-primary">{entry.materia}</p>
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
          ) : (
            <div className="text-center text-muted-foreground py-16">
              <Clock className="mx-auto h-12 w-12 text-gray-400"/>
              <h3 className="mt-2 text-lg font-medium">Horario Vacío</h3>
              <p className="mt-1 text-sm text-gray-500">No tienes clases programadas en tu horario.</p>
            </div>
          )}
        </CardContent>
       </Card>
    </div>
  );
}
