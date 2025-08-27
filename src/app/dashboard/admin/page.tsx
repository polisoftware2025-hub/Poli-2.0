
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, BookOpen, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSeedingCarreras, setIsSeedingCarreras] = useState(false);
  const [isSeedingGrupos, setIsSeedingGrupos] = useState(false);
  const { toast } = useToast();

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

  const handleSeed = async (type: 'carrera' | 'grupos') => {
    if (type === 'carrera') {
      setIsSeedingCarreras(true);
    } else {
      setIsSeedingGrupos(true);
    }
    
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
       if (type === 'carrera') {
        setIsSeedingCarreras(false);
      } else {
        setIsSeedingGrupos(false);
      }
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
              <div className="text-2xl font-bold">+1,234</div>
              <p className="text-xs text-muted-foreground">Gestión de todos los roles de usuario</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Carreras</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+25</div>
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
            Usa estos botones para poblar la base de datos con los datos iniciales de carreras y grupos. Esta acción solo debe realizarse una vez.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
           <Button onClick={() => handleSeed('carrera')} disabled={isSeedingCarreras}>
                {isSeedingCarreras ? 'Poblando Carreras...' : 'Poblar Carreras'}
            </Button>
            <Button onClick={() => handleSeed('grupos')} disabled={isSeedingGrupos}>
                {isSeedingGrupos ? 'Poblando Grupos...' : 'Poblar Grupos'}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
