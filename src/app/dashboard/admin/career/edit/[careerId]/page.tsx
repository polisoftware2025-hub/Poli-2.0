"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, User, CheckCircle, Plus, Trash2, Edit, Upload, DollarSign, AlertTriangle } from "lucide-react";
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
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface Materia {
  id?: string; 
  nombre: string;
  codigo?: string;
  creditos: number;
}
interface Ciclo {
  numero: number;
  nombre?: string;
  materias: Materia[];
}
interface Career {
  id?: string;
  nombre: string;
  descripcionGeneral: string;
  perfilProfesional: string;
  imagenURL: string;
  duracionCiclo: string;
  modalidad: string;
  titulo: string;
  ciclos: Ciclo[];
  precioPorCiclo: { [key: string]: number };
}

function truncateString(str: string, num: number) {
    if (str.length <= num) {
        return str;
    }
    return str.slice(0, num) + "...";
}

export default function EditCareerPage() {
  const params = useParams();
  const careerId = params.careerId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [programDetails, setProgramDetails] = useState<Career | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<{ materia: Materia; cycleIndex: number; materiaIndex: number } | null>(null);
  const [newMateria, setNewMateria] = useState<Materia>({ nombre: "", codigo: "", creditos: 0 });
  const [currentCycleIndex, setCurrentCycleIndex] = useState<number | null>(null);
  const [currentCycleCredits, setCurrentCycleCredits] = useState(0);

  useEffect(() => {
    const fetchProgram = async () => {
      if (!careerId) return;
      setIsLoading(true);
      try {
        const careerDocRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", careerId);
        const programDoc = await getDoc(careerDocRef);

        if (!programDoc.exists()) {
          notFound();
          return;
        }

        setProgramDetails({ id: programDoc.id, ...programDoc.data() } as Career);
      } catch (error) {
        console.error("Error fetching program details:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la carrera." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgram();
  }, [careerId, toast]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProgramDetails(prev => prev ? { ...prev, [id]: value } : null);
  };
  
  const handleCycleNameChange = (cycleIndex: number, newName: string) => {
    if (!programDetails) return;
    const updatedCiclos = [...programDetails.ciclos];
    updatedCiclos[cycleIndex].nombre = newName;
    setProgramDetails({ ...programDetails, ciclos: updatedCiclos });
  };

  const handlePriceChange = (cycleNumber: number, value: string) => {
    if (!programDetails) return;
    const newPrices = { ...programDetails.precioPorCiclo };
    const price = parseInt(value, 10);
    newPrices[cycleNumber] = isNaN(price) ? 0 : price;
    setProgramDetails({ ...programDetails, precioPorCiclo: newPrices });
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
            nombre: `Ciclo ${newCycleNumber}`,
            materias: []
        };
        const newPrecios = { ...prevDetails.precioPorCiclo, [newCycleNumber]: 0 };
        return {
            ...prevDetails,
            ciclos: [...prevDetails.ciclos, newCycle],
            precioPorCiclo: newPrecios,
        };
    });
  };

  const handleRemoveCycle = (cycleNumber: number) => {
    if (!programDetails) return;
    setProgramDetails((prevDetails) => {
        if (!prevDetails) return null;
        const newPrecios = { ...prevDetails.precioPorCiclo };
        delete newPrecios[cycleNumber];
        return {
            ...prevDetails,
            ciclos: prevDetails.ciclos.filter((c) => c.numero !== cycleNumber),
            precioPorCiclo: newPrecios,
        };
    });
  };
  
  const openAddMateriaDialog = (cycleIndex: number) => {
    if (!programDetails) return;
    setCurrentCycleIndex(cycleIndex);
    setEditingMateria(null);
    setNewMateria({ nombre: "", codigo: "", creditos: 0 });
    setCurrentCycleCredits(programDetails.ciclos[cycleIndex].materias.reduce((acc, m) => acc + m.creditos, 0));
    setIsDialogOpen(true);
  };
  
  const openEditMateriaDialog = (materia: Materia, cycleIndex: number, materiaIndex: number) => {
    if (!programDetails) return;
      setEditingMateria({ materia, cycleIndex, materiaIndex });
      setNewMateria({ ...materia });
      const currentCredits = programDetails.ciclos[cycleIndex].materias.reduce((acc, m) => acc + m.creditos, 0);
      setCurrentCycleCredits(currentCredits - materia.creditos);
      setIsDialogOpen(true);
  };

  const handleSaveMateria = () => {
    if (!programDetails) return;

    // --- Validation 1: Unique Code ---
    const allCodes = programDetails.ciclos.flatMap(c => c.materias.map(m => m.codigo));
    const isCodeDuplicate = allCodes.some((code, index) => {
        const isCurrentMateria = editingMateria ? 
            programDetails.ciclos[editingMateria.cycleIndex].materias[editingMateria.materiaIndex].codigo === code : false;
        return code === newMateria.codigo && !isCurrentMateria;
    });
    
    if (newMateria.codigo && isCodeDuplicate) {
        toast({ variant: "destructive", title: "Código duplicado", description: "El código de materia ya está registrado. Ingrese un código único." });
        return;
    }

    // --- Validation 2: Credit Limit ---
    const finalCycleCredits = currentCycleCredits + (Number(newMateria.creditos) || 0);
    if (finalCycleCredits > 10) {
        toast({ variant: "destructive", title: "Límite de créditos excedido", description: "El ciclo solo puede tener un total de 10 créditos." });
        return;
    }

    const updatedCiclos = [...programDetails.ciclos];

    if (editingMateria) {
      const { cycleIndex, materiaIndex } = editingMateria;
      updatedCiclos[cycleIndex].materias[materiaIndex] = newMateria;
    } else if (currentCycleIndex !== null) {
      updatedCiclos[currentCycleIndex].materias.push({ ...newMateria, id: crypto.randomUUID() });
    }

    setProgramDetails({ ...programDetails, ciclos: updatedCiclos });
    setIsDialogOpen(false);
    setEditingMateria(null);
    setCurrentCycleIndex(null);
  };

  const handleRemoveMateria = (cycleIndex: number, materiaIndex: number) => {
    if (!programDetails) return;
    const updatedCiclos = [...programDetails.ciclos];
    updatedCiclos[cycleIndex].materias.splice(materiaIndex, 1);
    setProgramDetails({ ...programDetails, ciclos: updatedCiclos });
  };
  
   if (isLoading) {
    return (
        <div className="space-y-4 p-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-80 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <Skeleton className="h-64"/>
                <Skeleton className="h-64"/>
            </div>
            <Skeleton className="h-96 w-full mt-8"/>
        </div>
    );
   }

  if (!programDetails) {
    notFound();
    return null;
  }
  
  const breadcrumbs = [
    { name: "Carreras", href: "/dashboard/admin/career" },
    { name: truncateString(programDetails.nombre, 25), href: `/dashboard/admin/career/details/${careerId}` },
    { name: "Editar", href: `/dashboard/admin/career/edit/${careerId}` }
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={programDetails.nombre}
        description="Modifica los detalles de este programa académico."
        icon={<Edit className="h-8 w-8 text-primary" />}
        backPath="/dashboard/admin/career"
        breadcrumbs={breadcrumbs}
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
            <CardTitle>Plan de Estudios y Precios</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full" defaultValue="ciclo-1">
              {programDetails.ciclos.map((ciclo, cycleIndex) => {
                const totalCredits = ciclo.materias.reduce((sum, m) => sum + m.creditos, 0);
                return (
                <AccordionItem value={`ciclo-${ciclo.numero}`} key={ciclo.numero}>
                  <div className="flex items-center w-full">
                      <AccordionTrigger className="text-lg font-semibold hover:no-underline flex-grow">
                        <div className="flex items-center gap-2">
                           Ciclo {ciclo.numero}
                           {totalCredits !== 10 && (
                               <TooltipProvider>
                                   <Tooltip>
                                       <TooltipTrigger asChild>
                                          <AlertTriangle className="h-5 w-5 text-yellow-500"/>
                                       </TooltipTrigger>
                                       <TooltipContent>
                                           <p>Este ciclo tiene {totalCredits} créditos. Debe tener exactamente 10.</p>
                                       </TooltipContent>
                                   </Tooltip>
                               </TooltipProvider>
                           )}
                        </div>
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
                  <AccordionContent className="space-y-4">
                      <div>
                        <Label>Nombre del Ciclo</Label>
                        <Input 
                            value={ciclo.nombre || `Ciclo ${ciclo.numero}`} 
                            onChange={(e) => handleCycleNameChange(cycleIndex, e.target.value)}
                            placeholder="Ej: Fundamentación"
                        />
                      </div>
                      <h4 className="font-semibold mb-2">Materias</h4>
                      <ul className="space-y-3">
                        {ciclo.materias.map((materia, materiaIndex) => (
                          <li key={materia.id || materiaIndex} className="flex justify-between items-center text-gray-700 p-3 rounded-md bg-gray-50 border">
                            <div>
                                <span className="font-medium">{materia.nombre}</span>
                                <span className="text-sm text-muted-foreground ml-2">({materia.codigo || 'N/A'})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white bg-primary px-2 py-1 rounded-full">{materia.creditos} créditos</span>
                                <Button variant="outline" size="icon" className="h-8 w-8" type="button" onClick={() => openEditMateriaDialog(materia, cycleIndex, materiaIndex)}>
                                    <Edit className="h-4 w-4"/>
                                </Button>
                                <Button variant="destructive" size="icon" className="h-8 w-8" type="button" onClick={() => handleRemoveMateria(cycleIndex, materiaIndex)}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      
                      <Button variant="outline" type="button" onClick={() => openAddMateriaDialog(cycleIndex)}>
                          <Plus className="mr-2 h-4 w-4"/>
                          Agregar Materia
                      </Button>

                      <Separator className="my-6"/>

                      <div>
                           <h4 className="font-semibold mb-2">Precio del Ciclo</h4>
                           <div className="relative max-w-xs">
                              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              <Input 
                                  id={`price-${ciclo.numero}`}
                                  type="number"
                                  value={programDetails.precioPorCiclo[ciclo.numero] || ''}
                                  onChange={(e) => handlePriceChange(ciclo.numero, e.target.value)}
                                  placeholder="Ej: 3500000"
                                  className="pl-9"
                              />
                           </div>
                      </div>
                  </AccordionContent>
                </AccordionItem>
              )})}
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingMateria ? 'Editar Materia' : 'Agregar Nueva Materia'}</DialogTitle>
                  <DialogDescription>
                    Los cambios se reflejarán después de guardar la carrera.
                  </DialogDescription>
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
                <div className={cn(
                    "text-sm font-medium p-2 rounded-md",
                    (currentCycleCredits + (Number(newMateria.creditos) || 0)) > 10 ? "bg-red-100 text-red-800" :
                    (currentCycleCredits + (Number(newMateria.creditos) || 0)) === 10 ? "bg-green-100 text-green-800" :
                    "bg-blue-100 text-blue-800"
                )}>
                   Créditos actuales del ciclo: {currentCycleCredits + (Number(newMateria.creditos) || 0)} / 10
                </div>
              <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="button" onClick={handleSaveMateria} disabled={(currentCycleCredits + (Number(newMateria.creditos) || 0)) > 10}>Guardar Materia</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
