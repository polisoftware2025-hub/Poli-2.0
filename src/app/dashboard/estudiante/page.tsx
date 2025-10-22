
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, X, GraduationCap, Calendar as CalendarIcon, User, CheckSquare, BookCopy, Star, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Materia } from "@/types";
import { createHash } from 'crypto';
import { motion } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Course {
    id: string;
    title: string;
    progress: number;
    image: string;
    imageHint: string;
}

const calendarEvents = [
    { date: new Date(), title: "Cuestionario de Cálculo", course: "Cálculo Diferencial", type: "task" },
    { date: new Date(), title: "Clase de Bases de Datos", course: "Bases de Datos Avanzadas", type: "class" },
    { date: new Date(new Date().setDate(new Date().getDate() + 2)), title: "Examen Parcial de IA", course: "Inteligencia Artificial", type: "exam" },
    { date: new Date(new Date().setDate(new Date().getDate() + 5)), title: "Entrega Proyecto Final", course: "Lógica de Programación", type: "task" },
];

const getSeedFromString = (str: string): string => {
    return createHash('md5').update(str).digest('hex');
};

const StatCard = ({ title, value, icon: Icon, link, isLoading }: { title: string, value: string, icon: React.ElementType, link?: string, isLoading: boolean }) => (
    <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
                <span>{title}</span>
                <Icon className="h-5 w-5 text-muted-foreground" />
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-3xl font-bold text-primary">{value}</div>}
        </CardContent>
        {link && (
            <CardFooter className="pt-0">
                <Button variant="link" asChild className="p-0 h-auto text-xs">
                    <Link href={link}>Ver detalle <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
            </CardFooter>
        )}
    </Card>
);

const EventIcon = ({ type }: { type: string }) => {
    switch(type) {
        case 'task': return <CheckSquare className="h-5 w-5 text-yellow-500" />;
        case 'class': return <BookCopy className="h-5 w-5 text-blue-500" />;
        case 'exam': return <GraduationCap className="h-5 w-5 text-red-500" />;
        default: return <CalendarIcon className="h-5 w-5 text-gray-500" />;
    }
}


export default function StudentDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState({ courses: true, stats: true });
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedRole = localStorage.getItem('userRole');
    const storedUserId = localStorage.getItem('userId');

    if (storedEmail && storedRole === 'estudiante' && storedUserId) {
      setUserEmail(storedEmail);
      setUserId(storedUserId);
    } else if (storedEmail) {
       router.push('/dashboard');
    }
    else {
      router.push('/login');
    }
  }, [router]);
  
  useEffect(() => {
    if (!userId) return;

    const fetchDashboardData = async () => {
        setIsLoading({ courses: true, stats: true });
        try {
            // Fetch student name and subjects
            const studentRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", userId);
            const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);

            const [studentSnap, userSnap, careersSnapshot] = await Promise.all([
                getDoc(studentRef),
                getDoc(userRef),
                getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"))
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


  if (!userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Cargando...</p>
      </div>
    )
  }

  const eventsForSelectedDay = selectedDate
    ? calendarEvents.filter(
        (event) => event.date.toDateString() === selectedDate.toDateString()
      )
    : [];

  return (
    <div className="flex flex-col gap-8">
       {showWelcome && (
         <Card className="relative bg-primary/5 border-primary/20">
           <CardHeader>
               <CardTitle className="font-poppins text-2xl font-bold text-gray-800">
                  ¡Bienvenido de vuelta, {userName || 'estudiante'}!
               </CardTitle>
               <CardDescription className="font-poppins text-gray-600">
                  Este es tu panel. Revisa tus materias, tareas pendientes y accesos rápidos.
               </CardDescription>
           </CardHeader>
           <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setShowWelcome(false)}>
              <X className="h-4 w-4" />
           </Button>
         </Card>
       )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Promedio General" value="4.2" icon={TrendingUp} link="/dashboard/calificaciones" isLoading={isLoading.stats}/>
          <StatCard title="Créditos Aprobados" value="18" icon={GraduationCap} link="/dashboard/calificaciones" isLoading={isLoading.stats}/>
          <StatCard title="Materias Inscritas" value={courses.length.toString()} icon={BookCopy} link="/dashboard/materias" isLoading={isLoading.stats}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-poppins text-2xl font-bold text-gray-800">Mis Materias Actuales</h2>
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard/materias">
                            Ver todas
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                 {isLoading.courses ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-48 w-full rounded-2xl" />
                        <Skeleton className="h-48 w-full rounded-2xl" />
                    </div>
                ) : courses.length > 0 ? (
                    <Carousel opts={{ align: "start", loop: courses.length > 2 }} className="w-full">
                        <CarouselContent className="-ml-4">
                            {courses.map((course, index) => (
                                <CarouselItem key={index} className="pl-4 md:basis-1/2">
                                     <motion.div variants={{hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 }}} initial="hidden" animate="visible" transition={{ delay: index * 0.1 }}>
                                        <Link href={`/dashboard/materias/${course.id}`}>
                                            <Card className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                            <CardContent className="p-0">
                                                <div className="relative h-40 w-full">
                                                    <Image
                                                    src={course.image}
                                                    alt={`Imagen de ${course.title}`}
                                                    fill
                                                    style={{objectFit: 'cover'}}
                                                    className="group-hover:scale-105 transition-transform duration-500"
                                                    data-ai-hint={course.imageHint}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                    <div className="absolute bottom-2 left-4 text-white">
                                                        <span className="text-sm font-semibold">{course.progress}% completado</span>
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-semibold truncate" title={course.title}>{course.title}</h3>
                                                </div>
                                            </CardContent>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
                        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
                    </Carousel>
                 ) : (
                    <Card><CardContent className="p-6 text-center text-muted-foreground">No estás inscrito en ninguna materia actualmente.</CardContent></Card>
                 )}
            </div>
        </div>
        
        <div className="lg:col-span-1 space-y-4">
             <div className="flex items-center gap-3">
                <CalendarIcon className="h-6 w-6 text-primary"/>
                <h2 className="font-poppins text-2xl font-bold text-gray-800">Agenda del Día</h2>
            </div>
             <Card className="shadow-lg">
                <CardContent className="p-2">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="p-0 w-full"
                        markedDays={calendarEvents.map(e => e.date)}
                    />
                    <div className="border-t p-4 mt-2">
                        <h3 className="font-semibold mb-3">
                            Actividades para {selectedDate ? format(selectedDate, "PPP", { locale: es }) : 'hoy'}
                        </h3>
                        {eventsForSelectedDay.length > 0 ? (
                             <ul className="space-y-4">
                                {eventsForSelectedDay.map((event, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="mt-1"><EventIcon type={event.type} /></div>
                                        <div>
                                            <p className="font-medium text-sm">{event.title}</p>
                                            <p className="text-xs text-muted-foreground">{event.course}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center text-sm text-muted-foreground py-4">
                                <p>No hay actividades programadas para este día.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
