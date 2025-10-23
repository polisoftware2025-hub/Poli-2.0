"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BookCopy, Search, LayoutGrid, List, User, Clock, CheckCircle, Activity } from "lucide-react";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Materia } from "@/types";
import { createHash } from 'crypto';
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  title: string;
  code: string;
  teacher: string;
  sede: string;
  grupo: string;
  ciclo: string;
  modalidad: string;
  progress: number;
  image: string;
  imageHint: string;
  pendingActivities: number;
  currentGrade: number;
  attendance: number;
}

const getSeedFromString = (str: string): string => {
    if (!str) return 'default-seed';
    return createHash('md5').update(str).digest('hex');
};

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

export default function CoursesPage() {
  const [view, setView] = useState("grid");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            const careersSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
            const allSubjectsMap = new Map<string, Materia>();
            careersSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.ciclos) data.ciclos.forEach((c: any) => c.materias.forEach((m: any) => { if(m.id) allSubjectsMap.set(m.id, m) }));
            });

            const studentRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", userId);
            const studentSnap = await getDoc(studentRef);
            
            if (studentSnap.exists()) {
                const studentData = studentSnap.data();
                const studentSubjectsInfo = studentData.materiasInscritas || [];

                const groupRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", studentData.grupo);
                const groupSnap = await getDoc(groupRef);
                const groupData = groupSnap.exists() ? groupSnap.data() : {};
                const sedeRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes", studentData.sedeId);
                const sedeSnap = await getDoc(sedeRef);
                const sedeName = sedeSnap.exists() ? sedeSnap.data().nombre : 'N/A';

                const fetchedCourses = (await Promise.all(studentSubjectsInfo.map(async (enrolledSubject: any): Promise<Course | null> => {
                    const subjectDetails = allSubjectsMap.get(enrolledSubject.id);
                    if (!subjectDetails) return null;

                    const seed = getSeedFromString(subjectDetails.id || subjectDetails.nombre);
                    const placeholderImage = `https://picsum.photos/seed/${seed}/600/400`;
                    const imageUrl = subjectDetails.imagenURL || placeholderImage;
                    const imageHint = subjectDetails.imagenURL ? "subject image" : "abstract texture";
                    
                    const scheduleEntry = groupData.horario?.find((h: any) => h.materiaId === subjectDetails.id);

                    return {
                        id: subjectDetails.id,
                        title: subjectDetails.nombre,
                        code: subjectDetails.codigo || 'N/A',
                        teacher: scheduleEntry?.docenteNombre || 'Por asignar',
                        sede: sedeName,
                        grupo: groupData.codigoGrupo || 'N/A',
                        ciclo: `Ciclo ${studentData.cicloActual || 'N/A'}`,
                        modalidad: scheduleEntry?.modalidad || 'N/A',
                        progress: Math.floor(Math.random() * 100),
                        image: imageUrl,
                        imageHint: imageHint,
                        pendingActivities: Math.floor(Math.random() * 5),
                        currentGrade: Math.random() * (4.8 - 3.2) + 3.2,
                        attendance: Math.floor(Math.random() * (100 - 85) + 85),
                    };
                }))).filter((c): c is Course => c !== null);

                setCourses(fetchedCourses);
            } else {
                setCourses([]);
            }
        } catch (error) {
            console.error("Error fetching student courses: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchCourses();
  }, [userId]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis Materias"
        description="Gestiona y accede a todas tus materias inscritas."
        icon={<BookCopy className="h-8 w-8 text-primary" />}
      />
      
      <Card className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Buscar materia..." className="pl-9" />
            </div>
            <div className="flex items-center justify-end gap-2">
                 <p className="text-sm text-muted-foreground mr-2 hidden md:block">Vista:</p>
                 <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')}><LayoutGrid className="h-5 w-5"/></Button>
                 <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')}><List className="h-5 w-5"/></Button>
            </div>
          </div>
          
          <CardContent className="p-0">
          {isLoading ? (
             <motion.div 
                className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {[...Array(4)].map((_, index) => (
                   <motion.div key={index} variants={cardVariants}>
                     <Skeleton className="h-80 rounded-2xl" />
                   </motion.div>
                ))}
            </motion.div>
          ) : courses.length > 0 ? (
            <motion.div 
                className={`grid gap-8 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
              {courses.map((course) => (
                  <motion.div key={course.id} variants={cardVariants} whileHover={{ y: -5, scale: 1.03 }} transition={{ type: "spring", stiffness: 300 }}>
                     <Link href={`/dashboard/materias/${course.id}`}>
                        <Card className="group flex flex-col rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 h-full bg-gradient-to-br from-white to-gray-50/50">
                           <div className="relative h-40 w-full overflow-hidden">
                                <Image 
                                    src={course.image}
                                    alt={`Imagen de ${course.title}`}
                                    fill
                                    style={{objectFit: 'cover'}}
                                    className="transition-transform duration-500 group-hover:scale-105"
                                    data-ai-hint={course.imageHint}
                                />
                                {course.pendingActivities > 0 && (
                                     <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold animate-pulse">
                                        {course.pendingActivities}
                                     </div>
                                )}
                           </div>
                           <CardHeader>
                               <Badge variant="outline" className="w-fit mb-2">{course.modalidad}</Badge>
                               <CardTitle className="text-xl font-bold text-gray-800 leading-tight" title={course.title}>
                                   {course.title}
                               </CardTitle>
                               <CardDescription className="flex items-center gap-2 pt-1 text-sm">
                                   <User className="h-4 w-4"/> {course.teacher}
                               </CardDescription>
                           </CardHeader>
                           <CardContent className="flex-grow flex flex-col justify-end">
                                <div className="space-y-4">
                                     <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>{course.grupo}</span>
                                        <span>{course.ciclo}</span>
                                     </div>
                                     <div className="flex justify-between items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span className="text-xs font-medium">Asistencia: {course.attendance}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-blue-500" />
                                            <span className="text-xs font-medium">Nota: {course.currentGrade.toFixed(1)}</span>
                                        </div>
                                     </div>
                                </div>
                           </CardContent>
                        </Card>
                     </Link>
                  </motion.div>
              ))}
            </motion.div>
           ) : (
            <Card className="col-span-full">
                <CardContent className="p-6 text-center text-muted-foreground">
                    No estás inscrito en ninguna materia actualmente.
                </CardContent>
            </Card>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
