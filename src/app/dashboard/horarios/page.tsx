
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, Clock, User, Building, BookOpen, ChevronLeft, ChevronRight, Filter, Expand, Maximize, Minimize } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateSchedulePdf } from "@/lib/schedule-pdf-generator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { eachDayOfInterval, startOfWeek, endOfWeek, format, isToday, getDay, isSameDay, addDays } from "date-fns";
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
  const [docentes, setDocentes] = useState<{id: string, nombreCompleto: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedDocenteFilter, setSelectedDocenteFilter] = useState("all");

  const week = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return {
      start,
      end,
      days: eachDayOfInterval({ start, end }).slice(0, 6),
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
        
        // Populate docentes for filtering
        const docentesInSchedule = new Map<string, string>();
        finalSchedule.forEach(entry => {
            if (!docentesInSchedule.has(entry.docenteId)) {
                docentesInSchedule.set(entry.docenteId, entry.docenteNombre);
            }
        });
        setDocentes(Array.from(docentesInSchedule.entries()).map(([id, nombre]) => ({ id, nombreCompleto: nombre })));

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

  const filteredSchedule = useMemo(() => {
      if (selectedDocenteFilter === 'all') return schedule;
      return schedule.filter(entry => entry.docenteId === selectedDocenteFilter);
  }, [schedule, selectedDocenteFilter]);

  const handleDownloadPdf = () => {
    if (!userInfo || schedule.length === 0) return;
    generateSchedulePdf(filteredSchedule, userInfo, userRole || "estudiante");
  }

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
    <div className={cn("flex flex-col gap-6", isFullScreen && "fixed inset-0 bg-background z-50 p-4 sm:p-8")}>
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
                schedule={filteredSchedule}
                week={week}
                setCurrentDate={setCurrentDate}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isFullScreen={isFullScreen}
                setIsFullScreen={setIsFullScreen}
                handleDownloadPdf={handleDownloadPdf}
                docentes={docentes}
                selectedDocenteFilter={selectedDocenteFilter}
                setSelectedDocenteFilter={setSelectedDocenteFilter}
                userRole={userRole}
            />
        )}
    </div>
  );
}


function ScheduleView({ schedule, week, setCurrentDate, viewMode, setViewMode, isFullScreen, setIsFullScreen, handleDownloadPdf, docentes, selectedDocenteFilter, setSelectedDocenteFilter, userRole }: any) {
    const isMobile = useIsMobile();
    
    const changeWeek = (direction: 'next' | 'prev' | 'today') => {
        if (direction === 'today') {
            setCurrentDate(new Date());
        } else {
            setCurrentDate((current: Date) => addDays(current, direction === 'next' ? 7 : -7));
        }
    };
    
    const CurrentView = (isMobile && viewMode !== 'day') ? DayView : (viewMode === 'day' ? DayView : WeekView);

    return (
        <Card className={cn("overflow-hidden flex flex-col", isFullScreen && "h-full")}>
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
                        <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={schedule.length === 0}><Download className="mr-2 h-4 w-4"/>PDF</Button>
                         {userRole === 'estudiante' && docentes.length > 1 && (
                            <Select value={selectedDocenteFilter} onValueChange={setSelectedDocenteFilter}>
                                <SelectTrigger className="w-48 h-9 text-sm"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Filtrar por docente"/></SelectTrigger>
                                <SelectContent><SelectItem value="all">Todos los Docentes</SelectItem>{docentes.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.nombreCompleto}</SelectItem>)}</SelectContent>
                            </Select>
                         )}
                        <Button variant="outline" size="icon" onClick={() => setIsFullScreen(!isFullScreen)} className="h-9 w-9 hidden sm:flex">{isFullScreen ? <Minimize className="h-4 w-4"/> : <Maximize className="h-4 w-4"/>}</Button>
                         {!isMobile && (
                            <Select defaultValue="week" value={viewMode} onValueChange={(v) => setViewMode(v)}>
                                <SelectTrigger className="w-32 h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="week">Semana</SelectItem><SelectItem value="day">Día</SelectItem></SelectContent>
                            </Select>
                         )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-auto flex-1">
                 <CurrentView schedule={schedule} week={week} userRole={userRole} />
            </CardContent>
        </Card>
    );
}

