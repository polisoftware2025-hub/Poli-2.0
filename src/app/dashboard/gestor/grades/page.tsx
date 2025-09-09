
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Edit, ClipboardList, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  nombreCompleto: string;
}

interface Subject {
  id: string;
  nombre: string;
}

interface Grade {
    id: string;
    nota: number;
    materiaId: string;
}

interface AuditLog {
    id: string;
    studentName: string;
    subjectName: string;
    oldGrade: number;
    newGrade: number;
    user: string;
    date: Timestamp;
    reason: string;
}

export default function GradeManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [studentSubjects, setStudentSubjects] = useState<Subject[]>([]);
  const [studentGrades, setStudentGrades] = useState<Grade[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [newGrade, setNewGrade] = useState("");
  const [reason, setReason] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState({ search: true, subjects: false, submit: false, logs: true });
  const { toast } = useToast();
  const [gestorEmail, setGestorEmail] = useState("gestor@example.com");

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) setGestorEmail(email);

    const fetchInitialData = async () => {
        setIsLoading(prev => ({...prev, search: true, logs: true}));
        try {
            // Fetch all students once
            const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
            const q = query(usersRef, where("rol.id", "==", "estudiante"));
            const studentsSnapshot = await getDocs(q);
            setAllStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, nombreCompleto: doc.data().nombreCompleto })));

            // Fetch audit logs
            const logsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/auditoria_notas");
            const logsSnapshot = await getDocs(query(logsRef, where("date", "!=", null)));
            const fetchedLogs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
            fetchedLogs.sort((a, b) => b.date.toMillis() - a.date.toMillis());
            setAuditLogs(fetchedLogs);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos iniciales." });
        } finally {
            setIsLoading(prev => ({...prev, search: false, logs: false}));
        }
    };
    
    fetchInitialData();
  }, [toast]);


  useEffect(() => {
    if (searchTerm.length > 0) {
      setFilteredStudents(
        allStudents.filter(student =>
          student.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredStudents([]);
    }
  }, [searchTerm, allStudents]);

  const handleSelectStudent = async (student: User) => {
    setSelectedStudent(student);
    setSearchTerm(student.nombreCompleto);
    setFilteredStudents([]);
    setIsLoading(prev => ({...prev, subjects: true}));

    try {
        const studentRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", student.id);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
            setStudentSubjects(studentSnap.data().materiasInscritas || []);
        }

        const gradesRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/notas");
        const gradesQuery = query(gradesRef, where("estudianteId", "==", student.id));
        const gradesSnapshot = await getDocs(gradesQuery);
        setStudentGrades(gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade)));

    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos del estudiante." });
    } finally {
        setIsLoading(prev => ({...prev, subjects: false}));
    }
  };
  
  const currentGrade = useMemo(() => {
      if (!selectedSubjectId) return null;
      return studentGrades.find(g => g.materiaId === selectedSubjectId)?.nota;
  }, [selectedSubjectId, studentGrades]);
  
  const handleSubmit = async () => {
    if (!selectedStudent || !selectedSubjectId || !newGrade || !reason) {
        toast({ variant: "destructive", title: "Campos requeridos", description: "Completa todos los campos antes de guardar." });
        return;
    }
    
    const gradeDoc = studentGrades.find(g => g.materiaId === selectedSubjectId);
    if (!gradeDoc) {
        toast({ variant: "destructive", title: "Error", description: "No se encontró una nota existente para esta materia." });
        return;
    }
    
    setIsLoading(prev => ({...prev, submit: true}));
    try {
        const gradeRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/notas", gradeDoc.id);
        await updateDoc(gradeRef, { nota: parseFloat(newGrade) });

        const logsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/auditoria_notas");
        await addDoc(logsRef, {
            studentName: selectedStudent.nombreCompleto,
            subjectName: studentSubjects.find(s => s.id === selectedSubjectId)?.nombre || "N/A",
            oldGrade: currentGrade,
            newGrade: parseFloat(newGrade),
            user: gestorEmail,
            date: serverTimestamp(),
            reason: reason
        });
        
        toast({ title: "Éxito", description: "La nota se ha actualizado correctamente." });
        
        // Refresh audit logs
        const logsSnapshot = await getDocs(query(logsRef, where("date", "!=", null)));
        const fetchedLogs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
        fetchedLogs.sort((a, b) => b.date.toMillis() - a.date.toMillis());
        setAuditLogs(fetchedLogs);

        // Reset form
        setSelectedStudent(null);
        setSearchTerm("");
        setStudentSubjects([]);
        setSelectedSubjectId("");
        setNewGrade("");
        setReason("");

    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la nota." });
    } finally {
        setIsLoading(prev => ({...prev, submit: false}));
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de Calificaciones"
        description="Modifica notas de los estudiantes y consulta el registro de cambios."
        icon={<Edit className="h-8 w-8 text-primary" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Corregir Nota</CardTitle>
                    <CardDescription>
                        Busca al estudiante y la materia para realizar una corrección.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2 relative">
                        <Label htmlFor="student-search">Buscar Estudiante</Label>
                        <Input 
                            id="student-search" 
                            placeholder="Escribe para buscar..." 
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setSelectedStudent(null);
                            }}
                            disabled={isLoading.search}
                        />
                        {filteredStudents.length > 0 && (
                            <div className="absolute z-10 w-full bg-card border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                {filteredStudents.map(student => (
                                    <div key={student.id} onClick={() => handleSelectStudent(student)} className="p-2 hover:bg-muted cursor-pointer">
                                        {student.nombreCompleto}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="subject">Materia</Label>
                        <Select 
                            value={selectedSubjectId} 
                            onValueChange={setSelectedSubjectId} 
                            disabled={!selectedStudent || isLoading.subjects}
                        >
                            <SelectTrigger id="subject">
                                <SelectValue placeholder={isLoading.subjects ? "Cargando..." : "Seleccionar materia..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {studentSubjects.map(subject => (
                                    <SelectItem key={subject.id} value={subject.id}>{subject.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="old-grade">Nota Actual</Label>
                            <Input id="old-grade" value={currentGrade === undefined ? '' : currentGrade} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-grade">Nueva Nota</Label>
                            <Input id="new-grade" type="number" step="0.1" min="0" max="5" placeholder="0.0 - 5.0" value={newGrade} onChange={e => setNewGrade(e.target.value)} disabled={currentGrade === undefined} />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="reason">Motivo de la Corrección</Label>
                        <Textarea id="reason" placeholder="Describe brevemente el motivo del cambio..." value={reason} onChange={e => setReason(e.target.value)} disabled={currentGrade === undefined}/>
                     </div>
                     <Button className="w-full" onClick={handleSubmit} disabled={isLoading.submit || !selectedStudent || !newGrade || !reason}>
                        <Edit className="mr-2 h-4 w-4" />
                        {isLoading.submit ? "Guardando..." : "Guardar Corrección"}
                     </Button>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-3">
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <ClipboardList className="h-6 w-6 text-primary"/>
                        <CardTitle>Registro de Auditoría de Notas</CardTitle>
                    </div>
                    <CardDescription>
                        Historial de todas las correcciones de notas realizadas en el sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Estudiante</TableHead>
                                <TableHead>Nota Anterior</TableHead>
                                <TableHead>Nota Nueva</TableHead>
                                <TableHead>Modificado por</TableHead>
                                <TableHead>Fecha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading.logs ? (
                                Array.from({length: 3}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5}><Skeleton className="h-8 w-full"/></TableCell>
                                    </TableRow>
                                ))
                            ) : auditLogs.length > 0 ? (
                                auditLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <div className="font-medium">{log.studentName}</div>
                                        <div className="text-xs text-muted-foreground">{log.subjectName}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.oldGrade?.toFixed(1)}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-green-100 text-green-800">{log.newGrade.toFixed(1)}</Badge>
                                    </TableCell>
                                    <TableCell>{log.user}</TableCell>
                                    <TableCell className="text-xs">{log.date.toDate().toLocaleDateString('es-ES')}</TableCell>
                                </TableRow>
                                ))
                            ) : (
                               <TableRow>
                                  <TableCell colSpan={5} className="text-center h-24">No hay registros de auditoría.</TableCell>
                               </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}
