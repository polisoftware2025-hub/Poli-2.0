"use client";

import { PageHeader } from "@/components/page-header";
import { FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";


export default function ReportsPage() {

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Generación de Reportes Académicos"
        description="Crea y exporta informes para facilitar la toma de decisiones."
        icon={<FileText className="h-8 w-8 text-primary" />}
      />

      <Card className="max-w-2xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Generador de Informes</CardTitle>
          <CardDescription>
            Selecciona el tipo de reporte, los filtros y el formato deseado para la exportación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="report-type">Tipo de Reporte</Label>
                <Select>
                    <SelectTrigger id="report-type">
                        <SelectValue placeholder="Seleccionar tipo de reporte..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="performance">Rendimiento Académico</SelectItem>
                        <SelectItem value="enrollment">Listado de Alumnos Matriculados</SelectItem>
                        <SelectItem value="dropout">Reporte de Deserción Escolar</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="filter-career">Filtrar por Carrera</Label>
                    <Select>
                        <SelectTrigger id="filter-career">
                            <SelectValue placeholder="Todas las carreras" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">Todas las carreras</SelectItem>
                             <SelectItem value="sistemas">Ingeniería de Sistemas</SelectItem>
                             <SelectItem value="admin">Administración de Empresas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="filter-group">Filtrar por Grupo</Label>
                    <Select>
                        <SelectTrigger id="filter-group">
                            <SelectValue placeholder="Todos los grupos" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">Todos los grupos</SelectItem>
                             <SelectItem value="cd-001">CD-001</SelectItem>
                             <SelectItem value="bd-002">BD-002</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="format">Formato de Exportación</Label>
                <Select defaultValue="pdf">
                    <SelectTrigger id="format">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                        <SelectItem value="csv">CSV (Compatible con Excel)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <div className="flex justify-end pt-4">
                <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Generar Reporte
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
