
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GroupSelector } from "@/components/dashboard/docente/group-selector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";

interface Student {
  id: string;
  nombre: string;
}

interface Group {
  id: string;
  materia: { id: string; nombre: string };
  estudiantes: Student[];
  docente: { id: string; nombre: string; email: string; usuarioId: string };
}

interface PartialGrade {
    type: 'Quiz' | 'Taller' | 'Parcial' | 'Trabajo';
    grade: number;
}

export default function RegisterGradesPage() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [finalGrade, setFinalGrade] = useState("");
  const [partialGrades, setPartialGrades] = useState<PartialGrade[]>([]);
  const [observation, setObservation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [docenteId, setDocenteId] = useState<string | null>(null);

   useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
     if (storedUserId) {
        setDocenteId(storedUserId);
    }
  }, []);

  const handleGroupSelect = async (group: Group | null) => {
    setSelectedGroup(group);
    setSelectedStudentId(""); 
    setFinalGrade("");
    setPartialGrades([]);
    setObservation("");

    if (group) {
        // Fetch full student details
        const studentIds = group.estudiantes.map(s => s.id);
        if (studentIds.length === 0) {
            group.estudiantes = [];
            return;
        };

        const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
        const q = query(usersRef, where("__name__", "in", studentIds));
        const userDocs = await getDocs(q);
        const studentMap = new Map(userDocs.docs.map(d => [d.id, d.data().nombreCompleto]));
        group.estudiantes = group.estudiantes.map(s => ({...s, nombre: studentMap.get(s.id) || s.nombre}));
    }
  };

  const handleAddPartialGrade = () => {
    setPartialGrades([...partialGrades, { type: 'Quiz', grade: 0 }]);
  };

  const handlePartialGradeChange = (index: number, field: keyof PartialGrade, value: any) => {
    const newGrades = [...partialGrades];
    if (field === 'grade') {
        newGrades[index][field] = parseFloat(value) || 0;
    } else {
        newGrades[index][field] = value;
    }
    setPartialGrades(newGrades);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !selectedStudentId || !finalGrade) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, completa grupo, estudiante y nota final.",
      });
      return;
    }
     if (!docenteId) {
         toast({ variant: "destructive", title: "Error", description: "No se pudo verificar la identidad del docente." });
        return;
    }

    const numericGrade = parseFloat(finalGrade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 5) {
      toast({ variant: "destructive", title: "Nota final inválida", description: "La nota debe ser un número entre 0.0 y 5.0." });
      return;
    }

    setIsLoading(true);
    try {
      const notesRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/notas");
      
      const gradeHistory = partialGrades.map(pg => ({ type: pg.type, grade: pg.grade }));
      
      await addDoc(notesRef, {
        estudianteId: selectedStudentId,
        grupoId: selectedGroup.id,
        materiaId: selectedGroup.materia.id,
        nota: numericGrade,
        historial: gradeHistory,
        observacion: observation,
        fecha: serverTimestamp(),
        docenteId: docenteId, 
      });
      
      toast({
        title: "Éxito",
        description: "Nota registrada correctamente.",
      });

      setSelectedStudentId("");
      setFinalGrade("");
      setPartialGrades([]);
      setObservation("");

    } catch (error) {
      console.error("Error saving grade: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar la nota. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const studentsInGroup = selectedGroup?.estudiantes || [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Registrar Notas"
        description="Selecciona un grupo, un estudiante y registra su calificación."
        icon={<ClipboardCheck className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
            <CardTitle>Formulario de Calificación</CardTitle>
            <CardDescription>
                Completa los siguientes campos para registrar una nueva nota. Puedes añadir notas parciales para mantener un historial.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <GroupSelector onGroupSelect={handleGroupSelect} />

            {selectedGroup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="student">Seleccionar Estudiante</Label>
                  <Select onValueChange={setSelectedStudentId} value={selectedStudentId} disabled={!studentsInGroup || studentsInGroup.length === 0}>
                    <SelectTrigger id="student">
                      <SelectValue placeholder={studentsInGroup.length > 0 ? "Selecciona un estudiante" : "No hay estudiantes en este grupo"} />
                    </SelectTrigger>
                    <SelectContent>
                      {studentsInGroup.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 rounded-md border p-4">
                    <h3 className="font-semibold">Notas Parciales (Historial)</h3>
                    {partialGrades.map((pg, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4 items-end">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor={`partial-type-${index}`}>Tipo de Nota</Label>
                                 <Select value={pg.type} onValueChange={(value) => handlePartialGradeChange(index, 'type', value)}>
                                    <SelectTrigger id={`partial-type-${index}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Quiz">Quiz</SelectItem>
                                        <SelectItem value="Taller">Taller</SelectItem>
                                        <SelectItem value="Parcial">Parcial</SelectItem>
                                        <SelectItem value="Trabajo">Trabajo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor={`partial-grade-${index}`}>Nota</Label>
                                <Input id={`partial-grade-${index}`} type="number" step="0.1" min="0" max="5" value={pg.grade} onChange={(e) => handlePartialGradeChange(index, 'grade', e.target.value)} />
                            </div>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddPartialGrade} disabled={!selectedStudentId}>Añadir Nota Parcial</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="grade" className="font-bold">Nota Final</Label>
                        <Input
                            id="grade"
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={finalGrade}
                            onChange={(e) => setFinalGrade(e.target.value)}
                            placeholder="Ej: 4.5"
                            disabled={!selectedStudentId}
                        />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="observation">Observación (Opcional)</Label>
                    <Textarea
                        id="observation"
                        value={observation}
                        onChange={(e) => setObservation(e.target.value)}
                        placeholder="Ej: Nota final basada en el promedio de los talleres y el examen parcial."
                        disabled={!selectedStudentId}
                    />
                 </div>
                <Button type="submit" disabled={isLoading || !selectedStudentId || !finalGrade}>
                  {isLoading ? "Guardando..." : "Guardar Nota"}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
