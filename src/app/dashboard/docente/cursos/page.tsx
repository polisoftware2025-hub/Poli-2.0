
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { BookCopy, Users, School, Search, Briefcase, ChevronRight, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, DocumentData } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

interface Course {
  id: string; // Combination of groupId and subjectId for uniqueness
  subjectId: string;
  subjectName: string;
  groupId: string;
  groupCode: string;
  careerName: string;
  sedeName: string;
  totalStudents: number;
  schedule: string;
  modalidad: string;
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
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

    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const groupsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        const allGroupsSnapshot = await getDocs(groupsRef);
        
        const teacherCourses: Course[] = [];
        const sedesCache = new Map();
        const carrerasCache = new Map();

        for (const groupDoc of allGroupsSnapshot.docs) {
          const groupData = groupDoc.data();
          if (groupData.horario && Array.isArray(groupData.horario)) {
            for (const slot of groupData.horario) {
              if (slot.docenteId === userId) {
                
                let sedeName = sedesCache.get(groupData.idSede);
                if (!sedeName) {
                    const sedeDoc = await getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes", groupData.idSede));
                    sedeName = sedeDoc.exists() ? sedeDoc.data().nombre : "N/A";
                    sedesCache.set(groupData.idSede, sedeName);
                }

                let careerName = carrerasCache.get(groupData.idCarrera);
                if (!careerName) {
                    const careerDoc = await getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", groupData.idCarrera));
                    careerName = careerDoc.exists() ? careerDoc.data().nombre : "N/A";
                    carrerasCache.set(groupData.idCarrera, careerName);
                }
                
                // Uniquely identify a course by the combination of group and subject
                const courseId = `${groupDoc.id}___${slot.materiaId}`;

                if (!teacherCourses.find(c => c.id === courseId)) {
                    // Fetch the full group document again to ensure we have the latest student count
                    const currentGroupDoc = await getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", groupDoc.id));
                    const currentGroupData = currentGroupDoc.data();

                    teacherCourses.push({
                        id: courseId,
                        subjectId: slot.materiaId,
                        subjectName: slot.materiaNombre,
                        groupId: groupDoc.id,
                        groupCode: groupData.codigoGrupo,
                        careerName: careerName,
                        sedeName: sedeName,
                        totalStudents: currentGroupData?.estudiantes?.length || 0,
                        schedule: `${slot.dia} ${slot.hora}`,
                        modalidad: slot.modalidad,
                    });
                }
              }
            }
          }
        }
        
        setCourses(teacherCourses);
      } catch (err) {
        console.error("Error fetching courses: ", err);
        setError("No se pudieron cargar los cursos. Inténtalo de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [userId]);
  
  const filteredCourses = useMemo(() => {
    if (!searchTerm) return courses;
    return courses.filter(course => 
        course.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.careerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.groupCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [courses, searchTerm]);

  if (error) {
     return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Mis Cursos" description="Cursos que tienes a cargo." icon={<BookCopy className="h-8 w-8 text-primary" />} />
        <div className="text-center text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis Cursos"
        description="Visualiza las clases que tienes a tu cargo según el horario asignado."
        icon={<BookCopy className="h-8 w-8 text-primary" />}
      />

       <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input 
                placeholder="Buscar por materia, carrera o grupo..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <Card key={course.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{course.subjectName}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm pt-1">
                    <Briefcase className="h-4 w-4"/> {course.careerName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <School className="h-4 w-4"/>
                    <span>{course.sedeName}</span>
                </div>
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4"/>
                    <span>Grupo: <Badge variant="secondary">{course.groupCode}</Badge></span>
                </div>
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4"/>
                    <span>{course.totalStudents} Estudiantes</span>
                </div>
              </CardContent>
              <CardFooter>
                 <Button asChild className="w-full">
                    <Link href={`/dashboard/docente/cursos/${course.id}`}>
                        Gestionar Curso <ChevronRight className="ml-2 h-4 w-4"/>
                    </Link>
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>No se encontraron cursos asignados en tu horario. Si crees que esto es un error, contacta al administrador.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
