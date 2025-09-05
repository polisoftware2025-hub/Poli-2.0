
      
"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

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

interface GroupSelectorProps {
  onGroupSelect: (group: Group | null) => void;
}

export function GroupSelector({ onGroupSelect }: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [docenteId, setDocenteId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setDocenteId(storedUserId);
  }, []);

  useEffect(() => {
    if (!docenteId) return;

    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const docenteRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", docenteId);
        const docenteSnap = await getDoc(docenteRef);

        if (!docenteSnap.exists() || !docenteSnap.data().asignaciones) {
          setGroups([]);
          setIsLoading(false);
          return;
        }

        const assignments = docenteSnap.data().asignaciones;
        const groupIds = assignments.map((a: any) => a.grupoId);

        if (groupIds.length === 0) {
          setGroups([]);
          setIsLoading(false);
          return;
        }

        const groupsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        const q = query(groupsRef, where("__name__", "in", groupIds));
        
        const querySnapshot = await getDocs(q);
        const fetchedGroups: Group[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Group));
        
        setGroups(fetchedGroups);

      } catch (error) {
        console.error("Error fetching groups for selector: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [docenteId]);

  const handleSelectChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    const selected = groups.find(g => g.id === groupId) || null;
    onGroupSelect(selected);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="group-selector">Seleccionar Grupo</Label>
      <Select onValueChange={handleSelectChange} value={selectedGroupId} disabled={isLoading || groups.length === 0}>
        <SelectTrigger id="group-selector">
          <SelectValue placeholder={isLoading ? "Cargando grupos..." : "Selecciona un grupo"} />
        </SelectTrigger>
        <SelectContent>
          {groups.length > 0 ? (
            groups.map(group => (
              <SelectItem key={group.id} value={group.id}>
                {group.materia.nombre} ({group.codigoGrupo})
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-groups" disabled>
              No tienes grupos asignados
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

    