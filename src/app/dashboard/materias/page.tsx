
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BookCopy, Search, MoreVertical, LayoutGrid, List } from "lucide-react";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";

const coursesData = [
  {
    title: "PRUEBAS Y MANTENIMIENTO DE SOFTWARE",
    code: "SOFD1-9TI_2025-3T",
    progress: 7,
    image: "https://placehold.co/600x400/002147/FFFFFF?text=P",
    imageHint: "abstract pattern",
  },
  {
    title: "LENGUAJES DE PROGRAMACION PARA APLICACIONES",
    code: "APPMOV-8TI_2025-3T",
    progress: 10,
    image: "https://placehold.co/600x400/00346e/FFFFFF?text=L",
    imageHint: "abstract waves",
  },
  {
    title: "INTELIGENCIA ARTIFICIAL",
    code: "INAR1-1422_SOFD1-9TI_2025-3T",
    progress: 0,
    image: "https://placehold.co/600x400/004aad/FFFFFF?text=I",
    imageHint: "abstract circles",
  },
  {
    title: "CONTABILIDAD BASICA",
    code: "COBA-0956_UVRD2-3TI_2025-3T",
    progress: 40,
    image: "https://placehold.co/600x400/1b5fa5/FFFFFF?text=C",
    imageHint: "abstract geometric",
  },
  {
    title: "CALCULO DIFERENCIAL",
    code: "CADI-1122_UVRD2-1TI_2025-3T",
    progress: 85,
    image: "https://placehold.co/600x400/3a75c4/FFFFFF?text=C",
    imageHint: "mathematics equations",
  },
  {
    title: "BASE DE DATOS",
    code: "BADA-5231_SOFD1-4TI_2025-3T",
    progress: 25,
    image: "https://placehold.co/600x400/588fd0/FFFFFF?text=B",
    imageHint: "database servers",
  },
];

export default function CoursesPage() {
  const [view, setView] = useState("grid");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mis Cursos"
        description="Gestiona y accede a todas tus materias inscritas."
        icon={<BookCopy className="h-8 w-8 text-primary" />}
      />
      
      <Card>
        <CardContent className="p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">Vista general de curso</h2>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-auto">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="inprogress">En progreso</SelectItem>
                <SelectItem value="future">Futuros</SelectItem>
                <SelectItem value="past">Pasados</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Buscar..." className="pl-9" />
            </div>

            <Select defaultValue="last-accessed">
              <SelectTrigger className="w-full md:w-auto">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-accessed">Ordenar por último acceso</SelectItem>
                <SelectItem value="name-asc">Ordenar por nombre (A-Z)</SelectItem>
                <SelectItem value="name-desc">Ordenar por nombre (Z-A)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-md border bg-gray-100 p-1">
                <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')}>
                    <LayoutGrid className="h-5 w-5"/>
                </Button>
                 <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')}>
                    <List className="h-5 w-5"/>
                </Button>
            </div>
          </div>
          
          <div className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {coursesData.map((course, index) => (
                <Card key={index} className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5">
                   <div className="relative h-48 w-full">
                       <Image 
                           src={course.image}
                           alt={`Imagen de ${course.title}`}
                           fill
                           style={{objectFit: 'cover'}}
                           className="transition-transform duration-500 group-hover:scale-105"
                           data-ai-hint={course.imageHint}
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                       <div className="absolute bottom-2 left-4 text-white">
                           <span className="text-sm font-semibold">{course.progress}% completado</span>
                       </div>
                   </div>
                   <CardContent className="flex flex-1 flex-col justify-between p-4">
                       <div>
                           <h3 className="font-semibold text-base leading-tight mb-1 truncate" title={course.title}>
                               {course.title}
                           </h3>
                           <p className="text-xs text-muted-foreground">{course.code}</p>
                       </div>
                       <div className="mt-4">
                           <Progress value={course.progress} className="h-2"/>
                       </div>
                   </CardContent>
                   <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 bg-black/20 text-white hover:bg-black/40 hover:text-white">
                                <MoreVertical className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                            <DropdownMenuItem>Ir al curso</DropdownMenuItem>
                            <DropdownMenuItem>Contactar docente</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Card>
            ))}
          </div>

           <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Mostrar</span>
                    <Select defaultValue="12">
                        <SelectTrigger className="w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="12">12</SelectItem>
                            <SelectItem value="24">24</SelectItem>
                            <SelectItem value="48">48</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {/* Pagination can be added here */}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}

    