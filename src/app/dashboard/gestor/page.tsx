
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, DollarSign, Calendar, FileText, CheckSquare, Send, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const managementTools = [
    { title: "Gestión de Horarios", description: "Asigna horarios, aulas y docentes para las clases.", icon: Calendar, href: "/dashboard/gestor/schedules", color: "text-blue-500" },
    { title: "Gestión de Solicitudes", description: "Revisa, aprueba o rechaza solicitudes de los alumnos.", icon: CheckSquare, href: "/dashboard/gestor/requests", color: "text-purple-500" },
    { title: "Generación de Reportes", description: "Crea informes académicos de rendimiento y matrículas.", icon: FileText, href: "/dashboard/gestor/reports", color: "text-green-500" },
    { title: "Gestión de Calificaciones", description: "Corrige notas y audita los cambios realizados.", icon: Edit, href: "/dashboard/gestor/grades", color: "text-orange-500" },
    { title: "Notificaciones y Anuncios", description: "Envía comunicaciones masivas a la comunidad.", icon: Send, href: "/dashboard/gestor/announcements", color: "text-red-500" },
    { title: "Revisión de Pagos", description: "Consulta y valida los pagos de los estudiantes.", icon: DollarSign, href: "/dashboard/admin/payments", color: "text-teal-500" }, // Re-using admin page for now
];

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
     <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-poppins text-2xl font-bold text-gray-800">
            Panel de Gestión Académica
          </CardTitle>
          <CardDescription className="font-poppins text-gray-600">
            Herramientas para la administración de procesos académicos y administrativos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
           {managementTools.map((tool) => (
                <Card key={tool.title} className="hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <div className={`rounded-full bg-muted p-3 ${tool.color}`}>
                                <tool.icon className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-lg font-semibold mt-1">{tool.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </CardContent>
                    <CardContent>
                         <Button className="w-full" asChild>
                            <Link href={tool.href}>Administrar</Link>
                         </Button>
                    </CardContent>
                </Card>
           ))}
        </CardContent>
      </Card>
    </div>
  );
}
