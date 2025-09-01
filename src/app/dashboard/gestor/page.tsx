
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Users, BookOpen, UserCheck, Calendar, FileText, CheckSquare, Send, Edit, Search, Bell, TrendingUp, BarChart2, PieChart, Clock, ArrowRight, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  LineChart,
} from "recharts";

const quickAccessTools = [
    { title: "Revisar Pagos Pendientes", icon: CheckSquare, href: "/dashboard/gestor/payments", color: "text-orange-500", bgColor: "bg-orange-50" },
    { title: "Aprobar Pre-Inscripciones", icon: ClipboardList, href: "/dashboard/gestor/pre-register", color: "text-purple-500", bgColor: "bg-purple-50" },
    { title: "Generar Reporte Académico", icon: FileText, href: "/dashboard/gestor/reports", color: "text-green-500", bgColor: "bg-green-50" },
    { title: "Enviar Anuncio", icon: Send, href: "/dashboard/gestor/announcements", color: "text-red-500", bgColor: "bg-red-50" },
];

const enrollmentData = [
  { name: '2023-1', value: 1200 },
  { name: '2023-2', value: 1350 },
  { name: '2024-1', value: 1400 },
  { name: '2024-2', value: 1482 },
];

const topCareersData = [
  { name: 'Admin.', students: 420 },
  { name: 'Sistemas', students: 350 },
  { name: 'Contaduría', students: 310 },
  { name: 'Mercadeo', students: 280 },
  { name: 'Psicología', students: 220 },
];

const recentActivity = [
    { action: "Pago validado", user: "Laura Gómez", time: "hace 5 min" },
    { action: "Solicitud aprobada", user: "David Martínez", time: "hace 1 hora" },
    { action: "Reporte generado", user: "Reporte de Deserción", time: "hace 3 horas" },
]

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    if (storedEmail && userRole === 'gestor') {
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
    );
  }

  return (
     <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
             <h1 className="font-poppins text-3xl font-bold text-gray-800">
                Panel de Gestión Académica
            </h1>
            <p className="font-poppins text-gray-600">
                Bienvenido de nuevo, aquí tienes un resumen del estado de la institución.
            </p>
        </div>

        <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Búsqueda rápida de estudiantes, carreras o grupos..." className="pl-9" />
        </div>

        {/* Quick Access */}
         <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
           {quickAccessTools.map((tool) => (
                <Card key={tool.title} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                         <div className={`rounded-lg p-3 ${tool.bgColor} ${tool.color}`}>
                            <tool.icon className="h-6 w-6" />
                        </div>
                        <div>
                             <h3 className="text-base font-semibold">{tool.title}</h3>
                        </div>
                    </CardContent>
                     <CardFooter className="p-2 pt-0">
                         <Button variant="ghost" asChild className="w-full justify-end text-primary">
                            <Link href={tool.href}>Ir <ArrowRight className="ml-2 h-4 w-4"/></Link>
                         </Button>
                    </CardFooter>
                </Card>
           ))}
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
            {/* General Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Estudiantes Activos</CardDescription>
                         <CardTitle className="text-3xl">1,482</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Docentes</CardDescription>
                         <CardTitle className="text-3xl">96</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Carreras Activas</CardDescription>
                         <CardTitle className="text-3xl">12</CardTitle>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Grupos (2024-2)</CardDescription>
                         <CardTitle className="text-3xl">45</CardTitle>
                    </CardHeader>
                </Card>
            </div>
            
            {/* Trend Graphs */}
            <Card>
                <CardHeader>
                    <CardTitle>Tendencias de Matrícula</CardTitle>
                </CardHeader>
                 <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={enrollmentData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                            <YAxis stroke="#888888" fontSize={12}/>
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                            <Legend />
                            <Line type="monotone" dataKey="value" name="Estudiantes" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                 </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Inscripciones por Carrera</CardTitle>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={topCareersData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12}/>
                            <YAxis stroke="#888888" fontSize={12}/>
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                             <Bar dataKey="students" name="Estudiantes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Alerts */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Bell className="h-5 w-5 text-primary"/> Alertas
                       </div>
                       <Button variant="link" size="sm" asChild>
                           <Link href="/dashboard/gestor/notifications">Ver todas</Link>
                       </Button>
                    </CardTitle>
                </CardHeader>
                 <CardContent>
                    <ul className="space-y-4">
                        <li className="flex gap-3">
                           <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0"/>
                           <p className="text-sm">23 matrículas vencen en los próximos 7 días.</p>
                        </li>
                        <li className="flex gap-3">
                            <div className="h-2 w-2 rounded-full bg-yellow-500 mt-1.5 shrink-0"/>
                           <p className="text-sm">15 pagos pendientes de validación.</p>
                        </li>
                         <li className="flex gap-3">
                           <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0"/>
                           <p className="text-sm">8 nuevas solicitudes de estudiantes.</p>
                        </li>
                    </ul>
                 </CardContent>
            </Card>
            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary"/> Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableBody>
                        {recentActivity.map((activity, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <div className="font-medium">{activity.action}</div>
                                    <div className="text-xs text-muted-foreground">{activity.user}</div>
                                </TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">{activity.time}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
