
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { BookCopy, Users, School, Search, ChevronRight, Tag, Activity, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, DocumentData } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface Course {
  id: string; // Combination of groupId and subjectId for uniqueness
  subjectId: string;
  subjectName: string;
  groupId: string;
  groupCode: string;
  careerName: string;
  sedeName: string;
  totalStudents: number;
  courseProgress: number; // Placeholder: 0-100
  totalActivities: number; // Placeholder
  groupAverage: number; // Placeholder
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 14,
    },
  },
};


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
                
                const courseId = `${groupDoc.id}___${slot.materiaId}`;

                if (!teacherCourses.find(c => c.id === courseId)) {
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
                        courseProgress: Math.floor(Math.random() * 80) + 10,
                        totalActivities: Math.floor(Math.random() * 10) + 5,
                        groupAverage: Math.random() * (4.5 - 3.0) + 3.0,
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
        <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {[...Array(3)].map((_, i) => (
                 <motion.div key={i} variants={cardVariants}>
                    <Skeleton className="h-64 rounded-2xl" />
                </motion.div>
            ))}
        </motion.div>
      ) : filteredCourses.length > 0 ? (
        <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
          {filteredCourses.map(course => (
             <motion.div key={course.id} variants={cardVariants} whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link href={`/dashboard/docente/cursos/${course.id}`}>
                    <Card className="rounded-2xl h-full flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300 border-l-4 border-primary">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <Badge variant="secondary" className="bg-primary/10 text-primary">{course.groupCode}</Badge>
                                <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">Activo</span>
                            </div>
                            <CardTitle className="text-xl pt-2">{course.subjectName}</CardTitle>
                            <CardDescription>{course.careerName}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <div className="flex items-center gap-2"><School className="h-4 w-4"/><span>{course.sedeName}</span></div>
                                <div className="flex items-center gap-2"><Users className="h-4 w-4"/><span>{course.totalStudents} Estudiantes</span></div>
                            </div>
                             <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                    <span>Progreso del Semestre</span>
                                    <span>{course.courseProgress}%</span>
                                </div>
                                <Progress value={course.courseProgress} className="h-2"/>
                             </div>
                             <div className="flex justify-around text-center text-sm pt-2">
                                <div>
                                    <p className="font-bold text-lg">{course.totalActivities}</p>
                                    <p className="text-xs text-muted-foreground">Actividades</p>
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-primary">{course.groupAverage.toFixed(1)}</p>
                                    <p className="text-xs text-muted-foreground">Promedio</p>
                                </div>
                             </div>
                        </CardContent>
                        <CardFooter className="p-4 bg-muted/50 rounded-b-2xl">
                            <Button className="w-full bg-primary/90 hover:bg-primary">
                                Gestionar Curso <ChevronRight className="ml-2 h-4 w-4"/>
                            </Button>
                        </CardFooter>
                    </Card>
                </Link>
             </motion.div>
          ))}
        </motion.div>
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
