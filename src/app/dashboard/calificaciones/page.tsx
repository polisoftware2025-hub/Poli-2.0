
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
import { collection, query, where, getDocs, doc, getDoc, DocumentData } from "firebase/firestore";

interface Grade {
  id: string;
  materia: string;
  codigoGrupo: string;
  notaFinal: number;
  creditos: number;
  desglose: { actividad: string; nota: number; porcentaje: number }[];
}

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchGrades = async () => {
      setIsLoading(true);
      try {
        const notesRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/notas");
        const q = query(notesRef, where("estudianteId", "==", userId));
        const querySnapshot = await getDocs(q);

        const fetchedGrades: Grade[] = [];

        for (const noteDoc of querySnapshot.docs) {
          const noteData = noteDoc.data();
          
          if (noteData.grupoId) {
            const groupRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", noteData.grupoId);
            const groupSnap = await getDoc(groupRef);

            if (groupSnap.exists()) {
              const groupData = groupSnap.data();
              const materiaId = groupData.materia.id;
              
              // Asumiendo que podemos obtener los créditos de alguna parte.
              // Por ahora, usaremos un valor por defecto o buscaremos en carreras.
              let creditos = 3; // Valor por defecto

              fetchedGrades.push({
                id: noteDoc.id,
                materia: groupData.materia.nombre,
                codigoGrupo: groupData.codigoGrupo,
                notaFinal: noteData.nota,
                creditos: creditos,
                // El desglose sigue siendo un placeholder
                desglose: [
                  { actividad: "Nota registrada por docente", nota: noteData.nota, porcentaje: 100 }
                ],
              });
            }
          }
        }
        
        setGrades(fetchedGrades);
      } catch (error) {
          console.error("Error fetching grades: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, [userId]);
  
  const totalCredits = grades
    .filter(g => g.notaFinal >= 3.0)
    .reduce((acc, grade) => acc + grade.creditos, 0);
  
  const weightedSum = grades.reduce((acc, grade) => acc + (grade.notaFinal * grade.creditos), 0);
  const totalPossibleCredits = grades.reduce((acc, grade) => acc + grade.creditos, 0);
  const averageGrade = totalPossibleCredits > 0 ? (weightedSum / totalPossibleCredits).toFixed(2) : "0.00";


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

    