
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
import { eachDayOfInterval, startOfWeek, endOfWeek, format, isToday, getDay, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";


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

const timeSlots = Array.from({ length: 16 * 2 }, (_, i) => {
    const hour = 7 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
});
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];


// Function to generate a consistent, soft color from a string (subject name)
const stringToHslColor = (str: string, s: number, l: number): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};


export default function HorariosPage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const isMobile = useIsMobile();

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
  
  const changeWeek = (direction: 'next' | 'prev' | 'today') => {
      if (direction === 'today') {
          setCurrentDate(new Date());
      } else {
          const newDate = new Date(currentDate);
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
          setCurrentDate(newDate);
      }
  };

  if (isLoading) {
      return (
          <div className="flex flex-col gap-6">
              <Skeleton className="h-20 w-full" />
              <Card>
                  <CardHeader><Skeleton className="h-10 w-full" /></CardHeader>
                  <CardContent><Skeleton className="h-96 w-full" /></CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="hidden h-8 w-1 bg-primary rounded-full md:block"></div>
        <h1 className="text-3xl font-bold text-gray-800">Mi horario</h1>
      </div>
      
       {schedule.length === 0 ? (
            <Alert className="m-4">
                <CalendarIcon className="h-4 w-4" />
                <AlertTitle>Sin Horario Asignado</AlertTitle>
                <AlertDescription>
                    Aún no tienes un horario de clases asignado. Por favor, contacta a la administración.
                </AlertDescription>
            </Alert>
        ) : (
             <ScheduleView 
                schedule={schedule}
                week={week}
                changeWeek={changeWeek}
                isMobile={isMobile}
                handleDownloadPdf={handleDownloadPdf}
                userRole={userRole}
            />
        )}
    </div>
  );
}


