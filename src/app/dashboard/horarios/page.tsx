
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, ArrowLeft, ArrowRight, Info, Clock, User, Building, BookOpen } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { startOfWeek, endOfWeek, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";


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
  const [allGroups, setAllGroups] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [filterMateria, setFilterMateria] = useState<string | undefined>(undefined);
  const [filterGrupo, setFilterGrupo] = useState<string | undefined>(undefined);
  
  const [showSchedule, setShowSchedule] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date());
  
  const [message, setMessage] = useState("Seleccione una materia y un grupo para consultar su horario de clases.");
  const [messageType, setMessageType] = useState<"info" | "error" | "success">("info");

  const { toast } = useToast();

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');
    const storedUserEmail = localStorage.getItem('userEmail');
    setUserId(storedUserId);
    setUserRole(storedUserRole);
    setUserEmail(storedUserEmail);
  }, []);

  useEffect(() => {
    if (userRole !== 'docente' && userRole !== null) {
      setIsLoading(false);
      return;
    }
    if (!userEmail) return;

    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const groupsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        const userGroupsQuery = query(groupsRef, where("docente.email", "==", userEmail));
        const querySnapshot = await getDocs(userGroupsQuery);
        const fetchedGroups: DocumentData[] = [];
        querySnapshot.forEach(doc => {
          fetchedGroups.push({ id: doc.id, ...doc.data() });
        });
        setAllGroups(fetchedGroups);
      } catch (error) {
        console.error("Error fetching groups:", error);
        setMessageType("error");
        setMessage("Error al cargar los grupos. Intente de nuevo.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [userRole, userEmail]);
  
  const filteredSchedule = useMemo(() => {
    const schedule: ScheduleEntry[] = [];
  
    const groupsToProcess = allGroups.filter(group => {
      if (filterGrupo && filterGrupo !== 'todos') {
        return group.id === filterGrupo;
      }
      if (filterMateria && filterMateria !== 'todos') {
        return group.materia.nombre === filterMateria;
      }
      if ((!filterMateria || filterMateria === 'todos') && (!filterGrupo || filterGrupo === 'todos')) {
        return true;
      }
      return false;
    });
  
    groupsToProcess.forEach(group => {
      if (group.horario) {
        group.horario.forEach((slot: { dia: string; hora: string }) => {
          const [startTimeStr, endTimeStr] = slot.hora.split(" - ");
          const start = new Date(`1970-01-01T${startTimeStr}:00`);
          const end = new Date(`1970-01-01T${endTimeStr}:00`);
          const duracion = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  
          schedule.push({
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
    });
    return schedule.sort((a, b) => daysOfWeek.indexOf(a.dia) - daysOfWeek.indexOf(b.dia) || a.horaInicio.localeCompare(b.horaInicio));
  }, [allGroups, filterMateria, filterGrupo]);

  const materias = useMemo(() => {
    const uniqueMaterias = [...new Set(allGroups.map(g => g.materia.nombre))];
    return uniqueMaterias.map(m => ({ value: m, label: m }));
  }, [allGroups]);

  const grupos = useMemo(() => {
      let filteredGroups = allGroups;
      if (filterMateria && filterMateria !== 'todos') {
          filteredGroups = allGroups.filter(g => g.materia.nombre === filterMateria);
      }
      return filteredGroups.map(g => ({ value: g.id, label: g.codigoGrupo }));
  }, [allGroups, filterMateria]);
  
  const handleShowSchedule = () => {
    if (!filterMateria || !filterGrupo) {
        setMessageType("error");
        setMessage("Por favor completa todos los campos.");
        return;
    }
    setMessageType("success");
    setMessage("Cargando horario...");
    toast({
      title: "Cargando horario...",
      description: "Tu horario se está preparando.",
    });
    setShowSchedule(true);
  }

  const markedDays = useMemo(() => {
      const datesWithClasses: Date[] = [];
      const referenceDate = new Date(); // Use a consistent reference, e.g., today
      const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });

      filteredSchedule.forEach(entry => {
          const dayIndex = daysOfWeek.indexOf(entry.dia);
          if (dayIndex !== -1) {
              const classDate = new Date(weekStart);
              classDate.setDate(weekStart.getDate() + dayIndex);
              datesWithClasses.push(classDate);
          }
      });
      return datesWithClasses;
  }, [filteredSchedule]);

  const classesForSelectedDay = useMemo(() => {
    if (!currentDate) return [];
    
    const dayOfWeek = format(currentDate, 'EEEE', { locale: es });
    
    return filteredSchedule.filter(entry => entry.dia.toLowerCase() === dayOfWeek.toLowerCase());
  }, [currentDate, filteredSchedule]);


  const renderFilters = () => (
     <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="bg-card p-6 md:p-8 rounded-lg shadow-sm border border-border">
        <div className="space-y-6">
          <div className="space-y-2">
              <Label htmlFor="materia-select" className="text-base font-semibold">Materia</Label>
              <Select value={filterMateria} onValueChange={(value) => { 
                  setFilterMateria(value);
                  setFilterGrupo(undefined);
                  setShowSchedule(false);
                  setMessage("Selecciona un grupo para continuar.");
              }}>
                  <SelectTrigger id="materia-select" className="py-6 text-base">
                      <SelectValue placeholder="Selecciona una materia"/>
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="todos">Todas mis materias</SelectItem>
                      {materias.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
              </Select>
          </div>
          
          {filterMateria && (
            <div className="space-y-2">
                <Label htmlFor="grupo-select" className="text-base font-semibold">Grupo</Label>
                <Select value={filterGrupo} onValueChange={(value) => {
                    setFilterGrupo(value);
                    setShowSchedule(false);
                    if (value) {
                      setMessage("Listo para consultar. Haz clic en 'Ver Horario'.");
                    }
                }} disabled={isLoading || !filterMateria}>
                    <SelectTrigger id="grupo-select" className="py-6 text-base">
                        <SelectValue placeholder="Selecciona un grupo"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos los grupos</SelectItem>
                        {grupos.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          )}
          
          {filterMateria && filterGrupo && (
            <Button onClick={handleShowSchedule} size="lg" className="w-full py-6 text-lg bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg">
                Ver Horario
            </Button>
          )}
        </div>
      </div>
      <p className={cn(
        "mt-4 text-center text-sm",
        messageType === 'info' && "text-muted-foreground",
        messageType === 'error' && "text-destructive",
        messageType === 'success' && "text-green-600",
      )}>
        {message}
      </p>
    </div>
  );

  const renderScheduleView = () => (
    <div className="space-y-8">
        <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowSchedule(false)}>
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Volver a Filtros
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Horario de Clases</CardTitle>
                <CardDescription>Selecciona un día del calendario para ver el detalle de tus clases.</CardDescription>
            </CardHeader>
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
                                                <p className="text-sm text-muted-foreground">Grupo</p>
                                                <p className="font-semibold">{entry.grupo}</p>
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
        </Card>
    </div>
  );
  
   const renderForStudent = () => (
     <Card>
        <CardHeader>
          <CardTitle>Mi Horario</CardTitle>
          <CardDescription>Vista de horario para estudiantes en desarrollo.</CardDescription>
        </CardHeader>
        <CardContent>
            <Alert>
                <CalendarIcon className="h-4 w-4"/>
                <AlertTitle>Función no disponible</AlertTitle>
                <AlertDescription>
                   El horario detallado para estudiantes se cargará aquí próximamente.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mi Horario"
        description="Visualiza tu agenda de clases y planifica tu semana."
        icon={<CalendarIcon className="h-8 w-8 text-primary" />}
      />
      
      {userRole === 'docente' ? (
        showSchedule ? renderScheduleView() : renderFilters()
      ) : userRole === 'estudiante' ? (
        renderForStudent()
      ) : (
         <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
                {isLoading ? "Cargando..." : "La vista de horario no está disponible para tu rol."}
            </CardContent>
        </Card>
      )}

    </div>
  );
}
