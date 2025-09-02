
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, User, CheckCircle, Plus, Trash2, Edit, Upload } from "lucide-react";
import { useParams, notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface Materia {
  nombre: string;
  codigo?: string;
  creditos: number;
}
interface Ciclo {
  numero: number;
  materias: Materia[];
}
interface Career {
  id?: string;
  nombre: string;
  slug: string;
  descripcionGeneral: string;
  perfilProfesional: string;
  imagenURL: string;
  duracionCiclo: string;
  modalidad: string;
  inversion: number;
  titulo: string;
  ciclos: Ciclo[];
}

export default function ProgramDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [programDetails, setProgramDetails] = useState<Career | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCycleIndex, setCurrentCycleIndex] = useState<number | null>(null);
  const [newMateria, setNewMateria] = useState({ nombre: "", codigo: "", creditos: 0 });

  useEffect(() => {
    const fetchProgram = async () => {
      setIsLoading(true);
      try {
        const careersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
        const q = query(careersRef, where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          notFound();
          return;
        }

        const programDoc = querySnapshot.docs[0];
        setProgramDetails({ id: programDoc.id, ...programDoc.data() } as Career);
      } catch (error) {
        console.error("Error fetching program details:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la carrera." });
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchProgram();
    }
  }, [slug, toast]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProgramDetails(prev => prev ? { ...prev, [id]: value } : null);
  };
  
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programDetails || !programDetails.id) return;
    
    setIsLoading(true);
    try {
        const careerDocRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", programDetails.id);
        const { id, ...dataToUpdate } = programDetails;
        await updateDoc(careerDocRef, dataToUpdate);
        toast({ title: "Éxito", description: "La carrera ha sido actualizada." });
        router.push("/dashboard/admin/career");
    } catch (error) {
        console.error("Error updating career:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la carrera." });
    } finally {
        setIsLoading(false);
    }
  };

  const handleAddCycle = () => {
    if (!programDetails) return;
    setProgramDetails((prevDetails) => {
        if (!prevDetails) return null;
        const lastCycle = prevDetails.ciclos[prevDetails.ciclos.length - 1];
        const newCycleNumber = lastCycle ? lastCycle.numero + 1 : 1;
        const newCycle = {
            numero: newCycleNumber,
            materias: []
        };
        return {
            ...prevDetails,
            ciclos: [...prevDetails.ciclos, newCycle]
        };
    });
  };

  const handleRemoveCycle = (cycleNumber: number) => {
    if (!programDetails) return;
    setProgramDetails((prevDetails) => (prevDetails ? {
        ...prevDetails,
        ciclos: prevDetails.ciclos.filter((c) => c.numero !== cycleNumber)
    } : null));
  };
  
  const handleAddMateria = () => {
    if (programDetails && currentCycleIndex !== null) {
      const updatedCiclos = [...programDetails.ciclos];
      updatedCiclos[currentCycleIndex].materias.push(newMateria);
      setProgramDetails({ ...programDetails, ciclos: updatedCiclos });
      setNewMateria({ nombre: "", codigo: "", creditos: 0 });
      setIsDialogOpen(false);
      setCurrentCycleIndex(null);
    }
  };

  const handleRemoveMateria = (cycleIndex: number, materiaIndex: number) => {
    if (!programDetails) return;
    const updatedCiclos = [...programDetails.ciclos];
    updatedCiclos[cycleIndex].materias.splice(materiaIndex, 1);
    setProgramDetails({ ...programDetails, ciclos: updatedCiclos });
  };
  
   if (isLoading) {
    return <div className="text-center p-8">Cargando detalles del programa...</div>;
  }

  if (!programDetails) {
    notFound();
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={programDetails.nombre}
        description="Modifica los detalles de este programa académico."
        icon={<Edit className="h-8 w-8 text-primary" />}
        backPath="/dashboard/admin/career"
      />
      <form onSubmit={handleUpdate}>
        <Card className="overflow-hidden">
          <div className="relative h-64 w-full">
            <Image
              src={programDetails.imagenURL}
              alt={`Imagen de ${programDetails.nombre}`}
              fill
              style={{ objectFit: "cover" }}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Label htmlFor="image-upload" className="cursor-pointer">
                  <Button variant="secondary" type="button" asChild>
                      <span>
                          <Upload className="mr-2 h-4 w-4"/>
                          Cambiar Imagen
                      </span>
                  </Button>
              </Label>
              <Input id="image-upload" type="file" className="hidden" accept="image/*" />
            </div>
          </div>
          <CardContent className="p-6 space-y-4">
              <div>
                  <Label htmlFor="nombre">Nombre de la Carrera</Label>
                  <Input id="nombre" value={programDetails.nombre} onChange={handleChange}/>
              </div>
              <div>
                  <Label htmlFor="descripcionGeneral">Descripción General</Label>
                  <Textarea id="descripcionGeneral" value={programDetails.descripcionGeneral} onChange={handleChange} rows={5}/>
              </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-primary" />
                <CardTitle>Perfil Profesional</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea id="perfilProfesional" value={programDetails.perfilProfesional} onChange={handleChange} rows={8}/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-primary" />
                <CardTitle>Información Clave</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label htmlFor="inversion">Inversión por ciclo</Label>
                      <Input id="inversion" type="number" value={programDetails.inversion} onChange={(e) => setProgramDetails(p => p ? {...p, inversion: parseInt(e.target.value)} : null)} />
                  </div>
                  <div>
                      <Label htmlFor="duracionCiclo">Duración (Ciclos)</Label>
                      <Input id="duracionCiclo" value={programDetails.duracionCiclo} onChange={handleChange}/>
                  </div>
              </div>
              <div>
                  <Label htmlFor="titulo">Título Otorgado</Label>
                  <Input id="titulo" value={programDetails.titulo} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Plan de Estudios (Pensum)</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full" defaultValue="ciclo-1">
              {programDetails.ciclos.map((ciclo, cycleIndex) => (
                <AccordionItem value={`ciclo-${ciclo.numero}`} key={ciclo.numero}>
                  <div className="flex items-center w-full">
                      <AccordionTrigger className="text-lg font-semibold hover:no-underline flex-grow">
                          Ciclo {ciclo.numero}
                      </AccordionTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCycle(ciclo.numero);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  <AccordionContent>
                    <ul className="space-y-3 pt-2">
                      {ciclo.materias.map((materia, materiaIndex) => (
                        <li key={materia.codigo || materiaIndex} className="flex justify-between items-center text-gray-700 p-2 rounded-md hover:bg-gray-100">
                          <div className="flex-grow">
                              <span>{materia.nombre}</span>
                              <span className="text-sm font-medium text-white bg-primary px-2 py-1 rounded-full ml-2">{materia.creditos} créditos</span>
                          </div>
                          <Button variant="destructive" size="icon" className="h-8 w-8" type="button" onClick={() => handleRemoveMateria(cycleIndex, materiaIndex)}>
                            <Trash2 className="h-4 w-4"/>
                          </Button>
                        </li>
                      ))}
                    </ul>
                     <Dialog open={isDialogOpen && currentCycleIndex === cycleIndex} onOpenChange={(isOpen) => { if(!isOpen) setCurrentCycleIndex(null); setIsDialogOpen(isOpen); }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="mt-4" type="button" onClick={() => { setCurrentCycleIndex(cycleIndex); setIsDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4"/>
                                Agregar Materia
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Agregar Nueva Materia al Ciclo {ciclo.numero}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="subjectName">Nombre de la Materia</Label>
                                    <Input id="subjectName" placeholder="Ej: Cálculo Integral" value={newMateria.nombre} onChange={(e) => setNewMateria({...newMateria, nombre: e.target.value})}/>
                                </div>
                                <div>
                                    <Label htmlFor="subjectCode">Código</Label>
                                    <Input id="subjectCode" placeholder="Ej: MAT-102" value={newMateria.codigo} onChange={(e) => setNewMateria({...newMateria, codigo: e.target.value})}/>
                                </div>
                                <div>
                                    <Label htmlFor="subjectCredits">Créditos</Label>
                                    <Input id="subjectCredits" type="number" placeholder="Ej: 3" value={newMateria.creditos} onChange={(e) => setNewMateria({...newMateria, creditos: parseInt(e.target.value) || 0})}/>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button type="button" onClick={handleAddMateria}>Guardar Materia</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <Button variant="secondary" className="mt-6" onClick={handleAddCycle} type="button">
                  <Plus className="mr-2 h-4 w-4"/>
                  Agregar Nuevo Ciclo
              </Button>
          </CardContent>
        </Card>
        
        <Card className="mt-8">
          <CardFooter className="p-6 bg-gray-50 rounded-b-xl border-t flex justify-end gap-4">
              <Button asChild type="button" variant="outline">
                  <Link href="/dashboard/admin/career">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Guardando..." : "Guardar Cambios"}</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
