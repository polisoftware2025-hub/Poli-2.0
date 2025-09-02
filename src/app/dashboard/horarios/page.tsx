
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, Download, Search, ArrowLeft, ArrowRight, View, Filter, RotateCcw } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
const timeSlots = Array.from({ length: 15 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

const colorPalette = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-green-50 border-green-200 text-green-800",
  "bg-yellow-50 border-yellow-200 text-yellow-800",
  "bg-purple-50 border-purple-200 text-purple-800",
  "bg-pink-50 border-pink-200 text-pink-800",
  "bg-indigo-50 border-indigo-200 text-indigo-800",
  "bg-teal-50 border-teal-200 text-teal-800",
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
  const [filterGrupo, setFilterGrupo] = useState('all');

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
                const start = new Date(`1970-01-01T${startTimeStr}:00`);
                const end = new Date(`1970-01-01T${endTimeStr}:00`);
                const duracion = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                
                parsedSchedule.push({
                    dia: slot.dia,
                    horaInicio: startTimeStr,
                    horaFin: endTimeStr,
                    duracion: Math.round(duracion),
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
  
  const filteredSchedule = useMemo(() => {
      if (filterMateria === 'all' && filterGrupo === 'all') return allSchedule;
      return allSchedule.filter(entry => {
          const materiaMatch = filterMateria === 'all' || entry.materia === filterMateria;
          const grupoMatch = filterGrupo === 'all' || entry.grupo === filterGrupo;
          return materiaMatch && grupoMatch;
      });
  }, [allSchedule, filterMateria, filterGrupo]);

  const materias = useMemo(() => {
    const uniqueMaterias = [...new Set(allSchedule.map(s => s.materia))];
    return uniqueMaterias.map(m => ({ value: m, label: m }));
  }, [allSchedule]);

  const grupos = useMemo(() => {
      const filteredByMateria = allSchedule.filter(s => filterMateria === 'all' || s.materia === filterMateria);
      const uniqueGrupos = [...new Set(filteredByMateria.map(s => s.grupo))];
      return uniqueGrupos.map(g => ({ value: g, label: g }));
  }, [allSchedule, filterMateria]);
  
  const scheduleGrid = useMemo(() => {
    const grid: (ScheduleEntry | 'spanned' | null)[][] = Array(timeSlots.length).fill(null).map(() => Array(daysOfWeek.length).fill(null));

    filteredSchedule.forEach(entry => {
        const dayIndex = daysOfWeek.indexOf(entry.dia);
        const timeIndex = timeSlots.indexOf(entry.horaInicio);
        if (dayIndex !== -1 && timeIndex !== -1) {
            grid[timeIndex][dayIndex] = entry;
            for (let i = 1; i < entry.duracion; i++) {
                if (timeIndex + i < timeSlots.length) {
                    grid[timeIndex + i][dayIndex] = 'spanned';
                }
            }
        }
    });

    return grid;
  }, [filteredSchedule]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Mi Horario de Clases", 14, 16);
    autoTable(doc, {
        head: [['Hora', ...daysOfWeek]],
        body: scheduleGrid.map((row, rowIndex) => {
            const time = timeSlots[rowIndex];
            const rowData = daysOfWeek.map((_, dayIndex) => {
                const entry = row[dayIndex];
                if (entry && entry !== 'spanned') {
                    return `${entry.materia}\n${entry.grupo}\n${entry.aula.sede} - ${entry.aula.salon}`;
                }
                return '';
            });
            return [time, ...rowData];
        }),
        startY: 20,
    });
    doc.save('horario.pdf');
  };

  const renderFilters = () => (
    <Card className="mb-8">
        <CardHeader>
            <CardTitle>Filtro de Horario</CardTitle>
            <CardDescription>Selecciona una materia o grupo para ver un horario específico.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Materia</label>
                <Select value={filterMateria} onValueChange={(value) => { setFilterMateria(value); setFilterGrupo('all'); }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filtrar por materia"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las materias</SelectItem>
                        {materias.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Grupo</label>
                <Select value={filterGrupo} onValueChange={setFilterGrupo} disabled={materias.length === 0}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filtrar por grupo"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los grupos</SelectItem>
                        {grupos.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-end">
                <Button variant="outline" onClick={() => { setFilterMateria('all'); setFilterGrupo('all'); }}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Limpiar Filtros
                </Button>
            </div>
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
      
      {userRole === 'docente' && renderFilters()}

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle>Horario de Clases</CardTitle>
                <CardDescription>
                    {filterMateria !== 'all' || filterGrupo !== 'all' ? 'Mostrando horario filtrado.' : 'Mostrando tu horario completo.'}
                </CardDescription>
            </div>
            <Button variant="secondary" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4"/>
                Descargar
            </Button>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <p>Cargando horario...</p>
            ) : filteredSchedule.length > 0 ? (
                 <div className="overflow-x-auto">
                    <Table className="border min-w-[1200px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-28 border-r text-center font-bold">Hora</TableHead>
                                {daysOfWeek.map(day => (
                                    <TableHead key={day} className="border-r text-center font-bold">{day}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {timeSlots.map((time, timeIndex) => {
                                const row = scheduleGrid[timeIndex];
                                return (
                                    <TableRow key={time}>
                                        <TableCell className="border-r text-center font-mono text-xs text-muted-foreground">{time}</TableCell>
                                        {daysOfWeek.map((_, dayIndex) => {
                                            const entry = row[dayIndex];
                                            if (entry === 'spanned') return null;
                                            return (
                                                <TableCell
                                                    key={dayIndex}
                                                    rowSpan={entry ? entry.duracion : 1}
                                                    className={`border-r p-1 align-top h-24 ${entry ? getSubjectColor(entry.materia) : ''}`}
                                                >
                                                    {entry && (
                                                        <div className="p-2 rounded-md h-full flex flex-col justify-center text-xs">
                                                            <p className="font-bold">{entry.materia}</p>
                                                            <p>{entry.grupo}</p>
                                                            {userRole !== 'docente' && <p>{entry.docente}</p>}
                                                            <p className="font-mono text-xs">{entry.aula.sede} - {entry.aula.salon}</p>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                 </div>
            ) : (
                <Alert>
                    <CalendarIcon className="h-4 w-4"/>
                    <AlertTitle>No hay clases</AlertTitle>
                    <AlertDescription>
                        No hay clases programadas según los filtros seleccionados o en tu horario general.
                    </AlertDescription>
                </Alert>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
