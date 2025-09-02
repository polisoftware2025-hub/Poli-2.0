
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { BookCopy, Plus, Search, MoreVertical, Edit, FileText, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
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

interface Career {
  id: string;
  slug: string;
  nombre: string;
  inversion?: number;
  estudiantes: number;
  ciclos?: any[];
  status?: string;
}

export default function CareerAdminPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCareers = async () => {
    setIsLoading(true);
    try {
      const careersCollection = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
      const careersSnapshot = await getDocs(careersCollection);
      const careersList = careersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          slug: doc.data().slug,
          ...doc.data()
        }))
        .filter(career => career.slug); // Ensure career has a slug

      const studentsCollection = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes");
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentCounts: { [key: string]: number } = {};

      studentsSnapshot.forEach(doc => {
        const student = doc.data();
        if (student.carreraId) {
          studentCounts[student.carreraId] = (studentCounts[student.carreraId] || 0) + 1;
        }
      });
      
      const careersWithStudentCounts = careersList.map(career => ({
          ...career,
          estudiantes: studentCounts[career.id] || 0,
      })) as Career[];

      setCareers(careersWithStudentCounts);

    } catch (error) {
      console.error("Error fetching careers: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las carreras.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCareers();
  }, [toast]);

  const handleDelete = async (careerId: string) => {
    try {
      await deleteDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", careerId));
      toast({
        title: "Éxito",
        description: "La carrera ha sido eliminada.",
      });
      fetchCareers(); 
    } catch (error) {
      console.error("Error deleting career: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la carrera.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de Carreras"
        description="Administra los programas académicos de la institución."
        icon={<BookCopy className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Programas Académicos</CardTitle>
          <CardDescription>
            Visualiza, crea y edita las carreras ofrecidas por la institución.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Buscar por nombre de carrera..." className="pl-9" />
            </div>
            <Button asChild>
                <Link href="/dashboard/admin/career/new-career">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Carrera
                </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-48 animate-pulse bg-muted" />)
            ) : (
                careers.map((career) => (
                    <Card key={career.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{career.nombre}</CardTitle>
                                    <CardDescription>ID: {career.id}</CardDescription>
                                </div>
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/admin/career/${career.slug}`}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Editar
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/admin/career/pensum/${career.slug}`}>
                                                <FileText className="mr-2 h-4 w-4" />
                                                Ver Pensum
                                            </Link>
                                        </DropdownMenuItem>
                                         <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Eliminar
                                            </DropdownMenuItem>
                                         </AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción no se puede deshacer. Esto eliminará permanentemente la carrera
                                                <span className="font-bold"> {career.nombre}</span> de la base de datos.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(career.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                 </AlertDialog>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Estudiantes:</span>
                                <span className="font-semibold">{career.estudiantes}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Ciclos:</span>
                                <span className="font-semibold">{career.ciclos?.length || 0}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Badge variant={
                                career.status === "Activa" ? "secondary" : 
                                career.status === "En revisión" ? "outline" : "destructive"
                            }
                            className={
                                career.status === "Activa" ? "bg-green-100 text-green-800" :
                                career.status === "En revisión" ? "bg-yellow-100 text-yellow-800" : ""
                            }>
                                {career.status || "Activa"}
                            </Badge>
                        </CardFooter>
                    </Card>
                ))
            )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

    