

"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { BookCopy, Users, ClipboardCheck, UserCheck } from "lucide-react";

interface Student {
  id: string;
  nombre: string;
}

interface CourseInfo {
  subjectName: string;
  groupCode: string;
  students: Student[];
  groupId: string;
  subjectId: string;
}

type AttendanceStatus = "Presente" | "Ausente" | "Tarde";

export default function CourseDetailPage() {
  const params = useParams();
  const cursoId = params.cursoId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [docenteId, setDocenteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("students");

  // State for Notas Tab
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [finalGrade, setFinalGrade] = useState("");
  const [observation, setObservation] = useState("");
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  // State for Asistencia Tab
  const [attendance, setAttendance] = useState<{ [key: string]: AttendanceStatus }>({});
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  useEffect(() => {
    setDocenteId(localStorage.getItem('userId'));
    if (cursoId) {
      const [groupId, subjectId] = cursoId.split("___");

      if (!groupId || !subjectId) {
        toast({ variant: "destructive", title: "Error", description: "URL del curso no válida." });
        notFound();
        return;
      }

      const fetchCourseDetails = async () => {
        setIsLoading(true);
        try {
          const groupRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", groupId);
          const groupSnap = await getDoc(groupRef);

          if (!groupSnap.exists()) {
            notFound();
            return;
          }
          const groupData = groupSnap.data();
          const scheduleEntry = groupData.horario?.find((h: any) => h.materiaId === subjectId);

          if (!scheduleEntry) {
            notFound();
            return;
          }

          let students: Student[] = [];
          if (groupData.estudiantes?.length > 0) {
              const studentIds = groupData.estudiantes.map((s: any) => s.id);
              const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
              const q = query(usersRef, where("__name__", "in", studentIds));
              const userDocs = await getDocs(q);
              students = userDocs.docs.map(d => ({id: d.id, nombre: d.data().nombreCompleto}));
          }

          setCourseInfo({
            subjectName: scheduleEntry.materiaNombre,
            groupCode: groupData.codigoGrupo,
            students,
            groupId,
            subjectId,
          });

          // Initialize attendance
          const initialAttendance = students.reduce((acc: any, student) => {
              acc[student.id] = "Presente";
              return acc;
          }, {});
          setAttendance(initialAttendance);

        } catch (error) {
          console.error("Error fetching course details:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los detalles del curso." });
        } finally {
          setIsLoading(false);
        }
      };

      fetchCourseDetails();
    }
  }, [cursoId, toast]);
  
  const handleSaveGrade = async () => {
      if (!selectedStudentId || !finalGrade || !courseInfo) {
          toast({ variant: "destructive", title: "Campos requeridos", description: "Selecciona un estudiante y una nota." });
          return;
      }
      setIsSavingGrade(true);
      try {
          await addDoc(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/notas"), {
              estudianteId: selectedStudentId,
              grupoId: courseInfo.groupId,
              materiaId: courseInfo.subjectId,
              nota: parseFloat(finalGrade),
              observacion: observation,
              fecha: serverTimestamp(),
              docenteId,
          });
          toast({ title: "Éxito", description: "Nota guardada correctamente."});
          setSelectedStudentId("");
          setFinalGrade("");
          setObservation("");
      } catch (err) {
          toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la nota."});
      } finally {
          setIsSavingGrade(false);
      }
  };

  const handleSaveAttendance = async () => {
      if (!courseInfo) return;
      setIsSavingAttendance(true);
      try {
          const attendanceRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/asistencias");
          const attendancePromises = Object.entries(attendance).map(([studentId, status]) => {
              return addDoc(attendanceRef, {
                  estudianteId: studentId,
                  grupoId: courseInfo.groupId,
                  materiaId: courseInfo.subjectId,
                  fecha: serverTimestamp(),
                  estado: status,
                  docenteId,
              });
          });
          await Promise.all(attendancePromises);
          toast({ title: "Éxito", description: "Asistencia guardada correctamente."});
      } catch(err) {
          toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la asistencia."});
      } finally {
          setIsSavingAttendance(false);
      }
  };


  if (isLoading || !courseInfo) {
    return <div>Cargando...</div>;
  }
  
  const breadcrumbs = [
    { name: "Mis Cursos", href: "/dashboard/docente/cursos" },
    { name: courseInfo.subjectName, href: `/dashboard/docente/cursos/${cursoId}` }
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={courseInfo.subjectName}
        description={`Gestiona los estudiantes, notas y asistencia para el grupo ${courseInfo.groupCode}`}
        icon={<BookCopy className="h-8 w-8 text-primary" />}
        breadcrumbs={breadcrumbs}
      />
      
       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="students"><Users className="mr-2 h-4 w-4"/>Estudiantes</TabsTrigger>
              <TabsTrigger value="grades"><ClipboardCheck className="mr-2 h-4 w-4"/>Notas</TabsTrigger>
              <TabsTrigger value="attendance"><UserCheck className="mr-2 h-4 w-4"/>Asistencia</TabsTrigger>
          </TabsList>
          <TabsContent value="students">
              <Card>
                  <CardHeader>
                      <CardTitle>Estudiantes Inscritos</CardTitle>
                      <CardDescription>{courseInfo.students.length} estudiantes en este curso.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>#</TableHead>
                                  <TableHead>Nombre del Estudiante</TableHead>
                                  <TableHead>ID de Estudiante</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {courseInfo.students.map((student, index) => (
                                  <TableRow key={student.id}>
                                      <TableCell>{index + 1}</TableCell>
                                      <TableCell className="font-medium">{student.nombre}</TableCell>
                                      <TableCell>{student.id}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </TabsContent>
          <TabsContent value="grades">
              <Card>
                  <CardHeader>
                      <CardTitle>Registro de Notas</CardTitle>
                      <CardDescription>Asigna la calificación final a un estudiante.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div>
                          <Label>Estudiante</Label>
                          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                              <SelectTrigger><SelectValue placeholder="Selecciona un estudiante..."/></SelectTrigger>
                              <SelectContent>
                                  {courseInfo.students.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                      <div>
                          <Label>Nota Final</Label>
                          <Input type="number" min="0" max="5" step="0.1" value={finalGrade} onChange={(e) => setFinalGrade(e.target.value)} placeholder="Ej: 4.5"/>
                      </div>
                      <div>
                          <Label>Observación (Opcional)</Label>
                          <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Anotaciones sobre la nota..."/>
                      </div>
                      <Button onClick={handleSaveGrade} disabled={isSavingGrade}>{isSavingGrade ? "Guardando..." : "Guardar Nota"}</Button>
                  </CardContent>
              </Card>
          </TabsContent>
          <TabsContent value="attendance">
              <Card>
                  <CardHeader>
                      <CardTitle>Toma de Asistencia</CardTitle>
                      <CardDescription>Registra la asistencia para la sesión de hoy.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader><TableRow><TableHead>Estudiante</TableHead><TableHead className="text-center">Estado</TableHead></TableRow></TableHeader>
                          <TableBody>
                              {courseInfo.students.map(student => (
                                  <TableRow key={student.id}>
                                      <TableCell className="font-medium">{student.nombre}</TableCell>
                                      <TableCell>
                                          <RadioGroup 
                                            defaultValue="Presente" 
                                            className="flex justify-center gap-4"
                                            onValueChange={(value) => setAttendance(prev => ({...prev, [student.id]: value as AttendanceStatus}))}
                                          >
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="Presente" id={`p-${student.id}`}/><Label htmlFor={`p-${student.id}`}>Presente</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="Ausente" id={`a-${student.id}`}/><Label htmlFor={`a-${student.id}`}>Ausente</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="Tarde" id={`t-${student.id}`}/><Label htmlFor={`t-${student.id}`}>Tarde</Label></div>
                                          </RadioGroup>
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                      <div className="flex justify-end mt-4">
                          <Button onClick={handleSaveAttendance} disabled={isSavingAttendance}>{isSavingAttendance ? "Guardando..." : "Guardar Asistencia"}</Button>
                      </div>
                  </CardContent>
              </Card>
          </TabsContent>
       </Tabs>
    </div>
  );
}
