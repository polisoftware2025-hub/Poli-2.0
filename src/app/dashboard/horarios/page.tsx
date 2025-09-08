
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, Clock, User, Building, BookOpen, ChevronLeft, ChevronRight, Filter, Expand } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateSchedulePdf } from "@/lib/schedule-pdf-generator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { eachDayOfInterval, startOfWeek, endOfWeek, format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


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

const timeSlots = Array.from({ length: 16 }, (_, i) => `${(7 + i).toString().padStart(2, '0')}:00`);
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const daysOfWeekMap: { [key: string]: number } = {
  "Lunes": 1, "Martes": 2, "Miércoles": 3, "Jueves": 4, "Viernes": 5, "Sábado": 6
};

export default function HorariosPage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const week = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return {
      start,
      end,
      days: eachDayOfInterval({ start, end: endOfWeek(currentDate, { weekStartsOn: 1 }) }).slice(0, 6), // Only Mon-Sat
    };
  }, [currentDate]);
  
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
        setSchedule(finalSchedule);

      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScheduleAndUserInfo();
  }, [userId, userRole]);


  const handleDownloadPdf = () => {
    if (!userInfo || schedule.length === 0) return;
    generateSchedulePdf(schedule, userInfo, userRole || "estudiante");
  }
  
  const getGridPosition = (entry: ScheduleEntry) => {
    const dayIndex = daysOfWeekMap[entry.dia as keyof typeof daysOfWeekMap];
    if (dayIndex === undefined) return {}; 

    const startTime = parseInt(entry.hora.split(':')[0]);
    const startRow = timeSlots.indexOf(`${startTime.toString().padStart(2, '0')}:00`);
    const duration = entry.duracion;

    if (startRow === -1) return {};

    return {
        gridColumn: `${dayIndex}`,
        gridRow: `${startRow + 1} / span ${duration}`
    }
  }
  
  const changeWeek = (direction: 'next' | 'prev' | 'today') => {
      if (direction === 'today') {
          setCurrentDate(new Date());
      } else {
          const newDate = new Date(currentDate);
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
          setCurrentDate(newDate);
      }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="hidden h-8 w-1 bg-primary rounded-full md:block"></div>
        <h1 className="text-3xl font-bold text-gray-800">Mi horario</h1>
      </div>
      
      <Card className="w-full">
        <CardHeader className="border-b p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => changeWeek('today')}>Hoy</Button>
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeWeek('prev')}><ChevronLeft className="h-5 w-5"/></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeWeek('next')}><ChevronRight className="h-5 w-5"/></Button>
                </div>
                <p className="text-sm font-medium text-gray-700">
                    {format(week.start, "dd/MM/yyyy")} - {format(week.end, "dd/MM/yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/>Exportar horario ICS</Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={schedule.length === 0 || isLoading}><Download className="mr-2 h-4 w-4"/>Documento PDF</Button>
                <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4"/>Filtrar</Button>
                <Button variant="outline" size="sm" className="hidden md:flex"><Expand className="mr-2 h-4 w-4" /> Ampliar</Button>
                 <Select defaultValue="week">
                    <SelectTrigger className="w-[180px] h-9 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">Semana completa</SelectItem>
                        <SelectItem value="day">Día</SelectItem>
                        <SelectItem value="month">Mes</SelectItem>
                    </SelectContent>
                </Select>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
                <div className="p-8 text-center">Cargando horario...</div>
            ) : schedule.length === 0 ? (
                <Alert className="m-4">
                    <CalendarIcon className="h-4 w-4" />
                    <AlertTitle>Sin Horario Asignado</AlertTitle>
                    <AlertDescription>
                        Aún no tienes un horario de clases asignado. Por favor, contacta a la administración.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid grid-cols-[auto_repeat(6,_1fr)] text-sm">
                    {/* Days Header */}
                    <div className="col-start-2 col-span-6 grid grid-cols-6 border-b">
                        {daysOfWeek.map((day, index) => (
                            <div key={day} className="p-2 text-center font-semibold border-r last:border-r-0">
                                <p className="text-xs uppercase text-muted-foreground">{format(week.days[index], 'E', { locale: es })}</p>
                                <p className={`text-lg font-semibold ${isToday(week.days[index]) ? 'text-primary' : ''}`}>
                                    {format(week.days[index], 'd')}
                                </p>
                            </div>
                        ))}
                    </div>
                    
                    {/* Time Column */}
                    <div className="col-start-1 row-start-2 grid grid-rows-16 border-r">
                        {timeSlots.map(hour => (
                            <div key={hour} className="relative -top-3 pr-2 text-right text-xs text-muted-foreground h-[60px] flex items-start justify-end pt-1">
                                {hour}
                            </div>
                        ))}
                    </div>
                    
                    {/* Grid Background and Entries */}
                    <div className="col-start-2 col-span-6 row-start-2 grid grid-cols-6 grid-rows-16 relative">
                        {/* Grid lines */}
                        {Array.from({ length: 16 * 6 }).map((_, i) => (
                            <div key={i} className="border-b border-r h-[60px]"></div>
                        ))}
                        
                        {/* Schedule Entries */}
                        {schedule.map(entry => (
                            <div key={entry.id} style={getGridPosition(entry)} className="absolute p-1 m-px w-[calc(100%_-_2px)] h-[calc(100%_-_2px)]">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex flex-col w-full h-full p-2 rounded-lg bg-blue-50 border-l-4 border-blue-500 shadow-sm overflow-hidden text-xs">
                                                <p className="font-bold text-blue-800 truncate">{entry.materiaNombre}</p>
                                                <p className="text-gray-600">{userRole === 'estudiante' ? entry.docenteNombre : entry.grupoCodigo}</p>
                                                <p className="text-gray-600 font-semibold mt-auto">{entry.modalidad === 'Presencial' ? entry.salonNombre : 'Virtual'}</p>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{entry.materiaNombre}</p>
                                            <p>{entry.hora}</p>
                                            <p>{userRole === 'estudiante' ? `Docente: ${entry.docenteNombre}` : `Grupo: ${entry.grupoCodigo}`}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                           </div>
                       ))}
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

