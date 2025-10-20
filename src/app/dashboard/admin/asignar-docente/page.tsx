
      
"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { BookUp, User, Trash2, PlusCircle, Building, BookCopy, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Docente {
  id: string;
  nombreCompleto: string;
  asignaciones?: Asignacion[];
}

interface Asignacion {
  sedeId: string;
  carreraId: string;
  grupoId: string;
}

interface Sede { id: string; nombre: string; }
interface Carrera { id: string; nombre: string; }
interface Grupo { id: string; codigoGrupo: string; }

// Enriched assignment for display purposes
interface EnrichedAsignacion extends Asignacion {
    sedeNombre: string;
    carreraNombre: string;
    grupoNombre: string;
}

export default function AssignTeacherPage() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [enrichedAssignments, setEnrichedAssignments] = useState<EnrichedAsignacion[]>([]);
  
  const [selectedSede, setSelectedSede] = useState("");
  const [selectedCarrera, setSelectedCarrera] = useState("");
  const [selectedGrupo, setSelectedGrupo] = useState("");

  const [isLoading, setIsLoading] = useState({ docentes: true, data: false, assign: false });
  const { toast } = useToast();

  const fetchDocentes = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, docentes: true }));
    try {
      const q = query(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios"), where("rol.id", "==", "docente"));
      const querySnapshot = await getDocs(q);
      const fetchedDocentes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Docente));
      setDocentes(fetchedDocentes);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los docentes." });
    } finally {
      setIsLoading(prev => ({ ...prev, docentes: false }));
    }
  }, [toast]);
  
  const fetchSedesAndCarreras = useCallback(async () => {
     try {
      const sedesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes"));
      setSedes(sedesSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));
      
      const carrerasSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
      setCarreras(carrerasSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar sedes o carreras." });
    }
  }, [toast]);

  useEffect(() => {
    fetchDocentes();
    fetchSedesAndCarreras();
  }, [fetchDocentes, fetchSedesAndCarreras]);

  useEffect(() => {
    if (selectedSede && selectedCarrera) {
      const fetchGrupos = async () => {
        try {
          const q = query(
            collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"),
            where("idSede", "==", selectedSede),
            where("idCarrera", "==", selectedCarrera)
          );
          const gruposSnapshot = await getDocs(q);
          setGrupos(gruposSnapshot.docs.map(doc => ({ id: doc.id, codigoGrupo: doc.data().codigoGrupo })));
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los grupos." });
        }
      };
      fetchGrupos();
    } else {
      setGrupos([]);
    }
  }, [selectedSede, selectedCarrera, toast]);
  
  const handleSelectDocente = useCallback(async (docenteId: string) => {
    const docente = docentes.find(d => d.id === docenteId);
    if (!docente) return;
    
    setSelectedDocente(docente);
    setIsLoading(prev => ({...prev, data: true}));

    if (docente.asignaciones && docente.asignaciones.length > 0) {
        const enriched = await Promise.all(docente.asignaciones.map(async (asig) => {
            const sedeDoc = asig.sedeId ? await getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes", asig.sedeId)) : null;
            const carreraDoc = asig.carreraId ? await getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", asig.carreraId)) : null;
            const grupoDoc = asig.grupoId ? await getDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", asig.grupoId)) : null;

            return {
                ...asig,
                sedeNombre: sedeDoc?.exists() ? sedeDoc.data().nombre : 'N/A',
                carreraNombre: carreraDoc?.exists() ? carreraDoc.data().nombre : 'N/A',
                grupoNombre: grupoDoc?.exists() ? grupoDoc.data().codigoGrupo : 'N/A'
            };
        }));
        setEnrichedAssignments(enriched);
    } else {
        setEnrichedAssignments([]);
    }
    
    setIsLoading(prev => ({...prev, data: false}));
    // Reset form
    setSelectedSede("");
    setSelectedCarrera("");
    setSelectedGrupo("");

  }, [docentes]);
  
  const handleAssign = async () => {
    if (!selectedDocente || !selectedSede || !selectedCarrera || !selectedGrupo) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "Debes seleccionar sede, carrera y grupo." });
      return;
    }
    
    const newAssignment: Asignacion = { sedeId: selectedSede, carreraId: selectedCarrera, grupoId: selectedGrupo };
    
    if (selectedDocente.asignaciones?.some(a => a.grupoId === newAssignment.grupoId)) {
        toast({ variant: "destructive", title: "Asignación duplicada", description: "Este docente ya está asignado a ese grupo." });
        return;
    }

    setIsLoading(prev => ({...prev, assign: true}));
    try {
      const docenteRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", selectedDocente.id);
      await updateDoc(docenteRef, {
        asignaciones: arrayUnion(newAssignment)
      });
      toast({ title: "Éxito", description: "El docente ha sido asignado correctamente." });
      await fetchDocentes();
      await handleSelectDocente(selectedDocente.id);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo realizar la asignación." });
    } finally {
      setIsLoading(prev => ({...prev, assign: false}));
    }
  };

  const handleRemoveAssignment = async (assignmentToRemove: Asignacion) => {
    if (!selectedDocente) return;
    try {
      const docenteRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", selectedDocente.id);
      const docenteSnap = await getDoc(docenteRef);
      if (!docenteSnap.exists()) {
        throw new Error("No se encontró al docente para actualizar.");
      }
      const currentData = docenteSnap.data();
      const currentAssignments: Asignacion[] = currentData.asignaciones || [];

      // Filter out the assignment to remove. Compare all fields to be safe.
      const newAssignments = currentAssignments.filter(a => 
        !(a.grupoId === assignmentToRemove.grupoId && a.carreraId === assignmentToRemove.carreraId && a.sedeId === assignmentToRemove.sedeId)
      );

      await updateDoc(docenteRef, {
        asignaciones: newAssignments
      });

      toast({ title: "Éxito", description: "La asignación ha sido eliminada." });
      await fetchDocentes(); // Re-fetch all teachers to have fresh data
      await handleSelectDocente(selectedDocente.id); // Refresh the view for the current teacher
    } catch (error: any) {
       toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo eliminar la asignación." });
    }
  };


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Asignar Docentes"
        description="Gestiona las asignaciones de docentes a carreras, sedes y grupos."
        icon={<BookUp className="h-8 w-8 text-primary" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Docentes</CardTitle>
              <CardDescription>Selecciona un docente para ver y gestionar sus asignaciones.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.docentes ? (
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {docentes.map(d => (
                    <Button
                      key={d.id}
                      variant={selectedDocente?.id === d.id ? "secondary" : "outline"}
                      className="w-full justify-start text-left"
                      onClick={() => handleSelectDocente(d.id)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      {d.nombreCompleto}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedDocente ? (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Nueva Asignación para {selectedDocente.nombreCompleto}</CardTitle>
                   <CardDescription>Selecciona los detalles para asignar un nuevo grupo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <div className="space-y-2">
                         <Label>Sede</Label>
                         <Select value={selectedSede} onValueChange={setSelectedSede}>
                            <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                            <SelectContent>{sedes.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                         </Select>
                     </div>
                      <div className="space-y-2">
                         <Label>Carrera</Label>
                         <Select value={selectedCarrera} onValueChange={setSelectedCarrera} disabled={!selectedSede}>
                            <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                            <SelectContent>{carreras.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                         </Select>
                     </div>
                      <div className="space-y-2">
                         <Label>Grupo</Label>
                         <Select value={selectedGrupo} onValueChange={setSelectedGrupo} disabled={!selectedCarrera}>
                            <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                            <SelectContent>{grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.codigoGrupo}</SelectItem>)}</SelectContent>
                         </Select>
                     </div>
                  </div>
                  <div className="flex justify-end">
                      <Button onClick={handleAssign} disabled={isLoading.assign}>
                          <PlusCircle className="mr-2 h-4 w-4"/>
                          {isLoading.assign ? "Asignando..." : "Asignar Grupo"}
                      </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Asignaciones Actuales</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading.data ? <p>Cargando asignaciones...</p> : (
                    enrichedAssignments.length > 0 ? (
                       <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sede</TableHead>
                                <TableHead>Carrera</TableHead>
                                <TableHead>Grupo</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {enrichedAssignments.map((asig, i) => (
                                <TableRow key={i}>
                                    <TableCell>{asig.sedeNombre}</TableCell>
                                    <TableCell>{asig.carreraNombre}</TableCell>
                                    <TableCell>{asig.grupoNombre}</TableCell>
                                    <TableCell className="text-right">
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="destructive" size="icon" className="h-8 w-8">
                                            <Trash2 className="h-4 w-4"/>
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción eliminará la asignación del docente al grupo <strong>{asig.grupoNombre}</strong>. No se puede deshacer.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemoveAssignment(asig)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                       </Table>
                    ) : <p className="text-sm text-muted-foreground text-center">Este docente no tiene asignaciones activas.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-8 border rounded-lg">
              <p>Selecciona un docente de la lista para comenzar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

    