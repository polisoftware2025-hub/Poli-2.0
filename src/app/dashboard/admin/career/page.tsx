
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { BookCopy, Plus, Search, MoreVertical, Edit, FileText, Trash2, Eye, AlertTriangle, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface Career {
  id: string;
  nombre: string;
  slug?: string;
  estudiantes: number;
  ciclos?: { numero: number; materias: { creditos: number }[] }[];
  status?: string;
}

interface AuditFinding {
    cycleNumber: number;
    currentCredits: number;
    status: 'Excede' | 'Incompleto';
}

type GroupedAuditFindings = Map<string, { careerName: string; findings: AuditFinding[] }>;


export default function CareerAdminPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [groupedAuditFindings, setGroupedAuditFindings] = useState<GroupedAuditFindings>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchCareersAndAudit = async () => {
    setIsLoading(true);
    try {
      const careersCollection = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
      const careersSnapshot = await getDocs(careersCollection);
      const careersList = careersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const studentsCollection = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes");
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentCounts: { [key: string]: number } = {};

      studentsSnapshot.forEach(doc => {
        const student = doc.data();
        const careerId = student.carreraId;
        if (careerId) {
          studentCounts[careerId] = (studentCounts[careerId] || 0) + 1;
        }
      });
      
      const careersWithStudentCounts = careersList.map(career => ({
          ...career,
          estudiantes: studentCounts[career.id] || 0,
      })).filter(c => c.nombre) as Career[];

      setCareers(careersWithStudentCounts);

      // --- Audit Logic ---
      const findingsMap: GroupedAuditFindings = new Map();
      careersWithStudentCounts.forEach(career => {
        if (career.ciclos && Array.isArray(career.ciclos)) {
            career.ciclos.forEach(ciclo => {
                const totalCredits = ciclo.materias.reduce((sum, materia) => sum + materia.creditos, 0);
                if (totalCredits !== 10) {
                    if (!findingsMap.has(career.id)) {
                        findingsMap.set(career.id, { careerName: career.nombre, findings: [] });
                    }
                    findingsMap.get(career.id)!.findings.push({
                        cycleNumber: ciclo.numero,
                        currentCredits: totalCredits,
                        status: totalCredits > 10 ? 'Excede' : 'Incompleto'
                    });
                }
            });
        }
      });
      setGroupedAuditFindings(findingsMap);

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
    fetchCareersAndAudit();
  }, []);

  const handleDelete = async (careerId: string) => {
    try {
      await deleteDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", careerId));
      toast({
        title: "Éxito",
        description: "La carrera ha sido eliminada.",
      });
      fetchCareersAndAudit(); 
    } catch (error) {
      console.error("Error deleting career: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la carrera.",
      });
    }
  };

  const filteredCareers = useMemo(() => {
    return careers.filter(career =>
      career.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [careers, searchTerm]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de Carreras"
        description="Administra los programas académicos de la institución."
        icon={<BookCopy className="h-8 w-8 text-primary" />}
      />

       {groupedAuditFindings.size > 0 && (
            <Card className="border-yellow-400 bg-yellow-50">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        <CardTitle className="text-yellow-800">Auditoría de Créditos por Ciclo</CardTitle>
                    </div>
                    <CardDescription className="text-yellow-700">
                        Se encontraron carreras con ciclos que no cumplen con la regla de 10 créditos exactos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                       {Array.from(groupedAuditFindings.entries()).map(([careerId, { careerName, findings }]) => (
                           <AccordionItem key={careerId} value={`career-${careerId}`}>
                             <AccordionTrigger className="hover:no-underline">
                                 <div className="flex items-center gap-4">
                                     <span className="font-semibold text-base">{careerName}</span>
                                     <Badge variant="destructive">{findings.length} ciclos con errores</Badge>
                                 </div>
                             </AccordionTrigger>
                             <AccordionContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ciclo</TableHead>
                                            <TableHead>Créditos Actuales</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {findings.map(finding => (
                                            <TableRow key={finding.cycleNumber}>
                                                <TableCell className="font-medium">Ciclo {finding.cycleNumber}</TableCell>
                                                <TableCell>{finding.currentCredits}/10</TableCell>
                                                <TableCell>
                                                    <Badge variant={finding.status === 'Excede' ? 'destructive' : 'outline'} className={finding.status === 'Incompleto' ? 'border-yellow-600 text-yellow-800' : ''}>
                                                        {finding.status === 'Excede' ? <X className="mr-1 h-3 w-3"/> : <AlertTriangle className="mr-1 h-3 w-3" />}
                                                        {finding.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/dashboard/admin/career/edit/${careerId}`}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Corregir
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </AccordionContent>
                           </AccordionItem>
                       ))}
                    </Accordion>
                </CardContent>
            </Card>
        )}

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
                <Input 
                    placeholder="Buscar por nombre de carrera..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="h-56">
                        <CardHeader>
                            <Skeleton className="h-5 w-3/4"/>
                            <Skeleton className="h-4 w-1/2"/>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full"/>
                            <Skeleton className="h-4 w-full"/>
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-6 w-20"/>
                        </CardFooter>
                    </Card>
                ))
            ) : (
                filteredCareers.map((career) => (
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
                                            <Link href={`/dashboard/admin/career/details/${career.id}`}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Ver Detalles
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/admin/career/edit/${career.id}`}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Editar
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
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
           {filteredCareers.length === 0 && !isLoading && (
              <p className="text-center text-muted-foreground py-10">No se encontraron carreras para los filtros seleccionados.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
