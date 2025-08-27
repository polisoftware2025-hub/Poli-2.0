
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { UserCheck, Users, BarChart3, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Group {
    id: string;
    codigoGrupo: string;
    materia: { id: string; nombre: string };
    estudiantes: Student[];
    docente: { id: string; nombre: string; email: string; usuarioId: string };
}

export default function TakeAttendancePage() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [attendance, setAttendance] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [docenteId, setDocenteId] = useState<string | null>(null);

   useEffect(() => {
    const user = localStorage.getItem('userEmail'); // Asumiendo que el 'uid' se guarda como 'userEmail' en este caso
    if (user) {
        setDocenteId(user); // En un caso real, esto debería ser el UID del usuario de Firebase Auth
    }
  }, []);

  const handleGroupSelect = (group: Group | null) => {
    setSelectedGroup(group);
    if (group?.estudiantes) {
      const initialAttendance = group.estudiantes.reduce((acc: any, student: Student) => {
        acc[student.id] = true; // Default to present
        return acc;
      }, {});
      setAttendance(initialAttendance);
    } else {
      setAttendance({});
    }
  }

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setAttendance((prev) => ({ ...prev, [studentId]: isPresent }));
  };

  const handleSubmit = async () => {
    if (!selectedGroup) {
      toast({ variant: "destructive", title: "Error", description: "Por favor, selecciona un grupo." });
      return;
    }
    if (!docenteId) {
         toast({ variant: "destructive", title: "Error", description: "No se pudo verificar la identidad del docente." });
        return;
    }
    
    setIsLoading(true);
    try {
      const attendanceRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/asistencias");

      const promises = Object.entries(attendance).map(([studentId, presente]) => {
        return addDoc(attendanceRef, {
          estudianteId: studentId,
          grupoId: selectedGroup.id,
          estado: presente ? 'Presente' : 'Ausente',
          fecha: serverTimestamp(),
          docenteId: selectedGroup.docente.id,
        });
      });

      await Promise.all(promises);
      
      toast({
        title: "Éxito",
        description: `Asistencia para el grupo ${selectedGroup.codigoGrupo} guardada correctamente.`,
      });
      handleGroupSelect(null);

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
  
  const attendanceSummary = selectedGroup ? Object.values(attendance).reduce(
    (acc, isPresent) => {
      if (isPresent) acc.presentes++;
      else acc.ausentes++;
      return acc;
    },
    { presentes: 0, ausentes: 0 }
  ) : { presentes: 0, ausentes: 0 };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Tomar Asistencia"
        description="Selecciona un grupo y registra la asistencia de los estudiantes."
        icon={<UserCheck className="h-8 w-8 text-primary" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Registro de Asistencia</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                <GroupSelector onGroupSelect={handleGroupSelect} />

                {selectedGroup && (
                    <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Lista de Estudiantes - {selectedGroup.codigoGrupo}</h3>
                    
                    {selectedGroup.estudiantes.length > 0 ? (
                        <div className="space-y-3 rounded-md border p-4">
                            {selectedGroup.estudiantes.map((student: Student) => (
                                <div key={student.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                                <Checkbox
                                    id={`student-${student.id}`}
                                    checked={attendance[student.id] ?? false}
                                    onCheckedChange={(checked) => handleAttendanceChange(student.id, !!checked)}
                                />
                                <Label htmlFor={`student-${student.id}`} className="flex-1 text-sm font-medium">
                                    {student.nombre}
                                </Label>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground p-4 text-center">Este grupo no tiene estudiantes inscritos.</p>
                    )}
                    
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <BarChart3 className="h-6 w-6 text-primary"/>
                        <CardTitle>Resumen y Acciones</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <p className="font-semibold">Resumen de Asistencia:</p>
                        <div className="flex justify-between">
                            <span className="text-sm text-green-600 font-medium">Presentes:</span>
                            <span className="font-bold">{attendanceSummary.presentes}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-sm text-red-600 font-medium">Ausentes:</span>
                            <span className="font-bold">{attendanceSummary.ausentes}</span>
                        </div>
                    </div>

                    <Button onClick={handleSubmit} disabled={isLoading || !selectedGroup || selectedGroup.estudiantes.length === 0} className="w-full">
                        {isLoading ? "Guardando..." : "Guardar Asistencia"}
                    </Button>
                    
                    <Button variant="outline" disabled className="w-full">
                        <History className="mr-2 h-4 w-4" />
                        Ver historial de asistencia
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">El historial estará disponible próximamente.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}


    