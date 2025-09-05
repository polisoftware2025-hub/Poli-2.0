
"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { UserCheck, History, BarChart3, Users, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GroupSelector } from "@/components/dashboard/docente/group-selector";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

interface Student {
  id: string;
  nombre: string;
}

interface Group {
    id: string;
    codigoGrupo: string;
    materia: { id: string; nombre: string };
    estudiantes: Student[];
}

type AttendanceStatus = "Presente" | "Ausente" | "Tarde";

export default function TakeAttendancePage() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [attendance, setAttendance] = useState<{ [key: string]: AttendanceStatus }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [docenteId, setDocenteId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setDocenteId(storedUserId);
  }, []);

  const handleGroupSelect = async (group: Group | null) => {
    setSelectedGroup(group);
    if (group) {
        if (group.estudiantes?.length > 0) {
            const studentIds = group.estudiantes.map(s => s.id);
            const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
            const q = query(usersRef, where("__name__", "in", studentIds));
            const userDocs = await getDocs(q);
            const studentMap = new Map(userDocs.docs.map(d => [d.id, d.data().nombreCompleto]));
            group.estudiantes = group.estudiantes.map(s => ({...s, nombre: studentMap.get(s.id) || s.nombre}));
        }

        const initialAttendance = (group.estudiantes || []).reduce((acc: any, student: Student) => {
            acc[student.id] = "Presente";
            return acc;
        }, {});
        setAttendance(initialAttendance);
    } else {
        setAttendance({});
    }
  }

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedGroup || !docenteId) {
        toast({ variant: "destructive", title: "Error", description: "Selecciona un grupo primero." });
        return;
    }
    
    setIsLoading(true);
    try {
        const batchData = Object.entries(attendance).map(([estudianteId, estado]) => ({
            estudianteId,
            grupoId: selectedGroup.id,
            materiaId: selectedGroup.materia.id,
            docenteId,
            fecha: serverTimestamp(),
            estado,
        }));
        
        const asistenciasRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/asistencias");
        await Promise.all(batchData.map(data => addDoc(asistenciasRef, data)));

        toast({
            title: "Asistencia Guardada",
            description: `Se ha registrado la asistencia para el grupo ${selectedGroup.codigoGrupo}.`,
        });

    } catch(e) {
        console.error("Error saving attendance:", e);
        toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la asistencia." });
    } finally {
        setIsLoading(false);
    }
  };
  
  const attendanceSummary = useMemo(() => {
    return Object.values(attendance).reduce(
      (acc, status) => {
        if (status === 'Presente') acc.presentes++;
        else if (status === 'Ausente') acc.ausentes++;
        else if (status === 'Tarde') acc.tardes++;
        return acc;
      },
      { presentes: 0, ausentes: 0, tardes: 0 }
    );
  }, [attendance]);

  const exportAttendancePDF = () => {
    if (!selectedGroup) return;
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const date = new Date().toLocaleDateString('es-ES');
    
    doc.text(`Reporte de Asistencia - ${date}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Grupo: ${selectedGroup.codigoGrupo} - ${selectedGroup.materia.nombre}`, 14, 30);

    const tableColumn = ["#", "Nombre Completo", "Estado"];
    const tableRows: (string | number)[][] = [];

    (selectedGroup.estudiantes || []).forEach((student, index) => {
        tableRows.push([index + 1, student.nombre, attendance[student.id] || "N/A"]);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 35 });
    doc.save(`asistencia_${selectedGroup.codigoGrupo}_${date}.pdf`);
  };

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
                       {(selectedGroup.estudiantes || []).length > 0 ? (
                        <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>Nombre Completo</TableHead>
                                   <TableHead className="text-center">Asistencia</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {(selectedGroup.estudiantes || []).map((student) => (
                                   <TableRow key={student.id}>
                                       <TableCell className="font-medium">{student.nombre}</TableCell>
                                       <TableCell className="text-center">
                                           <RadioGroup 
                                            defaultValue={attendance[student.id]} 
                                            onValueChange={(value) => handleAttendanceChange(student.id, value as AttendanceStatus)}
                                            className="flex justify-center gap-4"
                                           >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Presente" id={`presente-${student.id}`} />
                                                    <Label htmlFor={`presente-${student.id}`}>Presente</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Ausente" id={`ausente-${student.id}`} />
                                                    <Label htmlFor={`ausente-${student.id}`}>Ausente</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Tarde" id={`tarde-${student.id}`} />
                                                    <Label htmlFor={`tarde-${student.id}`}>Tarde</Label>
                                                </div>
                                           </RadioGroup>
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
        </div>

        <div className="lg:col-span-1 sticky top-20">
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <BarChart3 className="h-6 w-6 text-primary"/>
                        <CardTitle>Resumen y Acciones</CardTitle>
                    </div>
                     <CardDescription>Guarda el registro de hoy y exporta reportes.</CardDescription>
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
                            <span className="text-sm text-yellow-600 font-medium">Tardes:</span>
                            <span className="font-bold text-lg">{attendanceSummary.tardes}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-sm text-red-600 font-medium">Ausentes:</span>
                            <span className="font-bold text-lg">{attendanceSummary.ausentes}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold">Exportar Reportes</h4>
                        <Button variant="outline" className="w-full" onClick={exportAttendancePDF} disabled={!selectedGroup}>
                            <FileDown className="mr-2 h-4 w-4"/>
                            Reporte del Día (PDF)
                        </Button>
                         <Button variant="outline" className="w-full" disabled>
                            <FileDown className="mr-2 h-4 w-4"/>
                            Historial del Grupo (Próximamente)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
