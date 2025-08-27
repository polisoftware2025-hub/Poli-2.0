
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { BookCopy, Users, Mail, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";

interface Student {
  id: string;
  nombre: string;
  correoInstitucional?: string;
}

interface Group {
  id: string;
  codigoGrupo: string;
  materia: { id: string; nombre: string };
  estudiantes: Student[];
}

export default function MyGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    setUserEmail(storedEmail);
  }, []);

  useEffect(() => {
    if (!userEmail) return;

    const fetchGroups = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const groupsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        const q = query(groupsRef, where("docente.email", "==", userEmail));
        
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setGroups([]);
        } else {
          const fetchedGroups: Group[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Group));
          setGroups(fetchedGroups);
        }
      } catch (err) {
        console.error("Error fetching groups: ", err);
        setError("No se pudieron cargar los grupos. Inténtalo de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [userEmail]);
  
  const handleViewDetails = async (group: Group) => {
    const studentIds = group.estudiantes.map(s => s.id);
    if(studentIds.length === 0) {
        setSelectedGroup(group);
        return;
    }

    try {
        const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
        // Firestore 'in' query is limited to 30 elements
        const studentChunks = [];
        for (let i = 0; i < studentIds.length; i += 30) {
          studentChunks.push(studentIds.slice(i, i + 30));
        }

        const studentsWithEmails: Student[] = [];

        for (const chunk of studentChunks) {
            const q = query(usersRef, where("usuarioId", "in", chunk));
            const userDocs = await getDocs(q);
            
            const emailMap = new Map<string, string>();
            userDocs.forEach(doc => {
                 const data = doc.data();
                 // Assuming the student document ID in 'estudiantes' subcollection is the same as 'usuarioId' field in 'usuarios' collection
                 emailMap.set(doc.id, data.correoInstitucional);
            });

             group.estudiantes.forEach(student => {
                 studentsWithEmails.push({
                     ...student,
                     correoInstitucional: emailMap.get(student.id) || 'No encontrado'
                 });
            });
        }
        
        setSelectedGroup({...group, estudiantes: studentsWithEmails});

    } catch (err) {
        console.error("Error fetching student emails: ", err);
        setError("No se pudo cargar la información de los estudiantes.");
        setSelectedGroup(group); // Show details even if emails fail
    }
  };

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
          description={`Código: ${selectedGroup.codigoGrupo}`}
          icon={<Users className="h-8 w-8 text-primary" />}
        />
        <Card>
            <CardHeader>
                <CardTitle>Lista de Estudiantes</CardTitle>
            </CardHeader>
            <CardContent>
                {selectedGroup.estudiantes && selectedGroup.estudiantes.length > 0 ? (
                     <div className="divide-y divide-border">
                        {selectedGroup.estudiantes.map(student => (
                            <div key={student.id} className="flex items-center justify-between py-3">
                                <span className="font-medium">{student.nombre}</span>
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {student.correoInstitucional || 'cargando...'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Este grupo no tiene estudiantes inscritos.</p>
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
                        <CardDescription>📚 {group.materia.nombre}</CardDescription>
                     </div>
                   </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center text-sm text-muted-foreground">
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
