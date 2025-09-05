"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, BookOpen, Database, Sparkles, School } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type SeedType = 'carrera' | 'grupos' | 'initial-data' | 'users' | 'sedes';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState<{[key in SeedType]?: boolean}>({});
  const { toast } = useToast();
  const [stats, setStats] = useState({ userCount: 0, careerCount: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);


  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    if (storedEmail && userRole === 'admin') {
      setUserEmail(storedEmail);
    } else if (storedEmail) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);
  
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
        const careersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
        
        const usersSnapshot = await getDocs(usersRef);
        const careersSnapshot = await getDocs(careersRef);

        setStats({
          userCount: usersSnapshot.size,
          careerCount: careersSnapshot.size,
        });

      } catch (error) {
        console.error("Error fetching admin stats:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las estadísticas.",
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [toast]);

  const handleSeed = async (type: SeedType) => {
    setIsSeeding(prev => ({...prev, [type]: true}));
    
    try {
      const response = await fetch(`/api/seed/${type}`, { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Éxito",
          description: data.message,
        });
      } else {
        throw new Error(data.message || 'Error al poblar la base de datos');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
       setIsSeeding(prev => ({...prev, [type]: false}));
    }
  };


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
            Panel de Administración
          </CardTitle>
          <CardDescription className="font-poppins text-gray-600">
            Gestión total del sistema académico y administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {isLoadingStats ? (
                <Skeleton className="h-8 w-1/2" />
              ) : (
                <div className="text-2xl font-bold">{stats.userCount}</div>
              )}
              <p className="text-xs text-muted-foreground">Gestión de todos los roles de usuario</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Carreras</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-1/4" />
              ) : (
                <div className="text-2xl font-bold">{stats.careerCount}</div>
              )}
              <p className="text-xs text-muted-foreground">Crear y editar programas académicos</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Permisos</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Roles y Reglas</div>
              <p className="text-xs text-muted-foreground">Administrar reglas de seguridad</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-primary" />
                <CardTitle>Gestión de Datos Iniciales</CardTitle>
            </div>
          <CardDescription>
            Usa estos botones para poblar la base de datos con los datos iniciales. Esta acción solo debe realizarse una vez.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
           <Button onClick={() => handleSeed('carrera')} disabled={isSeeding['carrera']}>
                {isSeeding['carrera'] ? 'Poblando...' : 'Poblar Carreras'}
            </Button>
            <Button onClick={() => handleSeed('grupos')} disabled={isSeeding['grupos']}>
                {isSeeding['grupos'] ? 'Poblando...' : 'Poblar Grupos'}
            </Button>
             <Button onClick={() => handleSeed('users')} disabled={isSeeding['users']}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isSeeding['users'] ? 'Poblando...' : 'Poblar Usuarios de Prueba'}
            </Button>
             <Button onClick={() => handleSeed('sedes')} disabled={isSeeding['sedes']}>
                <School className="mr-2 h-4 w-4" />
                {isSeeding['sedes'] ? 'Poblando...' : 'Poblar Sedes y Salones'}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
