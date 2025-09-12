
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { ShieldCheck, Filter, Users, BookCopy, ChevronsRight, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
}

interface GroupedAssignments {
    [docenteId: string]: {
        docenteNombre: string;
        assignments: TeacherAssignment[];
    }
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
  const { toast } = useToast();

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
  
  const filteredAssignments = useMemo(() => {
    return allAssignments.filter(a => 
      (careerFilter === 'all' || a.carreraId === careerFilter) &&
      (cycleFilter === 'all' || a.ciclo === parseInt(cycleFilter)) &&
      (statusFilter === 'all' || a.estadoGrupo === statusFilter)
    );
  }, [allAssignments, careerFilter, cycleFilter, statusFilter]);

  const groupedByTeacher = useMemo(() => {
      const grouped: GroupedAssignments = {};
      filteredAssignments.forEach(assignment => {
          if (!grouped[assignment.docenteId]) {
              grouped[assignment.docenteId] = {
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
                                    {assignments.map((a, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{a.carreraNombre}</TableCell>
                                            <TableCell className="font-medium">{a.materiaNombre}</TableCell>
                                            <TableCell>{a.grupoCodigo}</TableCell>
                                            <TableCell>{a.ciclo}</TableCell>
                                            <TableCell><Badge variant={a.estadoGrupo === 'activo' ? 'secondary' : 'destructive'}>{a.estadoGrupo}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4"/> Editar</DropdownMenuItem>
                                                        <DropdownMenuItem><ShieldCheck className="mr-2 h-4 w-4"/> Validar</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Remover</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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