function WeekView({ schedule, week, userRole }: any) {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const timeToPosition = (date: Date | null) => {
        if (!date) return 0;
        const hours = date.getHours();
        const minutes = date.getMinutes();
        if (hours < 7) return 0;
        if (hours >= 23) return 100;
        const totalMinutes = (hours - 7) * 60 + minutes;
        const totalDayMinutes = (23-7) * 60;
        return (totalMinutes / totalDayMinutes) * 100;
    };
    
    const currentTimePosition = timeToPosition(currentTime);
    const currentDayOfWeek = currentTime ? getDay(currentTime) : -1;
    const isCurrentWeek = isSameDay(week.start, startOfWeek(new Date(), { weekStartsOn: 1 }));

    return (
        <div className="grid grid-cols-[4rem_repeat(6,minmax(0,1fr))]">
            <div className="row-start-1 col-start-1 sticky left-0 z-10 bg-card border-b border-r"></div>
            {daysOfWeek.map((day, index) => (
                <div key={day} className="col-start-auto text-center py-2 border-b border-r">
                    <p className="text-xs uppercase text-muted-foreground">{format(week.days[index], 'E', { locale: es })}</p>
                    <p className={cn("text-lg font-semibold", isToday(week.days[index]) && "text-primary")}>{format(week.days[index], 'd')}</p>
                </div>
            ))}
            <div className="row-start-2 col-start-1 sticky left-0 z-10 bg-card border-r">
                {timeSlots.map((time, index) => index % 2 === 0 && <div key={time} className="h-16 relative flex justify-end pr-2"><span className="text-xs text-muted-foreground -translate-y-1/2">{time}</span></div>)}
            </div>
            <div className="row-start-2 col-start-2 col-span-6 grid grid-cols-6 relative">
                {timeSlots.map((time, index) => daysOfWeek.map(day => <div key={`${day}-${time}`} className="h-8 border-b border-r"></div>))}
                {isCurrentWeek && currentDayOfWeek >= 1 && currentDayOfWeek <= 6 && <div className="absolute w-full h-px bg-red-500 z-20" style={{ top: `${currentTimePosition}%` }}><div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500"></div></div>}
                {schedule.map((entry: any, index: number) => {
                    const dayIndex = daysOfWeek.indexOf(entry.dia);
                    if (dayIndex === -1) return null;
                    const [startHourStr, startMinuteStr] = entry.hora.split(' - ')[0].split(':');
                    const startRowIndex = (parseInt(startHourStr) - 7) * 2 + (parseInt(startMinuteStr) / 30);
                    const top = (startRowIndex / timeSlots.length) * 100;
                    const [endHourStr, endMinuteStr] = entry.hora.split(' - ')[1].split(':');
                    const endRowIndex = (parseInt(endHourStr) - 7) * 2 + (parseInt(endMinuteStr) / 30);
                    const durationInSlots = endRowIndex - startRowIndex;
                    const height = (durationInSlots / timeSlots.length) * 100;
                    const color = stringToHslColor(entry.materiaNombre, 80, 85);
                    const borderColor = stringToHslColor(entry.materiaNombre, 60, 60);

                    return (
                        <div key={entry.id || index} className="absolute w-full p-1" style={{ top: `${top}%`, height: `${height}%`, left: `${(dayIndex / 6) * 100}%`, width: `${100 / 6}%` }}>
                            <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                <div className="flex flex-col w-full h-full cursor-pointer p-2 rounded-lg border-l-4 overflow-hidden text-xs" style={{ backgroundColor: color, borderColor: borderColor }}>
                                    <p className="font-bold text-gray-800 truncate" style={{ color: stringToHslColor(entry.materiaNombre, 80, 20) }}>{entry.materiaNombre}</p>
                                    <p className="text-gray-600 truncate">{userRole === 'estudiante' ? entry.docenteNombre : entry.grupoCodigo}</p>
                                    <div className="flex-grow"></div>
                                    <p className="text-gray-600 font-semibold truncate">{entry.modalidad === 'Presencial' ? entry.salonNombre : 'Virtual'}</p>
                                </div>
                            </TooltipTrigger><TooltipContent><p className="font-bold">{entry.materiaNombre}</p><p><span className="font-semibold">Horario:</span> {entry.hora}</p><p><span className="font-semibold">{userRole === 'estudiante' ? 'Docente:' : 'Grupo:'}</span> {userRole === 'estudiante' ? entry.docenteNombre : entry.grupoCodigo}</p><p><span className="font-semibold">Ubicación:</span> {entry.modalidad === 'Presencial' ? entry.salonNombre : 'Virtual'}</p></TooltipContent></Tooltip></TooltipProvider>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function DayView({ schedule, week, userRole }: any) {
    const today = new Date();
    const todayIndex = getDay(today) === 0 ? 6 : getDay(today) - 1; // Handle Sunday, maps Sunday to 6 (off-range), Mon to 0 etc.
    const [selectedDayIndex, setSelectedDayIndex] = useState(isToday(today) && todayIndex >= 0 && todayIndex < 6 ? todayIndex : 0);
    const selectedDate = week.days[selectedDayIndex];
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const timeToPosition = (date: Date | null) => {
        if (!date) return 0;
        const hours = date.getHours();
        const minutes = date.getMinutes();
        if (hours < 7) return 0;
        if (hours >= 23) return 100;
        const totalMinutes = (hours - 7) * 60 + minutes;
        const totalDayMinutes = (23-7) * 60;
        return (totalMinutes / totalDayMinutes) * 100;
    };
    
    const currentTimePosition = timeToPosition(currentTime);
    const daySchedule = schedule.filter((entry:any) => entry.dia === daysOfWeek[selectedDayIndex]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-around p-2 border-b shrink-0">
                {week.days.map((day: Date, index: number) => (
                    <Button key={day.toString()} variant={isSameDay(day, selectedDate) ? "secondary" : "ghost"} onClick={() => setSelectedDayIndex(index)} className="flex-col h-auto">
                        <span className="text-xs">{format(day, 'E', { locale: es })}</span>
                        <span className={cn("text-lg font-bold", isToday(day) && "text-primary")}>{format(day, 'd')}</span>
                    </Button>
                ))}
            </div>
             <div className="grid grid-cols-[4rem_1fr] flex-1 overflow-y-auto">
                <div className="row-start-1 col-start-1 sticky top-0 z-10 bg-card border-r">
                    {timeSlots.map((time, index) => index % 2 === 0 && <div key={time} className="h-16 relative flex justify-end pr-2"><span className="text-xs text-muted-foreground -translate-y-1/2">{time}</span></div>)}
                </div>
                 <div className="row-start-1 col-start-2 grid grid-cols-1 relative">
                    {timeSlots.map((time) => <div key={`day-${time}`} className="h-8 border-b"></div>)}
                    {isToday(selectedDate) && <div className="absolute w-full h-px bg-red-500 z-20" style={{ top: `${currentTimePosition}%` }}><div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500"></div></div>}
                    {daySchedule.map((entry: any, index: number) => {
                        const [startHourStr, startMinuteStr] = entry.hora.split(' - ')[0].split(':');
                        const startRowIndex = (parseInt(startHourStr) - 7) * 2 + (parseInt(startMinuteStr) / 30);
                        const top = (startRowIndex / timeSlots.length) * 100;
                        const [endHourStr, endMinuteStr] = entry.hora.split(' - ')[1].split(':');
                        const endRowIndex = (parseInt(endHourStr) - 7) * 2 + (parseInt(endMinuteStr) / 30);
                        const durationInSlots = endRowIndex - startRowIndex;
                        const height = (durationInSlots / timeSlots.length) * 100;
                        const color = stringToHslColor(entry.materiaNombre, 80, 85);
                        const borderColor = stringToHslColor(entry.materiaNombre, 60, 60);

                        return (
                            <div key={entry.id || index} className="absolute w-full p-1" style={{ top: `${top}%`, height: `${height}%`, left: 0 }}>
                                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                    <div className="flex flex-col w-full h-full cursor-pointer p-2 rounded-lg border-l-4 overflow-hidden text-sm" style={{ backgroundColor: color, borderColor: borderColor }}>
                                        <p className="font-bold text-gray-800" style={{ color: stringToHslColor(entry.materiaNombre, 80, 20) }}>{entry.materiaNombre}</p>
                                        <p className="text-gray-600 text-xs">{entry.hora}</p>
                                        <p className="text-gray-600 text-xs">{userRole === 'estudiante' ? entry.docenteNombre : entry.grupoCodigo}</p>
                                        <div className="flex-grow"></div>
                                        <p className="text-gray-600 font-semibold text-xs">{entry.modalidad === 'Presencial' ? entry.salonNombre : 'Virtual'}</p>
                                    </div>
                                </TooltipTrigger><TooltipContent><p className="font-bold">{entry.materiaNombre}</p><p><span className="font-semibold">Horario:</span> {entry.hora}</p><p><span className="font-semibold">{userRole === 'estudiante' ? 'Docente:' : 'Grupo:'}</span> {userRole === 'estudiante' ? entry.docenteNombre : entry.grupoCodigo}</p><p><span className="font-semibold">Ubicación:</span> {entry.modalidad === 'Presencial' ? entry.salonNombre : 'Virtual'}</p></TooltipContent></Tooltip></TooltipProvider>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
