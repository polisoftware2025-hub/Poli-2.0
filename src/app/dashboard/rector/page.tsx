
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, SlidersHorizontal, BarChart3, ArrowRight, Users, BookCopy, School } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface Stats {
    adminCount: number;
    studentCount: number;
    careerCount: number;
}

const tools = [
    { title: "Gestión de Admins y Usuarios", icon: ShieldCheck, href: "/dashboard/admin/users", description: "Crear, editar y supervisar todas las cuentas de usuario." },
    { title: "Auditoría de Cambios", icon: ShieldAlert, href: "/dashboard/rector/audit", description: "Rastrear acciones importantes realizadas en el sistema." },
    { title: "Configuración Global", icon: SlidersHorizontal, href: "/dashboard/rector/settings", description: "Modificar parámetros que afectan a toda la institución." },
    { title: "Analíticas Globales", icon: BarChart3, href: "/dashboard/admin/analytics", description: "Ver estadísticas y reportes consolidados." },
];

export default function RectorDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats>({ adminCount: 0, studentCount: 0, careerCount: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedEmail = localStorage.getItem('userEmail');
        const userRole = localStorage.getItem('userRole');
        if (storedEmail && userRole === 'rector') {
            setUserEmail(storedEmail);
        } else if (storedEmail) {
            router.push('/dashboard');
        } else {
            router.push('/login');
        }
    }, [router]);
    
     useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
                const careersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");

                const adminQuery = query(usersRef, where("rol.id", "in", ["admin", "rector"]));
                const studentQuery = query(usersRef, where("rol.id", "==", "estudiante"));

                const [adminSnap, studentSnap, careersSnap] = await Promise.all([
                    getDocs(adminQuery),
                    getDocs(studentQuery),
                    getDocs(careersRef),
                ]);

                setStats({
                    adminCount: adminSnap.size,
                    studentCount: studentSnap.size,
                    careerCount: careersSnap.size,
                });

            } catch (error) {
                console.error("Error fetching rector stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);
    
    const handleReactivateSeeding = () => {
        try {
            localStorage.removeItem('rector_seeded');
            toast({
                title: "Acción completada",
                description: "Se ha reactivado la opción para crear cuentas de Rector en el panel de Administrador.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo reactivar la función. Revisa los permisos de almacenamiento del navegador.",
            });
        }
    };


    if (!userEmail) {
        return <div className="flex min-h-screen items-center justify-center"><p>Cargando...</p></div>;
    }

    return (
        <div className="flex flex-col gap-8">
             <div className="flex flex-col gap-2">
                <h1 className="font-poppins text-3xl font-bold">
                    Panel de Rectoría
                </h1>
                <p className="font-poppins text-muted-foreground">
                    Supervisión y control total del sistema académico y administrativo.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isLoading ? Array.from({length:3}).map((_, i) => <Skeleton key={i} className="h-28"/>) : (
                    <>
                        <Card className="flex items-center p-6 gap-6 hover:shadow-lg transition-shadow">
                           <div className="p-4 bg-blue-100 rounded-lg"><Users className="h-8 w-8 text-blue-600"/></div>
                           <div>
                                <CardTitle className="text-3xl font-bold">{stats.adminCount}</CardTitle>
                                <CardDescription>Admins y Rectores</CardDescription>
                           </div>
                        </Card>
                         <Card className="flex items-center p-6 gap-6 hover:shadow-lg transition-shadow">
                           <div className="p-4 bg-green-100 rounded-lg"><School className="h-8 w-8 text-green-600"/></div>
                           <div>
                                <CardTitle className="text-3xl font-bold">{stats.studentCount}</CardTitle>
                                <CardDescription>Estudiantes Totales</CardDescription>
                           </div>
                        </Card>
                         <Card className="flex items-center p-6 gap-6 hover:shadow-lg transition-shadow">
                           <div className="p-4 bg-purple-100 rounded-lg"><BookCopy className="h-8 w-8 text-purple-600"/></div>
                           <div>
                                <CardTitle className="text-3xl font-bold">{stats.careerCount}</CardTitle>
                                <CardDescription>Carreras Totales</CardDescription>
                           </div>
                        </Card>
                    </>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Herramientas de Rectoría</CardTitle>
                    <CardDescription>Accesos directos a las funciones de más alto nivel.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {tools.map(tool => (
                        <div key={tool.title} className="p-4 rounded-lg border flex items-center justify-between hover:bg-muted/50 transition-colors">
                           <div className="flex items-center gap-4">
                                <tool.icon className="h-6 w-6 text-primary"/>
                               <div>
                                   <h4 className="font-semibold">{tool.title}</h4>
                                   <p className="text-sm text-muted-foreground">{tool.description}</p>
                               </div>
                           </div>
                           <Button variant="ghost" asChild size="icon">
                               <Link href={tool.href}><ArrowRight className="h-5 w-5"/></Link>
                           </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

             <Card className="border-orange-500 bg-orange-50">
                <CardHeader className="flex flex-row items-center gap-4">
                    <ShieldAlert className="h-8 w-8 text-orange-600 shrink-0"/>
                    <div>
                        <CardTitle className="text-orange-800">Acciones de Super-Administrador</CardTitle>
                        <CardDescription className="text-orange-700 mt-1">
                            Esta acción reactivará el botón de creación de cuentas de Rector en el panel de Administrador. Úsalo solo si es estrictamente necesario.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardFooter>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100 hover:text-orange-900">
                                Reactivar Creación de Rectores
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar Reactivación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Estás a punto de permitir que se puedan volver a crear las cuentas de Rector desde el panel de Administrador. Esta acción debe ser usada con precaución.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleReactivateSeeding} className="bg-orange-600 hover:bg-orange-700">Sí, Reactivar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </div>
    );
}
