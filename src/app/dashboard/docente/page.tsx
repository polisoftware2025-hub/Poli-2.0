
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, UserCheck, BookCopy, ArrowRight, Calendar, BarChart3, ListTodo, Users, Edit, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const teacherData = {
    assignedGroups: [
        { id: 'grp001', name: 'Cálculo Diferencial (CD-001)', students: 32 },
        { id: 'grp002', name: 'Bases de Datos (BD-002)', students: 28 },
        { id: 'grp003', name: 'Inteligencia Artificial (IA-001)', students: 25 },
    ],
    pendingTasks: 14,
    nextActivities: [
        { time: "10:00 AM", name: "Clase de Bases de Datos (BD-002)" },
        { time: "02:00 PM", name: "Reunión de Facultad de Ingeniería" },
        { time: "Mañana", name: "Entrega de notas - Parcial 1" },
    ]
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    if (storedEmail && userRole === 'docente') {
      setUserEmail(storedEmail);
    } else if (storedEmail) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  if (!userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-poppins text-2xl font-bold text-gray-800">
            Panel de Docente
          </CardTitle>
          <CardDescription className="font-poppins text-gray-600">
            Gestión de cursos, notas y asistencia de sus estudiantes.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BookCopy className="h-5 w-5 text-primary"/>
                    Mis Grupos Asignados
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {teacherData.assignedGroups.slice(0, 3).map(group => (
                        <div key={group.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted">
                            <span>{group.name}</span>
                            <Badge variant="secondary">{group.students} Est.</Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Tareas por Calificar</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
                <div className="text-5xl font-bold text-primary">{teacherData.pendingTasks}</div>
                    <Button asChild>
                    <Link href="/dashboard/docente/cursos">
                        Ir a Calificar
                    </Link>
                </Button>
            </CardContent>
        </Card>
         <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ListTodo className="h-5 w-5 text-primary"/>
                    Próximas Actividades
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                   {teacherData.nextActivities.map((activity, index) => (
                       <li key={index} className="flex items-center gap-3 text-sm">
                           <span className="font-bold text-primary w-20">{activity.time}</span>
                           <span className="text-muted-foreground">{activity.name}</span>
                       </li>
                   ))}
                </ul>
            </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button asChild size="lg" className="w-full py-6 text-lg">
              <Link href="/dashboard/horarios">
                  <Calendar className="mr-2 h-5 w-5"/>
                  Ver mi horario completo
              </Link>
          </Button>
          <Button asChild size="lg" className="w-full py-6 text-lg" variant="outline">
              <Link href="/dashboard/docente/disponibilidad">
                  <Clock className="mr-2 h-5 w-5"/>
                  Gestionar mi Disponibilidad
              </Link>
          </Button>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button variant="outline" size="lg" className="h-auto py-6 flex-col gap-2" asChild>
                <Link href="/dashboard/docente/cursos">
                    <Users className="h-8 w-8 text-primary"/>
                    <span className="font-semibold text-base">Mis Cursos</span>
                </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-auto py-6 flex-col gap-2" asChild>
                <Link href="/dashboard/docente/cursos">
                    <Edit className="h-8 w-8 text-primary"/>
                    <span className="font-semibold text-base">Registro de Notas</span>
                </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-auto py-6 flex-col gap-2" asChild>
                <Link href="/dashboard/docente/cursos">
                    <UserCheck className="h-8 w-8 text-primary"/>
                    <span className="font-semibold text-base">Control de Asistencia</span>
                </Link>
            </Button>
        </div>

    </div>
  );
}
