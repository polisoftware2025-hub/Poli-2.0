
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { GraduationCap, TrendingUp, BookOpen, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";

interface Grade {
  id: string;
  materia: string;
  codigoGrupo: string;
  notaFinal: number;
  creditos: number;
  desglose: { actividad: string; nota: number; porcentaje: number }[];
}

const placeholderGrades: Grade[] = [
    { id: '1', materia: 'Cálculo Diferencial', codigoGrupo: 'CD-001', notaFinal: 4.5, creditos: 3, desglose: [{ actividad: 'Parcial 1', nota: 4.0, porcentaje: 30 }, { actividad: 'Parcial 2', nota: 5.0, porcentaje: 30 }, { actividad: 'Trabajo Final', nota: 4.5, porcentaje: 40 }] },
    { id: '2', materia: 'Inteligencia Artificial', codigoGrupo: 'IA-002', notaFinal: 4.8, creditos: 4, desglose: [{ actividad: 'Proyecto 1', nota: 4.7, porcentaje: 50 }, { actividad: 'Proyecto 2', nota: 4.9, porcentaje: 50 }] },
    { id: '3', materia: 'Base de Datos', codigoGrupo: 'BD-001', notaFinal: 3.2, creditos: 3, desglose: [{ actividad: 'Taller 1', nota: 3.0, porcentaje: 25 }, { actividad: 'Taller 2', nota: 3.5, porcentaje: 25 }, { actividad: 'Examen Final', nota: 3.1, porcentaje: 50 }] },
    { id: '4', materia: 'Pruebas y Mantenimiento', codigoGrupo: 'PM-003', notaFinal: 2.8, creditos: 2, desglose: [{ actividad: 'Exposición', nota: 2.5, porcentaje: 40 }, { actividad: 'Trabajo Escrito', nota: 3.0, porcentaje: 60 }] },
];


export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);

    // Simular carga de datos
    setTimeout(() => {
        setGrades(placeholderGrades); // Usamos datos de ejemplo por ahora
        setIsLoading(false);
    }, 1500);

  }, []);

  const averageGrade = (grades.reduce((acc, grade) => acc + grade.notaFinal, 0) / grades.length).toFixed(2);
  const totalCredits = grades.reduce((acc, grade) => acc + grade.creditos, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis Calificaciones"
        description="Consulta tus notas y el progreso en tus materias."
        icon={<GraduationCap className="h-8 w-8 text-primary" />}
      />

       {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32"/>
            <Skeleton className="h-32"/>
            <Skeleton className="h-32"/>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{grades.length > 0 ? averageGrade : "N/A"}</div>
                    <p className="text-xs text-muted-foreground">Promedio ponderado acumulado</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Créditos Aprobados</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{grades.length > 0 ? totalCredits : "0"}</div>
                    <p className="text-xs text-muted-foreground">Total de créditos académicos</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Materias Cursadas</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{grades.length}</div>
                    <p className="text-xs text-muted-foreground">Total de materias con calificación</p>
                </CardContent>
            </Card>
        </div>
      )}


      <Card>
        <CardHeader>
          <CardTitle>Calificaciones por Materia</CardTitle>
          <CardDescription>
            Aquí puedes ver el detalle de tus calificaciones para cada materia inscrita.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          ) : grades.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Materia</TableHead>
                    <TableHead>Código del Grupo</TableHead>
                    <TableHead className="text-center">Nota Definitiva</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {grades.map((grade) => (
                    <Collapsible asChild key={grade.id}>
                        <>
                        <TableRow>
                            <TableCell className="font-medium">{grade.materia}</TableCell>
                            <TableCell>{grade.codigoGrupo}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={grade.notaFinal >= 3 ? "secondary" : "destructive"}
                                    className={grade.notaFinal >= 3 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                    {grade.notaFinal.toFixed(1)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    Ver Desglose
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                            </CollapsibleTrigger>
                            </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                            <tr className="bg-muted/50">
                                <TableCell colSpan={4} className="p-0">
                                    <div className="p-4">
                                        <h4 className="font-semibold mb-2">Desglose de Notas:</h4>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Actividad</TableHead>
                                                    <TableHead>Porcentaje</TableHead>
                                                    <TableHead className="text-right">Nota</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {grade.desglose.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.actividad}</TableCell>
                                                    <TableCell>{item.porcentaje}%</TableCell>
                                                    <TableCell className="text-right">{item.nota.toFixed(1)}</TableCell>
                                                </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TableCell>
                            </tr>
                        </CollapsibleContent>
                        </>
                    </Collapsible>
                    ))}
                </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <p>Aún no tienes calificaciones registradas en ninguna materia.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
