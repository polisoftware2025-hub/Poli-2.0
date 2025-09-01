
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { BookCopy, Plus, Search, MoreVertical, Edit, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const careers = [
  {
    id: "sistemas",
    slug: "ingenieria-de-sistemas",
    name: "Ingeniería de Sistemas",
    faculty: "Facultad de Ingenierías",
    students: 350,
    cycles: 9,
    status: "Activa",
  },
  {
    id: "admin",
    slug: "administracion-de-empresas",
    name: "Administración de Empresas",
    faculty: "Facultad de Ciencias Económicas",
    students: 420,
    cycles: 8,
    status: "Activa",
  },
  {
    id: "mercadeo",
    slug: "mercadeo-y-publicidad",
    name: "Mercadeo y Publicidad",
    faculty: "Facultad de Ciencias Económicas",
    students: 280,
    cycles: 8,
    status: "Activa",
  },
  {
    id: "contaduria",
    slug: "contaduria-publica",
    name: "Contaduría Pública",
    faculty: "Facultad de Ciencias Económicas",
    students: 310,
    cycles: 8,
    status: "En revisión",
  },
  {
    id: "gastronomia",
    slug: "gastronomia",
    name: "Gastronomía",
    faculty: "Facultad de Hospitalidad y Turismo",
    students: 150,
    cycles: 6,
    status: "Activa",
  },
  {
    id: "psicologia",
    slug: "psicologia",
    name: "Psicología",
    faculty: "Facultad de Ciencias Sociales",
    students: 220,
    cycles: 9,
    status: "Inactiva",
  },
];

export default function CareerAdminPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de Carreras"
        description="Administra los programas académicos de la institución."
        icon={<BookCopy className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Programas Académicos</CardTitle>
          <CardDescription>
            Visualiza, crea y edita las carreras ofrecidas por la institución.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Buscar por nombre de carrera..." className="pl-9" />
            </div>
            <Button asChild>
                <Link href="/dashboard/admin/career/new-career">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Carrera
                </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {careers.map((career) => (
                <Card key={career.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-lg">{career.name}</CardTitle>
                                <CardDescription>{career.faculty}</CardDescription>
                             </div>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/admin/career/${career.slug}`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/admin/career/pensum/${career.slug}`}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Ver Pensum
                                    </Link>
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Estudiantes:</span>
                            <span className="font-semibold">{career.students}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Ciclos:</span>
                            <span className="font-semibold">{career.cycles}</span>
                        </div>
                    </CardContent>
                     <CardFooter>
                         <Badge variant={
                            career.status === "Activa" ? "secondary" : 
                            career.status === "En revisión" ? "outline" : "destructive"
                         }
                          className={
                            career.status === "Activa" ? "bg-green-100 text-green-800" :
                            career.status === "En revisión" ? "bg-yellow-100 text-yellow-800" : ""
                          }>
                            {career.status}
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
