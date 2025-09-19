"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, SlidersHorizontal, BarChart3, ArrowRight } from "lucide-react";
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
    { title: "Gestión de Administradores", icon: ShieldCheck, href: "/dashboard/admin/users", description: "Crear, editar y supervisar cuentas de administrador." },
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
             <Card>
                <CardHeader>
                    <CardTitle className="font-poppins text-2xl font-bold text-gray-800">
                        Panel de Rectoría
                    </CardTitle>
                    <CardDescription className="font-poppins text-gray-600">
                        Supervisión y control total del sistema académico y administrativo.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isLoading ? Array.from({length:3}).map((_, i) => <Skeleton key={i} className="h-28"/>) : (
                    <>
                        <Card>
                            <CardHeader><CardTitle>Administradores</CardTitle></CardHeader>
                            <CardContent><p className="text-3xl font-bold">{stats.adminCount}</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Estudiantes Totales</CardTitle></CardHeader>
                            <CardContent><p className="text-3xl font-bold">{stats.studentCount}</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Carreras Totales</CardTitle></CardHeader>
                            <CardContent><p className="text-3xl font-bold">{stats.careerCount}</p></CardContent>
                        </Card>
                    </>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Herramientas de Rectoría</CardTitle>
                    <CardDescription>Accesos directos a las funciones de más alto nivel.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tools.map(tool => (
                        <Card key={tool.title} className="hover:shadow-md transition-shadow">
                           <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-semibold">{tool.title}</CardTitle>
                                <tool.icon className="h-6 w-6 text-primary"/>
                           </CardHeader>
                           <CardContent>
                               <p className="text-sm text-muted-foreground">{tool.description}</p>
                           </CardContent>
                           <CardFooter>
                               <Button variant="outline" asChild>
                                   <Link href={tool.href}>Acceder <ArrowRight className="ml-2 h-4 w-4"/></Link>
                               </Button>
                           </CardFooter>
                        </Card>
                    ))}
                </CardContent>
            </Card>
             <Card className="border-orange-500 bg-orange-50">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="h-6 w-6 text-orange-600"/>
                        <CardTitle className="text-orange-800">Acciones de Super-Administrador</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-orange-700 mb-4">
                        Esta acción reactivará el botón de creación de cuentas de Rector en el panel de Administrador. Úsalo solo si es estrictamente necesario.
                    </p>
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
                </CardContent>
            </Card>
        </div>
    );
}
