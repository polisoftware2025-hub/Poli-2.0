
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { ShieldCheck, Filter, BookCopy, ChevronsRight, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function ValidateTeachersPage() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [cycles, setCycles] = useState<number[]>([]);
  
  const [careerFilter, setCareerFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssignmentData = useCallback(async () => {
    setIsLoading(true);
    try {
      const careersSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
      const fetchedCareers = careersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Career));
      setCareers(fetchedCareers);
      const allCycles = new Set<number>();
      fetchedCareers.forEach(c => c.ciclos?.forEach(ciclo => allCycles.add(ciclo.numero)));
      setCycles(Array.from(allCycles).sort((a,b) => a-b));

      const careersMap = new Map(fetchedCareers.map(c => [c.id, c.nombre]));
      
      const groupsSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"));
      const allAssignments: TeacherAssignment[] = [];

      groupsSnapshot.forEach(groupDoc => {
        const groupData = groupDoc.data();
        if (groupData.horario && Array.isArray(groupData.horario)) {
          groupData.horario.forEach((slot: any) => {
            allAssignments.push({
              docenteNombre: slot.docenteNombre,
              docenteId: slot.docenteId,
              carreraNombre: careersMap.get(groupData.idCarrera) || "N/A",
              carreraId: groupData.idCarrera,
              materiaNombre: slot.materiaNombre,
              materiaId: slot.materiaId,
              grupoCodigo: groupData.codigoGrupo,
              grupoId: groupDoc.id,
              ciclo: groupData.ciclo,
              estadoGrupo: groupData.estado,
            });
          });
        }
      });
      
      // Remove duplicate assignments (same teacher, same subject, same group)
      const uniqueAssignments = Array.from(new Map(allAssignments.map(item => [`${item.docenteId}-${item.materiaId}-${item.grupoId}`, item])).values());
      setAssignments(uniqueAssignments);

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
    return assignments.filter(a => 
      (careerFilter === 'all' || a.carreraId === careerFilter) &&
      (cycleFilter === 'all' || a.ciclo === parseInt(cycleFilter)) &&
      (statusFilter === 'all' || a.estadoGrupo === statusFilter)
    );
  }, [assignments, careerFilter, cycleFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Validación de Docentes"
        description="Verifica los docentes asignados a las materias por carrera, ciclo y estado del grupo."
        icon={<ShieldCheck className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>
            Utiliza los filtros para encontrar las asignaciones de docentes que necesitas validar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-medium">Carrera</label>
                <Select value={careerFilter} onValueChange={setCareerFilter} disabled={isLoading}>
                    <SelectTrigger><SelectValue placeholder="Filtrar por carrera..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las Carreras</SelectItem>
                        {careers.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Ciclo Académico</label>
                <Select value={cycleFilter} onValueChange={setCycleFilter} disabled={isLoading}>
                    <SelectTrigger><SelectValue placeholder="Filtrar por ciclo..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los Ciclos</SelectItem>
                         {cycles.map(c => <SelectItem key={c} value={String(c)}>Ciclo {c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Estado del Grupo</label>
                 <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
                    <SelectTrigger><SelectValue placeholder="Filtrar por estado..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los Estados</SelectItem>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Resultados de la Búsqueda</CardTitle>
            <CardDescription>{filteredAssignments.length} asignaciones encontradas.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Docente</TableHead>
                        <TableHead>Carrera</TableHead>
                        <TableHead>Materia</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead className="text-center">Ciclo</TableHead>
                        <TableHead className="text-center">Estado del Grupo</TableHead>
                    </TableRow>
                </TableHeader>
                 <TableBody>
                    {isLoading ? (
                        Array.from({length: 5}).map((_, i) => (
                           <TableRow key={i}>
                                <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                           </TableRow>
                        ))
                    ) : filteredAssignments.length > 0 ? (
                        filteredAssignments.map((a, i) => (
                           <TableRow key={`${a.grupoId}-${a.materiaId}-${i}`}>
                                <TableCell className="font-medium">{a.docenteNombre}</TableCell>
                                <TableCell>{a.carreraNombre}</TableCell>
                                <TableCell>{a.materiaNombre}</TableCell>
                                <TableCell>{a.grupoCodigo}</TableCell>
                                <TableCell className="text-center">{a.ciclo}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={a.estadoGrupo === 'activo' ? 'secondary' : 'outline'}>{a.estadoGrupo}</Badge>
                                </TableCell>
                           </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">No se encontraron asignaciones con los filtros seleccionados.</TableCell>
                        </TableRow>
                    )}
                 </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
