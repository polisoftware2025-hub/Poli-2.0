
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, UserCheck, BookCopy, ArrowRight, Calendar, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Datos de ejemplo para la maquetación
const teacherData = {
    assignedGroups: [
        { id: 'grp001', name: 'Cálculo Diferencial (CD-001)', students: 32 },
        { id: 'grp002', name: 'Bases de Datos (BD-002)', students: 28 },
        { id: 'grp003', name: 'Inteligencia Artificial (IA-001)', students: 25 },
    ],
    pendingTasks: 14,
    nextActivities: [
        { id: 'act01', date: '2024-09-05', description: 'Examen Parcial - Cálculo' },
        { id: 'act02', date: '2024-09-10', description: 'Entrega Proyecto Final - BD' },
        { id: 'act03', date: '2024-09-12', description: 'Revisión Avance 2 - IA' },
    ],
    courseStats: [
        { name: "CD-001", average: 3.8 },
        { name: "BD-002", average: 4.2 },
        { name: "IA-001", average: 4.5 },
    ],
    schedule: [
        { dia: "Lunes", hora: "18:00 - 20:00", materia: "Cálculo Diferencial", grupo: "CD-001", aula: "Zoom-101" },
        { dia: "Martes", hora: "10:00 - 12:00", materia: "Bases de Datos", grupo: "BD-002", aula: "Sede 73 - 302" },
        { dia: "Miércoles", hora: "18:00 - 20:00", materia: "Cálculo Diferencial", grupo: "CD-001", aula: "Zoom-101" },
        { dia: "Jueves", hora: "10:00 - 12:00", materia: "Bases de Datos", grupo: "BD-002", aula: "Sede 73 - 302" },
        { dia: "Sábado", hora: "08:00 - 12:00", materia: "Inteligencia Artificial", grupo: "IA-001", aula: "Teams-IA" },
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
        <CardContent>
            {/* Widgets Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Assigned Groups Widget */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                           <BookCopy className="h-5 w-5 text-primary"/>
                           Mis Grupos Asignados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-3">
                           {teacherData.assignedGroups.map(group => (
                               <div key={group.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted">
                                   <span>{group.name}</span>
                                   <Badge variant="secondary">{group.students} Est.</Badge>
                               </div>
                           ))}
                       </div>
                       <Button variant="link" className="p-0 h-auto mt-4 text-primary" asChild>
                           <Link href="/dashboard/docente/grupos">
                                Ver todos los grupos <ArrowRight className="ml-2 h-4 w-4"/>
                           </Link>
                       </Button>
                    </CardContent>
                </Card>

                {/* Pending Tasks & Activities Widget */}
                <div className="flex flex-col gap-6">
                   <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Tareas por Calificar</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div className="text-3xl font-bold text-primary">{teacherData.pendingTasks}</div>
                             <Button asChild>
                                <Link href="/dashboard/docente/notas">
                                    Ir a Calificar
                                </Link>
                            </Button>
                        </CardContent>
                   </Card>
                   <Card>
                       <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary"/>
                                Próximas Actividades
                            </CardTitle>
                       </CardHeader>
                       <CardContent>
                           <ul className="space-y-2 text-sm">
                               {teacherData.nextActivities.map(activity => (
                                   <li key={activity.id} className="flex gap-3">
                                       <time className="font-semibold text-primary">{new Date(activity.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}:</time>
                                       <span>{activity.description}</span>
                                   </li>
                               ))}
                           </ul>
                       </CardContent>
                   </Card>
                </div>
            </div>
            
            {/* My Schedule Widget */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary"/>
                        Mi Horario Semanal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Día</TableHead>
                                    <TableHead>Hora</TableHead>
                                    <TableHead>Materia</TableHead>
                                    <TableHead>Grupo</TableHead>
                                    <TableHead>Aula</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teacherData.schedule.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.dia}</TableCell>
                                        <TableCell>{item.hora}</TableCell>
                                        <TableCell>{item.materia}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.grupo}</Badge>
                                        </TableCell>
                                        <TableCell>{item.aula}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                   </div>
                </CardContent>
            </Card>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
               <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Mis Grupos</CardTitle>
                  <BookCopy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Ver y administrar los grupos asignados.</p>
                  <Button className="mt-4 w-full" asChild>
                    <Link href="/dashboard/docente/grupos">Ver Grupos</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Registro de Notas</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Calificar actividades y registrar notas.</p>
                   <Button className="mt-4 w-full" asChild>
                    <Link href="/dashboard/docente/notas">Registrar Notas</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Control de Asistencia</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Pasar lista y registrar asistencias.</p>
                   <Button className="mt-4 w-full" asChild>
                    <Link href="/dashboard/docente/asistencia">Tomar Asistencia</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
