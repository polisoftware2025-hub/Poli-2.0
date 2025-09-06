
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { BookCopy, Users, School, Search, Briefcase, ChevronRight, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, DocumentData } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Group {
  id: string;
  codigoGrupo: string;
}
interface Subject {
  id: string;
  nombre: string;
  carreraNombre: string;
  sedeNombre: string;
  totalEstudiantes: number;
  groups: Group[];
}

export default function MySubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchSubjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const groupsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        const allGroupsSnapshot = await getDocs(groupsRef);
        
        const teacherAssignments: any[] = [];
        allGroupsSnapshot.forEach(groupDoc => {
            const groupData = groupDoc.data();
            if (groupData.horario && Array.isArray(groupData.horario)) {
                groupData.horario.forEach(h => {
                    if (h.docenteId === userId) {
                        teacherAssignments.push({
                            ...h,
                            grupoId: groupDoc.id,
                            grupoCodigo: groupData.codigoGrupo,
                            idCarrera: groupData.idCarrera,
                            idSede: groupData.idSede,
                            totalEstudiantes: groupData.estudiantes?.length || 0,
                        });
                    }
                });
            }
        });
        
        const sedesCache = new Map();
        const carrerasCache = new Map();

        const subjectsMap = new Map<string, Subject>();

        for (const assignment of teacherAssignments) {
            let sedeNombre = sedesCache.get(assignment.idSede);
            if (!sedeNombre) {
                const sedeDoc = await getDoc(doc(db, `Politecnico/mzIX7rzezDezczAV6pQ7/sedes`, assignment.idSede));
                if (sedeDoc.exists()) {
                    sedeNombre = sedeDoc.data().nombre;
                    sedesCache.set(assignment.idSede, sedeNombre);
                }
            }

            let carreraNombre = carrerasCache.get(assignment.idCarrera);
             if (!carreraNombre) {
                const carreraDoc = await getDoc(doc(db, `Politecnico/mzIX7rzezDezczAV6pQ7/carreras`, assignment.idCarrera));
                 if (carreraDoc.exists()) {
                    carreraNombre = carreraDoc.data().nombre;
                    carrerasCache.set(assignment.idCarrera, carreraNombre);
                }
            }

            if (subjectsMap.has(assignment.materiaId)) {
                const existingSubject = subjectsMap.get(assignment.materiaId)!;
                if (!existingSubject.groups.some(g => g.id === assignment.grupoId)) {
                     existingSubject.groups.push({ id: assignment.grupoId, codigoGrupo: assignment.grupoCodigo });
                     existingSubject.totalEstudiantes += assignment.totalEstudiantes;
                }
            } else {
                subjectsMap.set(assignment.materiaId, {
                    id: assignment.materiaId,
                    nombre: assignment.materiaNombre,
                    carreraNombre: carreraNombre || "N/A",
                    sedeNombre: sedeNombre || "N/A",
                    totalEstudiantes: assignment.totalEstudiantes,
                    groups: [{ id: assignment.grupoId, codigoGrupo: assignment.grupoCodigo }]
                });
            }
        }
        
        setSubjects(Array.from(subjectsMap.values()));
      } catch (err) {
        console.error("Error fetching subjects: ", err);
        setError("No se pudieron cargar las materias. Inténtalo de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [userId]);
  
  const filteredSubjects = useMemo(() => {
    if (!searchTerm) return subjects;
    return subjects.filter(subject => 
        subject.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.carreraNombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subjects, searchTerm]);


  if (error) {
     return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Mis Materias" description="Materias que tienes a cargo." icon={<BookCopy className="h-8 w-8 text-primary" />} />
        <div className="text-center text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis Materias"
        description="Visualiza las materias de las cuales eres responsable, basado en los horarios asignados."
        icon={<BookCopy className="h-8 w-8 text-primary" />}
      />

       <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input 
                placeholder="Buscar por nombre de materia o carrera..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
        </div>
      ) : filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map(subject => (
            <Card key={subject.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{subject.nombre}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm pt-1">
                    <Briefcase className="h-4 w-4"/> {subject.carreraNombre}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <School className="h-4 w-4"/>
                    <span>{subject.sedeNombre}</span>
                </div>
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4"/>
                    <span>{subject.totalEstudiantes} Estudiantes</span>
                </div>
                 <div className="flex items-start gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4 mt-1 shrink-0"/>
                    <div>
                        <span className="font-medium text-foreground">Grupos:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {subject.groups.map(group => (
                                <Badge key={group.id} variant="secondary">{group.codigoGrupo}</Badge>
                            ))}
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>No se encontraron materias asignadas en tu horario. Si crees que esto es un error, contacta al administrador.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
