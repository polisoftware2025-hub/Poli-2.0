
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, Clock, User, Building, BookOpen } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateSchedulePdf } from "@/lib/schedule-pdf-generator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    grupoCodigo?: string;
}

interface UserInfo {
  nombreCompleto: string;
  carreraNombre?: string;
  sedeNombre?: string;
}

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const timeSlots = Array.from({ length: 15 }, (_, i) => 7 + i); // 7 AM to 9 PM (21:00)

export default function HorariosPage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');
    setUserId(storedUserId);
    setUserRole(storedUserRole);
  }, []);

  useEffect(() => {
    if (!userId || !userRole) return;

    const fetchScheduleAndUserInfo = async () => {
      setIsLoading(true);
      try {
        let finalSchedule: ScheduleEntry[] = [];
        const userInfoData: UserInfo = { nombreCompleto: "Usuario" };

        const userDocRef = doc(db, `Politecnico/mzIX7rzezDezczAV6pQ7/usuarios`, userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            userInfoData.nombreCompleto = userDocSnap.data().nombreCompleto;
        }

        const groupsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        
        if (userRole === 'estudiante') {
          const studentDocRef = doc(db, `Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes`, userId);
          const studentDocSnap = await getDoc(studentDocRef);
          
          if(studentDocSnap.exists()){
              const studentData = studentDocSnap.data();
              if (studentData.grupo) {
                const groupRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", studentData.grupo);
                const groupSnap = await getDoc(groupRef);
                if (groupSnap.exists()) {
                    const groupData = groupSnap.data();
                    finalSchedule = groupData.horario?.map((h: any) => ({ ...h, grupoCodigo: groupData.codigoGrupo })) || [];
                }
              }
              
              const [carreraDoc, sedeDoc] = await Promise.all([
                 studentData.carreraId ? getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", studentData.carreraId)) : Promise.resolve(null),
                 studentData.sedeId ? getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes", studentData.sedeId)) : Promise.resolve(null),
              ]);
              userInfoData.carreraNombre = carreraDoc?.exists() ? carreraDoc.data().nombre : "N/A";
              userInfoData.sedeNombre = sedeDoc?.exists() ? sedeDoc.data().nombre : "N/A";
          }
        } else if (userRole === 'docente') {
            const allGroupsSnapshot = await getDocs(groupsRef);
            allGroupsSnapshot.forEach(groupDoc => {
                const groupData = groupDoc.data();
                if (groupData.horario && Array.isArray(groupData.horario)) {
                    groupData.horario.forEach((h: any) => {
                        if (h.docenteId === userId) {
                            finalSchedule.push({ ...h, grupoCodigo: groupData.codigoGrupo });
                        }
                    });
                }
            });
        }

        setUserInfo(userInfoData);
        sortAndSetSchedule(finalSchedule);

      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScheduleAndUserInfo();
  }, [userId, userRole]);


  const sortAndSetSchedule = (finalSchedule: any[]) => {
      finalSchedule.sort((a, b) => daysOfWeek.indexOf(a.dia) - daysOfWeek.indexOf(b.dia) || a.hora.localeCompare(b.hora));
      setSchedule(finalSchedule);
  };
  
  const handleDownloadPdf = () => {
    if (!userInfo || schedule.length === 0) return;
    generateSchedulePdf(schedule, userInfo, userRole || "estudiante");
  }
  
  const getGridPosition = (entry: ScheduleEntry) => {
    const dayIndex = daysOfWeek.indexOf(entry.dia) + 2; // +2 because grid columns start at 1, and col 1 is for time
    const startTime = parseInt(entry.hora.split(':')[0]);
    const startRow = timeSlots.indexOf(startTime) + 2; // +2 because grid rows start at 1, and row 1 is for header
    const duration = entry.duracion;

    return {
        gridColumn: `${dayIndex} / span 1`,
        gridRow: `${startRow} / span ${duration}`
    }
  }

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
            <CardTitle>Horario Semanal</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}> 
                    <Button variant="outline" onClick={handleDownloadPdf} disabled={schedule.length === 0 || isLoading}>
                        <Download className="mr-2 h-4 w-4"/>Descargar PDF
                    </Button>
                  </span>
                </TooltipTrigger>
                {schedule.length === 0 && (
                    <TooltipContent>
                        <p>No hay horario disponible para descargar.</p>
                    </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        {isLoading ? (
            <CardContent><p>Cargando horario...</p></CardContent>
        ) : schedule.length > 0 ? (
            <CardContent className="overflow-x-auto">
               <div className="grid grid-cols-[auto_repeat(6,_minmax(120px,_1fr))] grid-rows-[auto_repeat(15,_minmax(60px,_1fr))] gap-px bg-border -ml-px -mt-px border-l border-t">
                  {/* Header de Días */}
                  <div className="sticky top-0 z-10 p-2 text-center font-semibold bg-gray-100 border-b border-r">Hora</div>
                  {daysOfWeek.map(day => (
                      <div key={day} className="sticky top-0 z-10 p-2 text-center font-semibold bg-gray-100 border-b border-r">{day}</div>
                  ))}

                  {/* Filas de Horas */}
                  {timeSlots.map(hour => (
                      <div key={hour} className="p-2 text-center text-xs font-mono text-muted-foreground bg-gray-100 border-b border-r">
                          {`${hour.toString().padStart(2, '0')}:00`}
                      </div>
                  ))}
                  
                  {/* Celdas de Horario */}
                  {timeSlots.flatMap(hour => daysOfWeek.map(day => (
                      <div key={`${day}-${hour}`} className="bg-background border-b border-r"></div>
                  )))}

                  {/* Eventos del Horario */}
                  {schedule.map(entry => (
                      <div key={entry.id} style={getGridPosition(entry)} className="relative flex flex-col p-2 m-px rounded-lg bg-blue-50 border-l-4 border-blue-500 shadow-sm overflow-hidden">
                          <p className="font-bold text-xs text-blue-800">{entry.materiaNombre}</p>
                          <p className="text-[11px] text-gray-600">{entry.docenteNombre}</p>
                          <p className="text-[11px] font-semibold text-gray-700 mt-auto">{entry.modalidad === 'Presencial' ? entry.salonNombre : 'Virtual'}</p>
                      </div>
                  ))}
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
