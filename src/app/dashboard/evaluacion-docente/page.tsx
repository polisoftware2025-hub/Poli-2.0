
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, DocumentData } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

interface Group {
  id: string;
  codigoGrupo: string;
  materia: { id: string; nombre: string };
  docente?: { id: string; nombre: string; usuarioId: string };
}

export default function TeacherEvaluationPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [rating, setRating] = useState([3]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const gruposRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        const studentGroups: Group[] = [];
        
        const querySnapshot = await getDocs(gruposRef);
        querySnapshot.forEach(doc => {
            const group = doc.data();
            // Filter groups: student must be enrolled AND a teacher must be assigned.
            if (group.estudiantes && group.estudiantes.some((est: any) => est.id === userId) && group.docente) {
                studentGroups.push({ id: doc.id, ...group } as Group);
            }
        });
        
        setGroups(studentGroups);
      } catch (error) {
        console.error("Error fetching groups for evaluation:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los grupos." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [userId, toast]);

  const handleOpenDialog = (group: Group) => {
    setSelectedGroup(group);
    setRating([3]);
    setComment("");
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!selectedGroup || !userId || !selectedGroup.docente) return;

    if (comment.length < 10) {
        toast({ variant: "destructive", title: "Comentario muy corto", description: "El comentario debe tener al menos 10 caracteres." });
        return;
    }

    setIsSubmitting(true);
    try {
        const evaluationsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/evaluaciones_docentes");
        await addDoc(evaluationsRef, {
            estudianteId: userId,
            docenteId: selectedGroup.docente.usuarioId,
            grupoId: selectedGroup.id,
            materiaId: selectedGroup.materia.id,
            calificacion: rating[0],
            comentario: comment,
            fechaCreacion: serverTimestamp()
        });

        toast({ title: "Evaluación Enviada", description: `Gracias por evaluar a ${selectedGroup.docente.nombre}.` });
        setOpenDialog(false);

    } catch (error) {
        console.error("Error submitting evaluation:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo enviar la evaluación." });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Evaluación de Docentes"
        description="Tu opinión es importante para mejorar la calidad académica."
        icon={<Star className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Docentes por Evaluar</CardTitle>
          <CardDescription>Selecciona un docente para calificar su desempeño en la materia correspondiente.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : groups.length > 0 ? (
            <div className="divide-y divide-border">
              {groups.map((group) => (
                <div key={group.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-bold">{group.docente?.nombre || "Docente no asignado"}</p>
                    <p className="text-sm text-muted-foreground">{group.materia.nombre} ({group.codigoGrupo})</p>
                  </div>
                  <Button onClick={() => handleOpenDialog(group)}>Evaluar</Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <p>No tienes docentes disponibles para evaluar en este momento.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[425px]">
            {selectedGroup && (
                <>
                <DialogHeader>
                    <DialogTitle>Evaluar a {selectedGroup.docente?.nombre}</DialogTitle>
                    <DialogDescription>
                        Materia: {selectedGroup.materia.nombre}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="rating">Calificación (1 a 5 estrellas)</Label>
                        <div className="flex items-center gap-4">
                            <Slider
                                id="rating"
                                min={1}
                                max={5}
                                step={1}
                                value={rating}
                                onValueChange={setRating}
                            />
                            <div className="flex items-center font-bold text-lg text-yellow-500">
                               <span>{rating[0]}</span> <Star className="h-5 w-5 fill-current" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="comment">Comentario</Label>
                         <Textarea 
                            id="comment"
                            placeholder="Escribe tus comentarios aquí..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                         />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Enviando..." : "Enviar Evaluación"}
                    </Button>
                </DialogFooter>
                </>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

