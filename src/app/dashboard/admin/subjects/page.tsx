"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { BookMarked, Plus, Search, Filter, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const subjects = [
  {
    id: "mat-101",
    name: "Cálculo Diferencial",
    code: "MAT-101",
    credits: 3,
    program: "Ingeniería de Sistemas",
    status: "Activa",
  },
  {
    id: "bd-201",
    name: "Bases de Datos",
    code: "BD-201",
    credits: 4,
    program: "Ingeniería de Sistemas",
    status: "Activa",
  },
  {
    id: "mkt-301",
    name: "Fundamentos de Mercadeo",
    code: "MKT-301",
    credits: 3,
    program: "Mercadeo y Publicidad",
    status: "Activa",
  },
  {
    id: "cont-101",
    name: "Contabilidad General",
    code: "CONT-101",
    credits: 3,
    program: "Contaduría Pública",
    status: "Inactiva",
  },
  {
    id: "adm-101",
    name: "Introducción a la Administración",
    code: "ADM-101",
    credits: 2,
    program: "Administración de Empresas",
    status: "Activa",
  },
  {
    id: "psi-101",
    name: "Psicología del Desarrollo",
    code: "PSI-101",
    credits: 3,
    program: "Psicología",
    status: "Activa",
  },
];


export default function SubjectsAdminPage() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de Materias"
        description="Administra el catálogo de materias de la institución."
        icon={<BookMarked className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Materias</CardTitle>
          <CardDescription>
            Visualiza, crea, edita y elimina las materias ofrecidas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Buscar por nombre o código..." className="pl-9" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-56">
                 <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por carrera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Carreras</SelectItem>
                <SelectItem value="sistemas">Ingeniería de Sistemas</SelectItem>
                <SelectItem value="mercadeo">Mercadeo y Publicidad</SelectItem>
                <SelectItem value="contaduria">Contaduría Pública</SelectItem>
              </SelectContent>
            </Select>
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Materia
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
                <Card key={subject.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <CardTitle className="text-lg">{subject.name}</CardTitle>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <CardDescription>{subject.program}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Código:</span>
                            <span className="font-mono text-xs p-1 bg-muted rounded-md">{subject.code}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Créditos:</span>
                            <span className="font-semibold">{subject.credits}</span>
                        </div>
                    </CardContent>
                     <CardFooter>
                         <Badge variant={subject.status === "Activa" ? "secondary" : "outline"}
                          className={subject.status === "Activa" ? "bg-green-100 text-green-800" : ""}>
                            {subject.status}
                         </Badge>
                    </CardFooter>
                </Card>
            ))}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}