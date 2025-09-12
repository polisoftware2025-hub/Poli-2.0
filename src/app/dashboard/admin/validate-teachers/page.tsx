
"use client";

import { useState, useEffect, useMemo, useCallback, useTransition } from "react";
import { PageHeader } from "@/components/page-header";
import { ShieldCheck, Filter, Users, BookCopy, ChevronsRight, MoreVertical, Edit, Trash2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, arrayRemove, getDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface Career {
  id: string;
  nombre: string;
  ciclos: { numero: number }[];
}

interface TeacherAssignment {
  docenteNombre: string;
  docenteId: string;
  carreraNombre: string;
  carreraId: string;
  materiaNombre: string;
  materiaId: string;
  grupoCodigo: string;
  grupoId: string;
  ciclo: number;
  estadoGrupo: string;
  horarioId: string; // The unique ID of the schedule entry
}

interface GroupedAssignments {
    docenteId: string;
    docenteNombre: string;
    assignments: TeacherAssignment[];
}

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);


export default function ValidateTeachersPage() {
  const [allAssignments, setAllAssignments] = useState<TeacherAssignment[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [cycles, setCycles] = useState<number[]>([]);
  
  const [careerFilter, setCareerFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("docente");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const fetchAssignmentData = useCallback(async () => {
    setIsLoading(true);
    try {
      const careersSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
      const fetchedCareers = careersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Career));
      setCareers(fetchedCareers);
      const allCyclesSet = new Set<number>();
      fetchedCareers.forEach(c => c.ciclos?.forEach(ciclo => allCyclesSet.add(ciclo.numero)));
      setCycles(Array.from(allCyclesSet).sort((a,b) => a-b));

      const careersMap = new Map(fetchedCareers.map(c => [c.id, c.nombre]));
      
      const groupsSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"));
      const assignmentsList: TeacherAssignment[] = [];

      groupsSnapshot.forEach(groupDoc => {
        const groupData = groupDoc.data();
        if (groupData.horario && Array.isArray(groupData.horario)) {
          groupData.horario.forEach((slot: any) => {
            if (slot.docenteId && slot.materiaId) { // Ensure essential data exists
              assignmentsList.push({
                docenteNombre: slot.docenteNombre || "Docente sin nombre",
                docenteId: slot.docenteId,
                carreraNombre: careersMap.get(groupData.idCarrera) || "N/A",
                carreraId: groupData.idCarrera,
                materiaNombre: slot.materiaNombre || "Materia sin nombre",
                materiaId: slot.materiaId,
                grupoCodigo: groupData.codigoGrupo,
                grupoId: groupDoc.id,
                ciclo: groupData.ciclo,
                estadoGrupo: groupData.estado,
                horarioId: slot.id,
              });
            }
          });
        }
      });
      
      const uniqueAssignments = Array.from(new Map(assignmentsList.map(item => [`${item.docenteId}-${item.materiaId}-${item.grupoId}`, item])).values());
      setAllAssignments(uniqueAssignments);

    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las asignaciones de docentes." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAssignmentData();
  }, [fetchAssignmentData]);
  
  const handleRemove = async (assignment: TeacherAssignment) => {
    startTransition(async () => {
        try {
        const groupRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", assignment.grupoId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
            const groupData = groupSnap.data();
            const scheduleEntryToRemove = groupData.horario?.find((h: any) => h.id === assignment.horarioId);
            if (scheduleEntryToRemove) {
            await updateDoc(groupRef, {
                horario: arrayRemove(scheduleEntryToRemove)
            });
            toast({ title: "Éxito", description: "La asignación ha sido eliminada del horario." });
            fetchAssignmentData(); // Refresh all data
            } else {
            throw new Error("No se encontró la clase específica en el horario del grupo.");
            }
        } else {
            throw new Error("El grupo asociado a esta asignación no fue encontrado.");
        }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo remover la asignación." });
        }
    });
  };
  
  const handleValidate = (assignment: TeacherAssignment) => {
      toast({
          title: "Asignación Validada",
          description: `Se ha marcado la asignación de ${assignment.materiaNombre} como revisada.`,
      });
  };

  const filteredAssignments = useMemo(() => {
    return allAssignments.filter(a => 
      (careerFilter === 'all' || a.carreraId === careerFilter) &&
      (cycleFilter === 'all' || a.ciclo === parseInt(cycleFilter)) &&
      (statusFilter === 'all' || a.estadoGrupo === statusFilter)
    );
  }, [allAssignments, careerFilter, cycleFilter, statusFilter]);

  const groupedByTeacher = useMemo(() => {
      const grouped: { [key: string]: GroupedAssignments } = {};
      filteredAssignments.forEach(assignment => {
          if (!grouped[assignment.docenteId]) {
              grouped[assignment.docenteId] = {
                  docenteId: assignment.docenteId,
                  docenteNombre: assignment.docenteNombre,
                  assignments: []
              };
          }
          grouped[assignment.docenteId].assignments.push(assignment);
      });
      return Object.values(grouped);
  }, [filteredAssignments]);

  const stats = useMemo(() => {
    const activeGroups = new Set(filteredAssignments.filter(a => a.estadoGrupo === 'activo').map(a => a.grupoId));
    const inactiveGroups = new Set(filteredAssignments.filter(a => a.estadoGrupo !== 'activo').map(a => a.grupoId));
    const uniqueCareers = new Set(filteredAssignments.map(a => a.carreraId));

    return {
        totalAssignments: filteredAssignments.length,
        totalTeachers: groupedByTeacher.length,
        totalCareers: uniqueCareers.size,
        activeGroups: activeGroups.size,
        inactiveGroups: inactiveGroups.size
    }
  }, [filteredAssignments, groupedByTeacher]);


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Validación de Docentes"
        description="Verifica los docentes asignados a las materias por carrera, ciclo y estado del grupo."
        icon={<ShieldCheck className="h-8 w-8 text-primary" />}
      />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>¿Cómo usar esta página?</AlertTitle>
        <AlertDescription>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Vista Agrupada:</strong> La información se presenta en acordeones, uno por cada docente. Expande un docente para ver todas sus asignaturas.</li>
            <li><strong>Acción "Validar":</strong> Permite marcar una asignación como revisada y correcta, mostrando una notificación de confirmación para llevar un control visual.</li>
            <li><strong>Acción "Editar":</strong> Te redirige al panel principal de gestión de horarios, donde puedes realizar modificaciones complejas a la programación.</li>
            <li><strong>Acción "Remover":</strong> Elimina permanentemente la asignación de una materia a un docente para un grupo específico. Esta acción pedirá confirmación.</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoading ? (
            Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
            <>
                <StatCard title="Total de Docentes" value={stats.totalTeachers} icon={Users}/>
                <StatCard title="Total de Asignaciones" value={stats.totalAssignments} icon={BookCopy}/>
                <StatCard title="Carreras Afectadas" value={stats.totalCareers} icon={ChevronsRight}/>
                <StatCard title="Grupos Activos" value={stats.activeGroups} icon={Users}/>
                <StatCard title="Grupos Inactivos" value={stats.inactiveGroups} icon={Users}/>
            </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>
            Utiliza los filtros para encontrar las asignaciones que necesitas validar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Agrupar por</label>
                <Select value={groupBy} onValueChange={setGroupBy} disabled={isLoading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="docente">Docente</SelectItem>
                        <SelectItem value="carrera" disabled>Carrera (Próximamente)</SelectItem>
                        <SelectItem value="grupo" disabled>Grupo (Próximamente)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Carrera</label>
                <Select value={careerFilter} onValueChange={setCareerFilter} disabled={isLoading}>
                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las Carreras</SelectItem>
                        {careers.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Ciclo Académico</label>
                <Select value={cycleFilter} onValueChange={setCycleFilter} disabled={isLoading}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los Ciclos</SelectItem>
                         {cycles.map(c => <SelectItem key={c} value={String(c)}>Ciclo {c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Estado del Grupo</label>
                 <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los Estados</SelectItem>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>
      
      <Accordion type="multiple" className="w-full space-y-4">
          {isLoading ? (
              <Card><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ) : groupedByTeacher.length > 0 ? (
              groupedByTeacher.map(({ docenteId, docenteNombre, assignments }) => (
                  <AccordionItem value={docenteId} key={docenteId} className="border-b-0">
                    <Card className="overflow-hidden">
                        <AccordionTrigger className="p-4 hover:no-underline hover:bg-muted/50">
                            <div className="flex items-center gap-4">
                                <Users className="h-5 w-5 text-primary"/>
                                <span className="font-semibold text-lg">{docenteNombre}</span>
                                <Badge variant="secondary">{assignments.length} asignaciones</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-0">
                           <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Carrera</TableHead>
                                        <TableHead>Materia</TableHead>
                                        <TableHead>Grupo</TableHead>
                                        <TableHead>Ciclo</TableHead>
                                        <TableHead>Estado Grupo</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assignments.map((a) => (
                                        <TableRow key={`${a.grupoId}-${a.horarioId}`}>
                                            <TableCell>{a.carreraNombre}</TableCell>
                                            <TableCell className="font-medium">{a.materiaNombre}</TableCell>
                                            <TableCell>{a.grupoCodigo}</TableCell>
                                            <TableCell>{a.ciclo}</TableCell>
                                            <TableCell><Badge variant={a.estadoGrupo === 'activo' ? 'secondary' : 'destructive'}>{a.estadoGrupo}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isActionLoading}><MoreVertical className="h-4 w-4"/></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleValidate(a)} className="text-green-600 focus:text-green-600">
                                                                <ShieldCheck className="mr-2 h-4 w-4"/> Validar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => router.push('/dashboard/admin/schedules')}>
                                                                <Edit className="mr-2 h-4 w-4"/> Editar
                                                            </DropdownMenuItem>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                                                                    <Trash2 className="mr-2 h-4 w-4"/> Remover
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta acción removerá la asignación de la materia <strong>{a.materiaNombre}</strong> al docente <strong>{a.docenteNombre}</strong> en el grupo <strong>{a.grupoCodigo}</strong>. No se puede deshacer.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleRemove(a)} className="bg-destructive hover:bg-destructive/90">Remover Asignación</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                           </div>
                        </AccordionContent>
                    </Card>
                  </AccordionItem>
              ))
          ) : (
             <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No se encontraron asignaciones con los filtros seleccionados.
                </CardContent>
             </Card>
          )}
      </Accordion>
    </div>
  );
}
