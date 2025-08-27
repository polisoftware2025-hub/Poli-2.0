
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GroupSelector } from "@/components/dashboard/docente/group-selector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function RegisterGradesPage() {
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [grade, setGrade] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !selectedStudentId || !grade) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, completa todos los campos.",
      });
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
        fecha: serverTimestamp(),
      });
      
      toast({
        title: "Éxito",
        description: "Nota registrada correctamente.",
      });

      // Reset form
      setSelectedGroup(null);
      setSelectedStudentId("");
      setGrade("");

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

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Registrar Notas"
        description="Selecciona un grupo, un estudiante y registra su calificación."
        icon={<ClipboardCheck className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <GroupSelector onGroupSelect={setSelectedGroup} />

            {selectedGroup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="student">Seleccionar Estudiante</Label>
                  <Select onValueChange={setSelectedStudentId} value={selectedStudentId}>
                    <SelectTrigger id="student">
                      <SelectValue placeholder="Selecciona un estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedGroup.estudiantes.map((student: any) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  />
                </div>
                <Button type="submit" disabled={isLoading || !selectedGroup}>
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
