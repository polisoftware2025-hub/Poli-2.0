
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { BookCopy, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface Group {
  id: string;
  codigoGrupo: string;
  materia: { id: string; nombre: string };
  estudiantes: { id: string; nombre: string }[];
}

export default function MyGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
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

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis Grupos"
        description="Consulta los grupos que tienes asignados y los estudiantes inscritos."
        icon={<BookCopy className="h-8 w-8 text-primary" />}
      />

      {isLoading && (
        <div className="text-center text-muted-foreground">Cargando grupos...</div>
      )}

      {error && (
        <div className="text-center text-destructive">{error}</div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length > 0 ? (
            groups.map(group => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>{group.materia.nombre}</CardTitle>
                  <CardDescription>Código: {group.codigoGrupo}</CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Estudiantes Inscritos
                  </h4>
                  {group.estudiantes && group.estudiantes.length > 0 ? (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {group.estudiantes.map(student => (
                        <li key={student.id}>{student.nombre}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay estudiantes inscritos en este grupo.</p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground md:col-span-2 lg:col-span-3">No tienes grupos asignados.</p>
          )}
        </div>
      )}
    </div>
  );
}
