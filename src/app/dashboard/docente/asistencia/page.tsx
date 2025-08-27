
"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { UserCheck, History, BarChart3, Users, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GroupSelector } from "@/components/dashboard/docente/group-selector";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Student {
  id: string;
  nombre: string;
  correo: string;
}

interface Group {
    id: string;
    codigoGrupo: string;
    materia: { id: string; nombre: string };
    estudiantes: Student[];
}

const fakeStudents: Student[] = [
    { id: 'est001', nombre: 'Juan Perez', correo: 'juan.perez@pi.edu.co' },
    { id: 'est002', nombre: 'Maria Lopez', correo: 'maria.lopez@pi.edu.co' },
    { id: 'est003', nombre: 'Carlos Rodriguez', correo: 'carlos.rodriguez@pi.edu.co' },
    { id: 'est004', nombre: 'Ana Martinez', correo: 'ana.martinez@pi.edu.co' },
];

export default function TakeAttendancePage() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [attendance, setAttendance] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGroupSelect = (group: Group | null) => {
    setSelectedGroup(group);
    if (group) {
        // En una implementación real, aquí se obtendrían los estudiantes del grupo.
        // Por ahora, usamos datos falsos.
        const initialAttendance = fakeStudents.reduce((acc: any, student: Student) => {
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
    // La lógica de guardado en Firestore se implementará aquí.
    toast({
        title: "Funcionalidad no conectada",
        description: "La lógica para guardar la asistencia se conectará próximamente.",
    });
  };
  
  const attendanceSummary = useMemo(() => {
    return Object.values(attendance).reduce(
      (acc, isPresent) => {
        if (isPresent) acc.presentes++;
        else acc.ausentes++;
        return acc;
      },
      { presentes: 0, ausentes: 0 }
    );
  }, [attendance]);


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Tomar Asistencia"
        description="Selecciona un grupo y registra la asistencia de los estudiantes."
        icon={<UserCheck className="h-8 w-8 text-primary" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Registro de Asistencia</CardTitle>
                    <CardDescription>Selecciona un grupo para ver la lista de estudiantes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <GroupSelector onGroupSelect={handleGroupSelect} />
                </CardContent>
            </Card>

            {selectedGroup && (
                <Card>
                    <CardHeader>
                         <CardTitle>Lista de Estudiantes</CardTitle>
                         <CardDescription>Grupo: {selectedGroup.codigoGrupo} - {selectedGroup.materia.nombre}</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {fakeStudents.length > 0 ? (
                        <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>Nombre Completo</TableHead>
                                   <TableHead>Correo Electrónico</TableHead>
                                   <TableHead className="text-center">Asistencia</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {fakeStudents.map((student) => (
                                   <TableRow key={student.id}>
                                       <TableCell className="font-medium">{student.nombre}</TableCell>
                                       <TableCell>{student.correo}</TableCell>
                                       <TableCell className="text-center">
                                           <Checkbox
                                                id={`student-${student.id}`}
                                                checked={attendance[student.id] ?? false}
                                                onCheckedChange={(checked) => handleAttendanceChange(student.id, !!checked)}
                                                aria-label={`Marcar asistencia para ${student.nombre}`}
                                            />
                                       </TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                        </Table>
                       ) : (
                        <p className="text-sm text-muted-foreground p-4 text-center">Este grupo aún no tiene estudiantes asignados.</p>
                       )}
                    </CardContent>
                </Card>
            )}

             <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <History className="h-6 w-6 text-primary"/>
                        <CardTitle>Historial de Asistencia</CardTitle>
                    </div>
                    <CardDescription>Consulta las asistencias registradas anteriormente para este grupo.</CardDescription>
                </CardHeader>
                 <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Presentes</TableHead>
                                <TableHead>Ausentes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           <TableRow>
                               <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                                   No hay asistencias registradas.
                               </TableCell>
                           </TableRow>
                        </TableBody>
                     </Table>
                 </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 sticky top-20">
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <BarChart3 className="h-6 w-6 text-primary"/>
                        <CardTitle>Resumen y Acciones</CardTitle>
                    </div>
                     <CardDescription>Guarda el registro de asistencia de hoy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Button onClick={handleSubmit} disabled={isLoading || !selectedGroup} className="w-full">
                        {isLoading ? "Guardando..." : "Guardar Asistencia"}
                    </Button>
                    
                    <div className="space-y-2 rounded-md border p-4">
                        <p className="font-semibold text-center mb-2">Resumen de hoy:</p>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-green-600 font-medium">Presentes:</span>
                            <span className="font-bold text-lg">{attendanceSummary.presentes}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-sm text-red-600 font-medium">Ausentes:</span>
                            <span className="font-bold text-lg">{attendanceSummary.ausentes}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
