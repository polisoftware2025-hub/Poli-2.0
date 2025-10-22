
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookCopy, Search, LayoutGrid, List } from "lucide-react";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Materia } from "@/types";
import { createHash } from 'crypto';
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  code: string;
  progress: number;
  image: string;
  imageHint: string;
}

// Simple hash function to get a numeric seed from a string
const getSeedFromString = (str: string): string => {
    return createHash('md5').update(str).digest('hex');
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
            // 1. Fetch all careers to build a map of all subjects
            const careersSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
            const allSubjectsMap = new Map<string, Materia>();
            careersSnapshot.forEach(careerDoc => {
                const careerData = careerDoc.data();
                 if (careerData.ciclos && Array.isArray(careerData.ciclos)) {
                    careerData.ciclos.forEach((ciclo: any) => {
                        if (ciclo.materias && Array.isArray(ciclo.materias)) {
                            ciclo.materias.forEach((materia: any) => {
                                if(materia.id && !allSubjectsMap.has(materia.id)) {
                                    allSubjectsMap.set(materia.id, materia as Materia);
                                }
                            });
                        }
                    });
                }
            });

            // 2. Fetch student data to get their enrolled subjects
            const studentRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", userId);
            const studentSnap = await getDoc(studentRef);

            if (studentSnap.exists()) {
                const studentData = studentSnap.data();
                const studentSubjectsInfo = studentData.materiasInscritas || [];

                const fetchedCourses = studentSubjectsInfo.map((enrolledSubject: any) => {
                    const subjectDetails = allSubjectsMap.get(enrolledSubject.id);
                    const seed = getSeedFromString(enrolledSubject.id || enrolledSubject.nombre);
                    const placeholderImage = `https://picsum.photos/seed/${seed}/600/400`;
                    
                    const imageUrl = subjectDetails?.imagenURL || placeholderImage;
                    const imageHint = subjectDetails?.imagenURL ? "subject image" : "abstract texture";

                    return {
                        id: enrolledSubject.id,
                        title: enrolledSubject.nombre.toUpperCase(),
                        code: (subjectDetails?.codigo || enrolledSubject.id).toUpperCase(),
                        progress: Math.floor(Math.random() * 100), // Placeholder progress
                        image: imageUrl,
                        imageHint: imageHint,
                    };
                });
                setCourses(fetchedCourses);
            } else {
                console.log("No se encontró el documento del estudiante.");
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mis Cursos"
        description="Gestiona y accede a todas tus materias inscritas."
        icon={<BookCopy className="h-8 w-8 text-primary" />}
      />
      
      <Card>
        <CardContent className="p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">Vista general de curso</h2>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-auto">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="inprogress">En progreso</SelectItem>
                <SelectItem value="future">Futuros</SelectItem>
                <SelectItem value="past">Pasados</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Buscar..." className="pl-9" />
            </div>

            <Select defaultValue="last-accessed">
              <SelectTrigger className="w-full md:w-auto">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-accessed">Ordenar por último acceso</SelectItem>
                <SelectItem value="name-asc">Ordenar por nombre (A-Z)</SelectItem>
                <SelectItem value="name-desc">Ordenar por nombre (Z-A)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-md border bg-gray-100 p-1">
                <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')}>
                    <LayoutGrid className="h-5 w-5"/>
                </Button>
                 <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')}>
                    <List className="h-5 w-5"/>
                </Button>
            </div>
          </div>
          
          {isLoading ? (
             <div className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {[...Array(4)].map((_, index) => (
                   <Card key={index}><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>
                ))}
            </div>
          ) : courses.length > 0 ? (
            <div className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {courses.map((course) => (
                  <Link href={`/dashboard/materias/${course.id}`} key={course.id}>
                    <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 h-full">
                        <div className="relative h-48 w-full">
                            <Image 
                                src={course.image}
                                alt={`Imagen de ${course.title}`}
                                fill
                                style={{objectFit: 'cover'}}
                                className="transition-transform duration-500 group-hover:scale-105"
                                data-ai-hint={course.imageHint}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-2 left-4 text-white">
                                <span className="text-sm font-semibold">{course.progress}% completado</span>
                            </div>
                        </div>
                        <CardContent className="flex flex-1 flex-col justify-between p-4">
                            <div>
                                <h3 className="font-semibold text-base leading-tight mb-1 truncate" title={course.title}>
                                    {course.title}
                                </h3>
                                <p className="text-xs text-muted-foreground">{course.code}</p>
                            </div>
                            <div className="mt-4">
                                <Progress value={course.progress} className="h-2"/>
                            </div>
                        </CardContent>
                    </Card>
                  </Link>
              ))}
            </div>
           ) : (
            <Card className="col-span-full">
                <CardContent className="p-6 text-center text-muted-foreground">
                    No estás inscrito en ninguna materia actualmente.
                </CardContent>
            </Card>
           )}

           <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Mostrar</span>
                    <Select defaultValue="12">
                        <SelectTrigger className="w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="12">12</SelectItem>
                            <SelectItem value="24">24</SelectItem>
                            <SelectItem value="48">48</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {/* Pagination can be added here */}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