function ScheduleView({ schedule, week, changeWeek, isMobile, handleDownloadPdf, userRole }: any) {
    
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const timeToPosition = (date: Date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        if (hours < 7) return 0;
        if (hours >= 23) return 100;
        const totalMinutes = (hours - 7) * 60 + minutes;
        const totalDayMinutes = (23-7) * 60;
        return (totalMinutes / totalDayMinutes) * 100;
    };
    
    const currentTimePosition = timeToPosition(currentTime);
    const currentDayOfWeek = getDay(currentTime); // Sunday is 0, Monday is 1
    const isCurrentWeek = isSameDay(week.start, startOfWeek(new Date(), { weekStartsOn: 1 }));

    if (isMobile) {
        return <MobileScheduleView schedule={schedule} week={week} changeWeek={changeWeek} />
    }

    return (
        <Card className="overflow-hidden">
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
                        <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={schedule.length === 0}><Download className="mr-2 h-4 w-4"/>Documento PDF</Button>
                        <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4"/>Filtrar</Button>
                        <Button variant="outline" size="sm" className="hidden md:flex"><Expand className="mr-2 h-4 w-4" /> Ampliar</Button>
                         <Select defaultValue="week">
                            <SelectTrigger className="w-[180px] h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">Semana completa</SelectItem>
                                <SelectItem value="day">Día</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <div className="grid grid-cols-[4rem_repeat(6,minmax(0,1fr))] min-w-[70rem]">
                    <div className="row-start-1 col-start-1 sticky left-0 z-10 bg-card border-b border-r"></div>
                    {daysOfWeek.map((day, index) => (
                        <div key={day} className="col-start-auto text-center py-2 border-b border-r">
                            <p className="text-xs uppercase text-muted-foreground">{format(week.days[index], 'E', { locale: es })}</p>
                            <p className={cn("text-lg font-semibold", isToday(week.days[index]) && "text-primary")}>{format(week.days[index], 'd')}</p>
                        </div>
                    ))}
                    <div className="row-start-2 col-start-1 sticky left-0 z-10 bg-card border-r">
                        {timeSlots.map((time, index) => (
                            index % 2 === 0 && (
                                <div key={time} className="h-16 relative flex justify-end pr-2">
                                    <span className="text-xs text-muted-foreground -translate-y-1/2">{time}</span>
                                </div>
                            )
                        ))}
                    </div>
                    <div className="row-start-2 col-start-2 col-span-6 grid grid-cols-6 relative">
                        {timeSlots.map((time, index) => daysOfWeek.map(day => (
                            <div key={`${day}-${time}`} className="h-8 border-b border-r"></div>
                        )))}
                        {isCurrentWeek && currentDayOfWeek >= 1 && currentDayOfWeek <= 6 && (
                            <div className="absolute w-full h-px bg-red-500 z-20" style={{ top: `${currentTimePosition}%` }}>
                                <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500"></div>
                            </div>
                        )}
                        {schedule.map((entry: any, index: number) => {
                            const dayIndex = daysOfWeek.indexOf(entry.dia);
                            if (dayIndex === -1) return null;
                            const [startHour, startMinute] = entry.hora.split(':').map(Number);
                            const start = startHour + startMinute / 60;
                            const top = ((start - 7) / 16) * 100;
                            const height = (entry.duracion / 16) * 100;
                            const color = stringToHslColor(entry.materiaNombre, 80, 85);
                            const borderColor = stringToHslColor(entry.materiaNombre, 60, 60);

                            return (
                                <div key={entry.id || index} className="absolute w-full p-1" style={{ top: `${top}%`, height: `${height}%`, left: `${(dayIndex / 6) * 100}%`, width: `${100 / 6}%` }}>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex flex-col w-full h-full p-2 rounded-lg border-l-4 overflow-hidden text-xs" style={{ backgroundColor: color, borderColor: borderColor }}>
                                                    <p className="font-bold text-gray-800 truncate" style={{ color: stringToHslColor(entry.materiaNombre, 80, 20) }}>{entry.materiaNombre}</p>
                                                    <p className="text-gray-600 truncate">{userRole === 'estudiante' ? entry.docenteNombre : entry.grupoCodigo}</p>
                                                    <div className="flex-grow"></div>
                                                    <p className="text-gray-600 font-semibold truncate">{entry.modalidad === 'Presencial' ? entry.salonNombre : 'Virtual'}</p>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-bold">{entry.materiaNombre}</p>
                                                <p><span className="font-semibold">Horario:</span> {entry.hora}</p>
                                                <p><span className="font-semibold">{userRole === 'estudiante' ? 'Docente:' : 'Grupo:'}</span> {userRole === 'estudiante' ? entry.docenteNombre : entry.grupoCodigo}</p>
                                                <p><span className="font-semibold">Ubicación:</span> {entry.modalidad === 'Presencial' ? entry.salonNombre : 'Virtual'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function MobileScheduleView({ schedule, week, changeWeek }: any) {
    const groupedSchedule = useMemo(() => {
        const groups: { [key: string]: any[] } = {};
        daysOfWeek.forEach(day => groups[day] = []);
        schedule.forEach((entry: any) => {
            if (groups[entry.dia]) {
                groups[entry.dia].push(entry);
            }
        });
        Object.values(groups).forEach(dayEntries => {
            dayEntries.sort((a,b) => parseInt(a.hora.split(':')[0]) - parseInt(b.hora.split(':')[0]));
        });
        return groups;
    }, [schedule]);

    return (
        <Card>
             <CardHeader className="border-b p-4">
                <div className="flex flex-col gap-4">
                     <div className="flex items-center justify-between">
                        <p className="text-lg font-medium text-gray-700">
                            {format(week.start, "MMMM yyyy", { locale: es })}
                        </p>
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeWeek('prev')}><ChevronLeft className="h-5 w-5"/></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeWeek('next')}><ChevronRight className="h-5 w-5"/></Button>
                        </div>
                    </div>
                     <Button variant="outline" size="sm" onClick={() => changeWeek('today')}>Volver a la semana actual</Button>
                </div>
             </CardHeader>
             <CardContent className="p-4 space-y-4">
                {daysOfWeek.map((day, index) => (
                    <div key={day}>
                        <h3 className="font-bold mb-2">{day} <span className="text-muted-foreground font-normal">{format(week.days[index], 'd')}</span></h3>
                        <div className="space-y-2">
                        {groupedSchedule[day].length > 0 ? groupedSchedule[day].map((entry: any) => (
                            <div key={entry.id} className="p-3 rounded-md border text-left">
                                <p className="font-semibold">{entry.materiaNombre}</p>
                                <p className="text-sm text-muted-foreground">{entry.hora}</p>
                                <p className="text-sm text-muted-foreground">{entry.docenteNombre}</p>
                                <p className="text-sm text-muted-foreground">{entry.modalidad === 'Presencial' ? entry.salonNombre : 'Virtual'}</p>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground pl-3">No hay clases programadas.</p>
                        )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
  