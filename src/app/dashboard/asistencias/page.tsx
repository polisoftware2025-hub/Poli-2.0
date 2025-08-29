
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { CheckSquare, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc, DocumentData } from "firebase/firestore";

interface Asistencia {
  id: string;
  fecha: Timestamp;
  estado: "Presente" | "Ausente";
  materiaId: string;
  grupoId: string;
  materiaNombre?: string;
}

interface Grupo {
    id: string;
    materia: { id: string; nombre: string };
}

export default function AttendancePage() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [filtroMateria, setFiltroMateria] = useState<string>("todos");

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchAttendanceData = async () => {
      setIsLoading(true);
      try {
        // 1. Obtener los grupos del estudiante
        const gruposRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        const studentGroupsQuery = query(gruposRef, where("estudiantes", "array-contains-any", [{id: userId}]));
        const studentGroupsSnapshot = await getDocs(studentGroupsQuery);
        const studentGroups: Grupo[] = [];
        studentGroupsSnapshot.forEach(doc => {
            const groupData = doc.data();
             if (groupData.estudiantes && groupData.estudiantes.some((est: any) => est.id === userId)) {
                studentGroups.push({ id: doc.id, materia: groupData.materia });
            }
        });
        setGrupos(studentGroups);

        // 2. Obtener las asistencias del estudiante
        const asistenciasRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/asistencias");
        // Se elimina el `orderBy` para evitar la necesidad de un índice compuesto.
        // El ordenamiento se hará en el cliente.
        const q = query(
            asistenciasRef, 
            where("estudianteId", "==", userId)
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedAsistencias = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const grupo = studentGroups.find(g => g.id === data.grupoId);
            return {
                id: doc.id,
                ...data,
                materiaNombre: grupo?.materia.nombre || "Materia Desconocida",
            } as Asistencia;
        });
        
        // Ordenar las asistencias en el lado del cliente
        fetchedAsistencias.sort((a, b) => b.fecha.toMillis() - a.fecha.toMillis());

        setAsistencias(fetchedAsistencias);
      } catch (error) {
        console.error("Error fetching attendance data: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, [userId]);

  const asistenciasFiltradas = useMemo(() => {
    if (filtroMateria === "todos") {
      return asistencias;
    }
    const grupoSeleccionado = grupos.find(g => g.id === filtroMateria);
    if (!grupoSeleccionado) return [];
    return asistencias.filter(a => a.materiaId === grupoSeleccionado.materia.id);
  }, [asistencias, filtroMateria, grupos]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis Asistencias"
        description="Revisa tu registro de asistencias y faltas por materia."
        icon={<CheckSquare className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Historial de Asistencias</CardTitle>
          <CardDescription>
            Aquí puedes ver el detalle de tus asistencias para cada materia.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center gap-4 mb-6">
             <Filter className="h-5 w-5 text-muted-foreground" />
             <Select value={filtroMateria} onValueChange={setFiltroMateria} disabled={isLoading || grupos.length === 0}>
                <SelectTrigger className="w-full md:w-72">
                    <SelectValue placeholder="Filtrar por materia..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todos">Todas las materias</SelectItem>
                    {grupos.map(g => (
                        <SelectItem key={g.id} value={g.id}>
                            {g.materia.nombre}
                        </SelectItem>
                    ))}
                </SelectContent>
             </Select>
           </div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : asistenciasFiltradas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asistenciasFiltradas.map((asistencia) => (
                  <TableRow key={asistencia.id}>
                    <TableCell>
                      {asistencia.fecha.toDate().toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{asistencia.materiaNombre}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={asistencia.estado === "Presente" ? "secondary" : "destructive"}
                        className={asistencia.estado === "Presente" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {asistencia.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <p>No tienes registros de asistencia todavía.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
