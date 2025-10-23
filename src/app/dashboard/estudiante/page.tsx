
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, GraduationCap, Calendar as CalendarIcon, User, CheckSquare, BookCopy, Star, TrendingUp, AlertTriangle, Activity, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Materia } from "@/types";
import { createHash } from 'crypto';
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";


interface Course {
    id: string;
    title: string;
    progress: number;
    image: string;
    imageHint: string;
    pendingActivities: number;
    currentGrade: number;
    attendance: number;
}

const calendarEvents = [
    { date: new Date(), title: "Cuestionario de Cálculo", course: "Cálculo Diferencial", type: "task" },
    { date: new Date(), title: "Clase de Bases de Datos", course: "Bases de Datos Avanzadas", type: "class" },
    { date: new Date(new Date().setDate(new Date().getDate() + 2)), title: "Examen Parcial de IA", course: "Inteligencia Artificial", type: "exam" },
    { date: new Date(new Date().setDate(new Date().getDate() + 5)), title: "Entrega Proyecto Final", course: "Lógica de Programación", type: "task" },
];

const getSeedFromString = (str: string): string => {
    if (!str) return 'default-seed';
    return createHash('md5').update(str).digest('hex');
};

const EventIcon = ({ type }: { type: string }) => {
    switch(type) {
        case 'task': return <CheckSquare className="h-5 w-5 text-yellow-500" />;
        case 'class': return <BookCopy className="h-5 w-5 text-blue-500" />;
        case 'exam': return <GraduationCap className="h-5 w-5 text-red-500" />;
        default: return <CalendarIcon className="h-5 w-5 text-gray-500" />;
    }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
        type: "spring",
        stiffness: 100,
    }
  },
};


export default function StudentDashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState({ courses: true, stats: true });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    const storedUserId = localStorage.getItem('userId');

    if (storedUserId && storedRole === 'estudiante') {
      setUserId(storedUserId);
    } else {
      router.push('/login');
    }
  }, [router]);
  
  useEffect(() => {
    if (!userId) return;

    const fetchDashboardData = async () => {
        setIsLoading({ courses: true, stats: true });
        try {
            const [userSnap, careersSnapshot, studentSnap] = await Promise.all([
                getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId)),
                getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras")),
                getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", userId))
            ]);
            
            if (userSnap.exists()) {
                setUserName(userSnap.data().nombre1 || "Estudiante");
            }
            
            const allSubjectsMap = new Map<string, Materia>();
            careersSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.ciclos) data.ciclos.forEach((c: any) => c.materias.forEach((m: any) => { if(m.id) allSubjectsMap.set(m.id, m) }));
            });

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
                        title: enrolledSubject.nombre,
                        progress: Math.floor(Math.random() * 100),
                        image: imageUrl,
                        imageHint: imageHint,
                        pendingActivities: Math.floor(Math.random() * 5),
                        currentGrade: Math.random() * (4.8 - 3.2) + 3.2,
                        attendance: Math.floor(Math.random() * (100 - 85) + 85),
                    };
                });
                setCourses(fetchedCourses);
            } else {
                setCourses([]);
            }
        } catch (error) {
            console.error("Error fetching student dashboard data: ", error);
        } finally {
            setIsLoading({ courses: false, stats: false });
        }
    };

    fetchDashboardData();
  }, [userId]);


  const nextDeadline = calendarEvents
      .filter(e => e.date > new Date() && e.type !== 'class')
      .sort((a,b) => a.date.getTime() - b.date.getTime())[0];

  return (
    <motion.div 
        className="flex flex-col gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
    >
        <motion.div variants={itemVariants}>
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">¡Hola de nuevo, {userName || 'estudiante'}!</h1>
            <p className="text-muted-foreground">Aquí tienes un resumen de tu actividad académica.</p>
        </motion.div>
        
        {nextDeadline && (
            <motion.div variants={itemVariants}>
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <AlertTriangle className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Lo próximo para ti</CardTitle>
                            <CardDescription>
                                Próxima Entrega: <strong>{nextDeadline.title}</strong> en{" "}
                                {formatDistanceToNow(nextDeadline.date, { locale: es, addSuffix: true })}
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </motion.div>
        )}
      
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
        variants={containerVariants}
      >
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
            <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 font-poppins">Mis Materias</h2>
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard/materias">
                            Ver todas
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                 {isLoading.courses ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-80 rounded-2xl" />
                        <Skeleton className="h-80 rounded-2xl" />
                    </div>
                ) : courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {courses.slice(0, 4).map((course) => (
                           <Link href={`/dashboard/materias/${course.id}`} key={course.id}>
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
                                   <CardTitle className="text-xl font-bold text-gray-800 leading-tight" title={course.title}>
                                       {course.title}
                                   </CardTitle>
                               </CardHeader>
                               <CardContent className="flex-grow flex flex-col justify-end">
                                    <div className="space-y-4">
                                         <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-medium text-muted-foreground"><span>Progreso</span><span>{course.progress}%</span></div>
                                            <Progress value={course.progress} className="h-2"/>
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
                        ))}
                    </div>
                 ) : (
                    <Card><CardContent className="p-6 text-center text-muted-foreground">No estás inscrito en ninguna materia actualmente.</CardContent></Card>
                 )}
            </motion.div>
        </div>
        
        {/* Side Column */}
        <div className="lg:col-span-1 space-y-8">
            <motion.div variants={itemVariants}>
                <h2 className="text-2xl font-bold text-gray-800 font-poppins mb-4">Tu Progreso Académico</h2>
                 <Card>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium"><span>Promedio General</span><span className="text-primary font-bold">4.2 / 5.0</span></div>
                            <Progress value={(4.2 / 5) * 100} />
                        </div>
                         <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium"><span>Créditos Aprobados</span><span className="text-primary font-bold">18 / 120</span></div>
                            <Progress value={(18 / 120) * 100} />
                        </div>
                         <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium"><span>Materias del Ciclo</span><span className="text-primary font-bold">{courses.length} / 6</span></div>
                            <Progress value={(courses.length / 6) * 100} />
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button variant="outline" asChild className="w-full">
                            <Link href="/dashboard/calificaciones">Ver historial completo</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
