"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, X, GraduationCap, Calendar as CalendarIcon, User, FileText, CheckSquare } from "lucide-react";
import Image from 'next/image';
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";

const initialCourses = [
  {
    title: "PRUEBAS Y MANTENIMIENTO DE ...",
    progress: 7,
    image: "https://placehold.co/600x400.png",
    imageHint: "abstract pattern",
  },
  {
    title: "LENGUAJES DE PROGRAMACION ...",
    progress: 10,
    image: "https://placehold.co/600x400.png",
    imageHint: "abstract waves",
  },
  {
    title: "INTELIGENCIA ARTIFICIAL",
    progress: 0,
    image: "https://placehold.co/600x400.png",
    imageHint: "abstract circles",
  },
  {
    title: "CONTABILIDAD BASICA",
    progress: 40,
    image: "https://placehold.co/600x400.png",
    imageHint: "abstract geometric",
  },
  {
    title: "CALCULO DIFERENCIAL",
    progress: 85,
    image: "https://placehold.co/600x400.png",
    imageHint: "mathematics equations",
  },
  {
    title: "BASE DE DATOS",
    progress: 25,
    image: "https://placehold.co/600x400.png",
    imageHint: "database servers",
  },
];

const todoItems = [
    { id: "task1", label: "Cuestionario de Cálculo", dueDate: "2024-08-15", course: "Cálculo Diferencial", completed: false },
    { id: "task2", label: "Entrega de Prototipo IA", dueDate: "2024-08-20", course: "Inteligencia Artificial", completed: false },
    { id: "task3", label: "Examen Parcial de Base de Datos", dueDate: "2024-08-22", course: "Base de Datos", completed: true },
    { id: "task4", label: "Taller de Pruebas de Software", dueDate: "2024-08-25", course: "Pruebas y Mant.", completed: false },
]

export default function StudentDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    if (storedEmail && userRole === 'estudiante') {
      setUserEmail(storedEmail);
    } else if (storedEmail) {
       router.push('/dashboard');
    }
    else {
      router.push('/login');
    }
  }, [router]);
  
  if (!userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
       {showWelcome && (
         <Card className="relative bg-primary/5 border-primary/20">
           <CardHeader>
               <CardTitle className="font-poppins text-2xl font-bold text-gray-800">
                  ¡Bienvenido de vuelta, estudiante!
               </CardTitle>
               <CardDescription className="font-poppins text-gray-600">
                  Este es tu panel. Revisa tus materias, tareas pendientes y accesos rápidos.
               </CardDescription>
           </CardHeader>
           <CardContent>
               <p className="text-gray-700">Has iniciado sesión como: <span className="font-semibold text-primary">{userEmail}</span></p>
           </CardContent>
           <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setShowWelcome(false)}>
              <X className="h-4 w-4" />
           </Button>
         </Card>
       )}
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Button variant="outline" size="lg" className="h-auto py-6 flex flex-col gap-2" asChild>
            <Link href="/dashboard/calificaciones">
                <GraduationCap className="h-8 w-8 text-primary"/>
                <span className="font-semibold text-base">Ver Calificaciones</span>
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-auto py-6 flex flex-col gap-2" asChild>
             <Link href="/dashboard/horarios">
                <CalendarIcon className="h-8 w-8 text-primary"/>
                <span className="font-semibold text-base">Ver Horario</span>
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-auto py-6 flex flex-col gap-2" asChild>
            <Link href="/dashboard/profile">
                <User className="h-8 w-8 text-primary"/>
                <span className="font-semibold text-base">Mi Perfil</span>
            </Link>
          </Button>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-poppins text-2xl font-bold text-gray-800">Mis Materias Actuales</h2>
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/materias">
                        Ver todas las materias
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {initialCourses.map((course, index) => (
                <Card key={index} className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
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
            ))}
            </div>
        </div>
        
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <CheckSquare className="h-6 w-6 text-primary"/>
                <h2 className="font-poppins text-2xl font-bold text-gray-800">Lista de Tareas Pendientes</h2>
            </div>
            <Card>
                <CardContent className="space-y-4 p-6">
                    {todoItems.map((item) => (
                        <div key={item.id} className="flex items-start gap-4">
                            <Checkbox id={item.id} checked={item.completed} className="mt-1"/>
                            <div className="grid gap-1.5">
                                <label htmlFor={item.id} className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {item.label}
                                </label>
                                <div className="flex items-center gap-2">
                                        <Badge variant={item.completed ? "secondary" : "outline"} className="text-xs">{item.course}</Badge>
                                        <p className="text-xs text-muted-foreground">{new Date(item.dueDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" className="w-full mt-4">
                        Ver todas las tareas
                    </Button>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <CalendarIcon className="h-6 w-6 text-primary"/>
                <h2 className="font-poppins text-2xl font-bold text-gray-800">Calendario</h2>
            </div>
            <Card>
                <CardContent className="p-2">
                    <Calendar
                        mode="single"
                        selected={new Date()}
                        className="w-full"
                    />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
