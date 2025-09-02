
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, User, CheckCircle, GraduationCap, DollarSign, Clock, Award, Plus, Trash2, Edit, Upload } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialProgram = {
    nombre: "",
    slug: "",
    descripcionGeneral: "",
    perfilProfesional: "",
    imagenURL: "https://placehold.co/800x400/002147/FFFFFF?text=Nueva+Carrera",
    duracionCiclo: "",
    modalidad: "Presencial / Virtual",
    inversion: 0,
    titulo: "",
    ciclos: [
      { numero: 1, materias: [] }
    ]
};

export default function NewProgramPage() {
  const [programDetails, setProgramDetails] = useState(initialProgram);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProgramDetails(prev => ({ ...prev, [id]: value }));
  };
  
  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleAddCycle = () => {
    setProgramDetails((prevDetails) => {
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
    setProgramDetails((prevDetails) => ({
        ...prevDetails,
        ciclos: prevDetails.ciclos.filter((c) => c.numero !== cycleNumber)
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);

      if (!programDetails.nombre) {
        toast({ variant: "destructive", title: "Error", description: "El nombre de la carrera es obligatorio." });
        setIsLoading(false);
        return;
      }
      
      const slug = createSlug(programDetails.nombre);

      try {
          const careersCollection = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
          await addDoc(careersCollection, { ...programDetails, slug });
          toast({ title: "Éxito", description: "La carrera ha sido creada correctamente." });
          router.push("/dashboard/admin/career");
      } catch (error) {
          console.error("Error creating career: ", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudo crear la carrera." });
      } finally {
          setIsLoading(false);
      }
  };


  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <PageHeader
        title="Crear Nueva Carrera"
        description="Completa los detalles para agregar un nuevo programa académico."
        icon={<Plus className="h-8 w-8 text-primary" />}
        backPath="/dashboard/admin/career"
      />

      <Card className="overflow-hidden">
        <div className="relative h-64 w-full">
          <Image
            src={programDetails.imagenURL}
            alt={`Imagen de ${programDetails.nombre || "Nueva Carrera"}`}
            fill
            style={{ objectFit: "cover" }}
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Label htmlFor="image-upload" className="cursor-pointer">
                <Button variant="secondary" type="button" asChild>
                    <span>
                        <Upload className="mr-2 h-4 w-4"/>
                        Subir Imagen
                    </span>
                </Button>
            </Label>
            <Input id="image-upload" type="file" className="hidden" accept="image/*" />
          </div>
        </div>
        <CardContent className="p-6 space-y-4">
            <div>
                <Label htmlFor="nombre">Nombre de la Carrera</Label>
                <Input id="nombre" value={programDetails.nombre} onChange={handleChange} placeholder="Ej: Ingeniería de Software"/>
            </div>
            <div>
                <Label htmlFor="descripcionGeneral">Descripción General</Label>
                <Textarea id="descripcionGeneral" value={programDetails.descripcionGeneral} onChange={handleChange} placeholder="Describe el programa en general..." rows={5}/>
            </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <CardTitle>Perfil Profesional</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea id="perfilProfesional" value={programDetails.perfilProfesional} onChange={handleChange} placeholder="Describe el perfil del egresado..." rows={8}/>
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
                    <Input id="inversion" type="number" value={programDetails.inversion} onChange={(e) => setProgramDetails(p => ({...p, inversion: parseInt(e.target.value)}))} placeholder="Ej: 3500000" />
                </div>
                 <div>
                    <Label htmlFor="duracionCiclo">Duración (Ciclos)</Label>
                    <Input id="duracionCiclo" value={programDetails.duracionCiclo} onChange={handleChange} placeholder="Ej: 9"/>
                </div>
            </div>
             <div>
                <Label htmlFor="titulo">Título Otorgado</Label>
                <Input id="titulo" value={programDetails.titulo} onChange={handleChange} placeholder="Ej: Ingeniero de Software" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan de Estudios (Pensum)</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full" defaultValue="ciclo-1">
            {programDetails.ciclos.map((ciclo: any) => (
              <AccordionItem value={`ciclo-${ciclo.numero}`} key={ciclo.numero}>
                <div className="flex items-center w-full">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline flex-grow">
                        Ciclo {ciclo.numero}
                    </AccordionTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCycle(ciclo.numero);
                      }}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                <AccordionContent>
                  <ul className="space-y-3 pt-2">
                    {ciclo.materias.map((materia: any) => (
                      <li key={materia.codigo || materia.nombre} className="flex justify-between items-center text-gray-700 p-2 rounded-md hover:bg-gray-100">
                        <div className="flex-grow">
                            <span>{materia.nombre}</span>
                            <span className="text-sm font-medium text-white bg-primary px-2 py-1 rounded-full ml-2">{materia.creditos} créditos</span>
                        </div>
                        <Button variant="destructive" size="icon" className="h-8 w-8" type="button"><Trash2 className="h-4 w-4"/></Button>
                      </li>
                    ))}
                  </ul>
                  <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="mt-4" type="button">
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
                                <Input id="subjectName" placeholder="Ej: Cálculo Integral"/>
                            </div>
                             <div>
                                <Label htmlFor="subjectCode">Código</Label>
                                <Input id="subjectCode" placeholder="Ej: MAT-102"/>
                            </div>
                             <div>
                                <Label htmlFor="subjectCredits">Créditos</Label>
                                <Input id="subjectCredits" type="number" placeholder="Ej: 3"/>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button">Cancelar</Button>
                            <Button type="button">Guardar Materia</Button>
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
      
      <Card>
        <CardFooter className="p-6 bg-gray-50 rounded-b-xl border-t flex justify-end gap-4">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/admin/career">Cancelar</Link>
            </Button>
             <Button type="submit" disabled={isLoading}>{isLoading ? "Creando..." : "Crear Carrera"}</Button>
        </CardFooter>
      </Card>

    </form>
  );
}
