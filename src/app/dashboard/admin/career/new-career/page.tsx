
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
    modalidad: "",
    inversion: 0,
    titulo: "",
    ciclos: [
      { numero: 1, materias: [] }
    ]
};

export default function NewProgramPage() {
  const [programDetails, setProgramDetails] = useState(initialProgram);

  const handleAddCycle = () => {
    setProgramDetails((prevDetails: any) => {
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

  return (
    <form className="flex flex-col gap-8">
      <PageHeader
        title="Crear Nueva Carrera"
        description="Completa los detalles para agregar un nuevo programa académico."
        icon={<Plus className="h-8 w-8 text-primary" />}
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
                <Label htmlFor="programName">Nombre de la Carrera</Label>
                <Input id="programName" placeholder="Ej: Ingeniería de Software"/>
            </div>
            <div>
                <Label htmlFor="programDescription">Descripción General</Label>
                <Textarea id="programDescription" placeholder="Describe el programa en general..." rows={5}/>
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
            <Textarea placeholder="Describe el perfil del egresado..." rows={8}/>
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
                    <Label htmlFor="investment">Inversión por ciclo</Label>
                    <Input id="investment" type="number" placeholder="Ej: 3500000" />
                </div>
                 <div>
                    <Label htmlFor="duration">Duración (Ciclos)</Label>
                    <Input id="duration" placeholder="Ej: 9"/>
                </div>
            </div>
             <div>
                <Label htmlFor="degreeTitle">Título Otorgado</Label>
                <Input id="degreeTitle" placeholder="Ej: Ingeniero de Software" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-gray-700">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  <span>Créditos Totales:</span>
              </div>
              <span className="text-gray-800 font-bold">
                {programDetails.ciclos.reduce((totalCreds: number, ciclo: any) => 
                    totalCreds + ciclo.materias.reduce((cycleCreds: number, materia: any) => cycleCreds + materia.creditos, 0), 0)
                }
              </span>
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
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">Ciclo {ciclo.numero}</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3 pt-2">
                    {ciclo.materias.map((materia: any) => (
                      <li key={materia.codigo || materia.nombre} className="flex justify-between items-center text-gray-700 p-2 rounded-md hover:bg-gray-100">
                        <div className="flex-grow">
                            <span>{materia.nombre}</span>
                            <span className="text-sm font-medium text-white bg-primary px-2 py-1 rounded-full ml-2">{materia.creditos} créditos</span>
                        </div>
                        <div className="flex gap-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8"><Edit className="h-4 w-4"/></Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Editar Materia</DialogTitle>
                                        <DialogDescription>Modifica los datos de la materia.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div>
                                            <Label htmlFor="editSubjectName">Nombre de la Materia</Label>
                                            <Input id="editSubjectName" defaultValue={materia.nombre}/>
                                        </div>
                                        <div>
                                            <Label htmlFor="editSubjectCode">Código</Label>
                                            <Input id="editSubjectCode" defaultValue={materia.codigo || "N/A"}/>
                                        </div>
                                        <div>
                                            <Label htmlFor="editSubjectCredits">Créditos</Label>
                                            <Input id="editSubjectCredits" type="number" defaultValue={materia.creditos}/>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" type="button">Cancelar</Button>
                                        <Button type="button">Guardar Cambios</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button variant="destructive" size="icon" className="h-8 w-8" type="button"><Trash2 className="h-4 w-4"/></Button>
                        </div>
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
                            <DialogDescription>Completa los datos de la nueva materia.</DialogDescription>
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
             <Button type="button" variant="outline">Cancelar</Button>
             <Button type="submit">Crear Carrera</Button>
        </CardFooter>
      </Card>

    </form>
  );
}
