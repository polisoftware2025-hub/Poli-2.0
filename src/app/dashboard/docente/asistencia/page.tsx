
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GroupSelector } from "@/components/dashboard/docente/group-selector";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface Student {
  id: string;
  nombre: string;
}

export default function TakeAttendancePage() {
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [attendance, setAttendance] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedGroup?.estudiantes) {
      const initialAttendance = selectedGroup.estudiantes.reduce((acc: any, student: Student) => {
        acc[student.id] = true; // Default to present
        return acc;
      }, {});
      setAttendance(initialAttendance);
    } else {
      setAttendance({});
    }
  }, [selectedGroup]);

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setAttendance((prev) => ({ ...prev, [studentId]: isPresent }));
  };

  const handleSubmit = async () => {
    if (!selectedGroup) {
      toast({ variant: "destructive", title: "Error", description: "Por favor, selecciona un grupo." });
      return;
    }
    
    setIsLoading(true);
    try {
      const attendanceRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/asistencias");
      const today = new Date();

      const promises = Object.entries(attendance).map(([studentId, presente]) => {
        return addDoc(attendanceRef, {
          estudianteId: studentId,
          grupoId: selectedGroup.id,
          presente: presente,
          fecha: serverTimestamp(),
          materiaId: selectedGroup.materia.id,
        });
      });

      await Promise.all(promises);
      
      toast({
        title: "Éxito",
        description: `Asistencia para el grupo ${selectedGroup.codigoGrupo} guardada correctamente.`,
      });
      setSelectedGroup(null);
      setAttendance({});

    } catch (error) {
      console.error("Error saving attendance: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la asistencia. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Tomar Asistencia"
        description="Selecciona un grupo y registra la asistencia de los estudiantes."
        icon={<UserCheck className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardContent className="p-6 space-y-6">
          <GroupSelector onGroupSelect={setSelectedGroup} />

          {selectedGroup && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lista de Estudiantes - {selectedGroup.codigoGrupo}</h3>
              <div className="space-y-3">
                {selectedGroup.estudiantes.map((student: Student) => (
                  <div key={student.id} className="flex items-center space-x-3 p-2 rounded-md border">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={attendance[student.id] ?? false}
                      onCheckedChange={(checked) => handleAttendanceChange(student.id, !!checked)}
                    />
                    <Label htmlFor={`student-${student.id}`} className="flex-1 text-sm">
                      {student.nombre}
                    </Label>
                  </div>
                ))}
              </div>
              <Button onClick={handleSubmit} disabled={isLoading || !selectedGroup}>
                {isLoading ? "Guardando..." : "Guardar Asistencia"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
