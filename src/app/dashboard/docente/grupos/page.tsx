
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { BookCopy, Users, Mail, ArrowLeft, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData, doc, getDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

interface Student {
  id: string;
  nombre: string;
  correoInstitucional?: string;
  estadoMatricula?: "activo" | "inactivo";
}

interface Group {
  id: string;
  codigoGrupo: string;
  materia: { id: string; nombre: string };
  sedeNombre: string;
  carreraNombre: string;
  ciclo: number;
  estudiantes: Student[];
}

export default function MyGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchGroups = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists() || !userSnap.data().asignaciones) {
          setGroups([]);
          setIsLoading(false);
          return;
        }

        const assignments = userSnap.data().asignaciones;
        const groupIds = assignments.map((a: any) => a.grupoId);

        if (groupIds.length === 0) {
          setGroups([]);
          setIsLoading(false);
          return;
        }

        const groupsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        const q = query(groupsRef, where("__name__", "in", groupIds));
        
        const querySnapshot = await getDocs(q);
        const fetchedGroups: Group[] = [];
        
        const sedesCache = new Map();
        const carrerasCache = new Map();
        
        for (const groupDoc of querySnapshot.docs) {
            const data = groupDoc.data();
            
            if (data.materia) { // Check if materia exists
                let sedeNombre = sedesCache.get(data.idSede);
                if (!sedeNombre) {
                    const sedeDoc = await getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes", data.idSede));
                    if (sedeDoc.exists()) {
                        sedeNombre = sedeDoc.data().nombre;
                        sedesCache.set(data.idSede, sedeNombre);
                    }
                }

                let carreraNombre = carrerasCache.get(data.idCarrera);
                if (!carreraNombre) {
                    const carreraDoc = await getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", data.idCarrera));
                    if (carreraDoc.exists()) {
                        carreraNombre = carreraDoc.data().nombre;
                        carrerasCache.set(data.idCarrera, carreraNombre);
                    }
                }

                fetchedGroups.push({
                  id: groupDoc.id,
                  ...data,
                  sedeNombre: sedeNombre || "N/A",
                  carreraNombre: carreraNombre || "N/A",
                } as Group);
            }
        }
        
        setGroups(fetchedGroups);
      } catch (err) {
        console.error("Error fetching groups: ", err);
        setError("No se pudieron cargar los grupos. Inténtalo de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [userId]);
  
  const handleViewDetails = async (group: Group) => {
    if (!group.estudiantes || group.estudiantes.length === 0) {
        setSelectedGroup(group);
        return;
    }
  
    const studentIds = group.estudiantes.map(s => s.id);
    
    try {
        const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
        const studentChunks = [];
        for (let i = 0; i < studentIds.length; i += 30) {
          studentChunks.push(studentIds.slice(i, i + 30));
        }

        const enrichedStudents = new Map<string, Student>();
        for (const chunk of studentChunks) {
            if (chunk.length === 0) continue;
            const q = query(usersRef, where("__name__", "in", chunk));
            const userDocs = await getDocs(q);
            userDocs.forEach(doc => {
                 const data = doc.data();
                 enrichedStudents.set(doc.id, {
                     id: doc.id,
                     nombre: data.nombreCompleto,
                     correoInstitucional: data.correoInstitucional || data.correo,
                     estadoMatricula: data.estado === "activo" ? "activo" : "inactivo"
                 });
            });
        }
        
        const updatedStudents = group.estudiantes.map(student => enrichedStudents.get(student.id) || student);
        
        setSelectedGroup({...group, estudiantes: updatedStudents});

    } catch (err) {
        console.error("Error fetching student details: ", err);
        setError("No se pudo cargar la información de los estudiantes.");
        setSelectedGroup(group);
    }
  };

  const exportToPDF = (group: Group) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    doc.setFontSize(18);
    doc.text(`Lista de Estudiantes - ${group.materia.nombre}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Grupo: ${group.codigoGrupo}`, 14, 30);

    const tableColumn = ["#", "Nombre Completo", "Correo Electrónico", "Estado"];
    const tableRows: (string | number)[][] = [];

    group.estudiantes.forEach((student, index) => {
      const studentData = [
        index + 1,
        student.nombre,
        student.correoInstitucional || "N/A",
        student.estadoMatricula === "activo" ? "Activo" : "Inactivo",
      ];
      tableRows.push(studentData);
    });

    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 35 });
    doc.save(`estudiantes_${group.codigoGrupo}.pdf`);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Mis Grupos"
          description="Consulta los grupos que tienes asignados y los estudiantes inscritos."
          icon={<BookCopy className="h-8 w-8 text-primary" />}
        />
        <div className="text-center text-muted-foreground">Cargando grupos...</div>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Mis Grupos"
          description="Consulta los grupos que tienes asignados y los estudiantes inscritos."
          icon={<BookCopy className="h-8 w-8 text-primary" />}
        />
        <div className="text-center text-destructive">{error}</div>
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <div className="flex flex-col gap-8">
         <PageHeader
          title={`Detalle del Grupo: ${selectedGroup.materia.nombre}`}
          description={`Código: ${selectedGroup.codigoGrupo} | Sede: ${selectedGroup.sedeNombre} | Carrera: ${selectedGroup.carreraNombre}`}
          icon={<Users className="h-8 w-8 text-primary" />}
        />
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Lista de Estudiantes</CardTitle>
                        <CardDescription>
                            {selectedGroup.estudiantes?.length || 0} estudiantes inscritos.
                        </CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => exportToPDF(selectedGroup)} disabled={!selectedGroup.estudiantes || selectedGroup.estudiantes.length === 0}>
                        <FileDown className="mr-2 h-4 w-4"/>
                        Exportar PDF
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {selectedGroup.estudiantes && selectedGroup.estudiantes.length > 0 ? (
                     <div className="divide-y divide-border">
                        {selectedGroup.estudiantes.map(student => (
                            <div key={student.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 gap-2">
                                <span className="font-medium">{student.nombre}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {student.correoInstitucional || 'cargando...'}
                                    </span>
                                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${student.estadoMatricula === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {student.estadoMatricula === 'activo' ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Este grupo no tiene estudiantes inscritos.</p>
                )}
            </CardContent>
            <CardFooter>
                 <Button variant="outline" onClick={() => setSelectedGroup(null)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Mis Grupos
                </Button>
            </CardFooter>
        </Card>
      </div>
    )
  }


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis Grupos"
        description="Consulta los grupos que tienes asignados y los estudiantes inscritos."
        icon={<BookCopy className="h-8 w-8 text-primary" />}
      />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length > 0 ? (
            groups.map(group => (
              <Card key={group.id} className="flex flex-col">
                <CardHeader>
                   <div className="flex items-start justify-between">
                     <div>
                        <CardTitle className="leading-tight">📘 {group.codigoGrupo}</CardTitle>
                        <CardDescription className="mt-1">📚 {group.materia?.nombre || 'Materia no definida'}</CardDescription>
                     </div>
                   </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm">
                    <p><span className="font-semibold">Sede:</span> {group.sedeNombre}</p>
                    <p><span className="font-semibold">Carrera:</span> {group.carreraNombre}</p>
                    <p><span className="font-semibold">Ciclo:</span> {group.ciclo}</p>
                    <div className="flex items-center text-muted-foreground pt-2">
                        <Users className="h-4 w-4 mr-2"/>
                        <span>{group.estudiantes?.length || 0} Estudiantes inscritos</span>
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button className="w-full" onClick={() => handleViewDetails(group)}>
                        Ver Detalles
                    </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-6 text-center text-muted-foreground">
                    No tienes grupos asignados aún.
                </CardContent>
            </Card>
          )}
        </div>
    </div>
  );
}
