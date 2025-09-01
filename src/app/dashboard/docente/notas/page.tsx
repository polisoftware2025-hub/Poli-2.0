
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
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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

export default function RegisterGradesPage() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [grade, setGrade] = useState("");
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

  const handleGroupSelect = (group: Group | null) => {
    setSelectedGroup(group);
    setSelectedStudentId(""); 
    setGrade("");
    setObservation("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !selectedStudentId || !grade) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, completa todos los campos requeridos.",
      });
      return;
    }
     if (!docenteId) {
         toast({ variant: "destructive", title: "Error", description: "No se pudo verificar la identidad del docente." });
        return;
    }

    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 5) {
      toast({
        variant: "destructive",
        title: "Nota inválida",
        description: "La nota debe ser un número entre 0.0 y 5.0.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const notesRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/notas");
      await addDoc(notesRef, {
        estudianteId: selectedStudentId,
        grupoId: selectedGroup.id,
        materiaId: selectedGroup.materia.id,
        nota: numericGrade,
        observacion: observation,
        fecha: serverTimestamp(),
        docenteId: docenteId, 
      });
      
      toast({
        title: "Éxito",
        description: "Nota registrada correctamente.",
      });

      setSelectedStudentId("");
      setGrade("");
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
                Completa los siguientes campos para registrar una nueva nota.
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="grade">Nota (0.0 - 5.0)</Label>
                        <Input
                            id="grade"
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
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
                        placeholder="Añade un comentario sobre la entrega o el desempeño del estudiante..."
                        disabled={!selectedStudentId}
                    />
                 </div>
                <Button type="submit" disabled={isLoading || !selectedStudentId || !grade}>
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
