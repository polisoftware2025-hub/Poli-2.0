
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { BookMarked, Plus, Search, Filter, MoreVertical, Edit, Trash2, BookCopy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Subject {
  id: string;
  nombre: string;
  codigo?: string;
  creditos: number;
  careerId: string;
  careerName: string;
  status: string;
  cycleNumber: number;
}

interface Career {
    id: string;
    nombre: string;
    ciclos: { numero: number, materias: any[] }[];
}

export default function SubjectsAdminPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [careerFilter, setCareerFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubjectsAndCareers = async () => {
      setIsLoading(true);
      try {
        const careersCollection = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
        const careersSnapshot = await getDocs(careersCollection);
        
        const allSubjects: Subject[] = [];
        const allCareers: Career[] = [];

        careersSnapshot.forEach(doc => {
            const careerData = doc.data();
            const careerId = doc.id;
            const careerName = careerData.nombre;
            
            allCareers.push({ id: careerId, nombre: careerName, ciclos: careerData.ciclos || [] });

            if (careerData.ciclos && Array.isArray(careerData.ciclos)) {
                careerData.ciclos.forEach((ciclo: any) => {
                    if (ciclo.materias && Array.isArray(ciclo.materias)) {
                        ciclo.materias.forEach((materia: any) => {
                            if (materia.id) { // Ensure subject has an ID
                                allSubjects.push({
                                    id: materia.id, // Use the real subject ID
                                    nombre: materia.nombre,
                                    codigo: materia.codigo,
                                    creditos: materia.creditos,
                                    careerId: careerId,
                                    careerName: careerName,
                                    status: "Activa",
                                    cycleNumber: ciclo.numero,
                                });
                            }
                        });
                    }
                });
            }
        });

        setSubjects(allSubjects);
        setCareers(allCareers);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las materias." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubjectsAndCareers();
  }, [toast]);
  
  const availableCycles = useMemo(() => {
    if (careerFilter === 'all') return [];
    const selectedCareer = careers.find(c => c.id === careerFilter);
    return selectedCareer?.ciclos?.map(c => c.numero).sort((a,b) => a - b) || [];
  }, [careers, careerFilter]);

  const handleCareerFilterChange = (value: string) => {
    setCareerFilter(value);
    setCycleFilter("all"); 
  };

  const filteredSubjects = useMemo(() => {
    return subjects
      .filter(subject => {
        if (careerFilter === 'all') return true;
        return subject.careerId === careerFilter;
      })
      .filter(subject => {
        if (cycleFilter === 'all') return true;
        return subject.cycleNumber === parseInt(cycleFilter);
      })
      .filter(subject => {
        const term = searchTerm.toLowerCase();
        return (
          subject.nombre.toLowerCase().includes(term) ||
          (subject.codigo && subject.codigo.toLowerCase().includes(term))
        );
      });
  }, [subjects, careerFilter, cycleFilter, searchTerm]);


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de Materias"
        description="Visualiza el catálogo de materias de la institución y accede a su gestión."
        icon={<BookMarked className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Materias</CardTitle>
          <CardDescription>
            Visualiza todas las materias ofrecidas. La edición se realiza desde la gestión de cada carrera.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Buscar por nombre o código..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={careerFilter} onValueChange={handleCareerFilterChange}>
              <SelectTrigger className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por carrera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Carreras</SelectItem>
                {careers.map(career => (
                    <SelectItem key={career.id} value={career.id}>{career.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
             <Select value={cycleFilter} onValueChange={setCycleFilter} disabled={careerFilter === 'all'}>
              <SelectTrigger className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por ciclo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Ciclos</SelectItem>
                {availableCycles.map(cycle => (
                    <SelectItem key={cycle} value={String(cycle)}>Ciclo {cycle}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
                Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-48" />)
            ) : (
                filteredSubjects.map((subject) => (
                    <Card key={subject.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{subject.nombre}</CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/admin/career/edit/${subject.careerId}`}>
                                                <BookCopy className="mr-2 h-4 w-4" />
                                                Gestionar Materia
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <CardDescription>{subject.careerName}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Código:</span>
                                <span className="font-mono text-xs p-1 bg-muted rounded-md">{subject.codigo || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Créditos:</span>
                                <span className="font-semibold">{subject.creditos}</span>
                            </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Ciclo:</span>
                                <span className="font-semibold">{subject.cycleNumber}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Badge variant={subject.status === "Activa" ? "secondary" : "outline"}
                             className={subject.status === "Activa" ? "bg-green-100 text-green-800" : ""}>
                                {subject.status}
                            </Badge>
                        </CardFooter>
                    </Card>
                ))
            )}
          </div>
          {filteredSubjects.length === 0 && !isLoading && (
              <p className="text-center text-muted-foreground py-10">No se encontraron materias para los filtros seleccionados.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
