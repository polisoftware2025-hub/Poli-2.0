
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { generatePdfReport } from "@/lib/report-generator";

interface Career {
  id: string;
  nombre: string;
}

interface Group {
  id: string;
  codigoGrupo: string;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState("");
  const [careerFilter, setCareerFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [format, setFormat] = useState("pdf");

  const [careers, setCareers] = useState<Career[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFiltersData = async () => {
      setIsLoading(true);
      try {
        const careersSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
        setCareers(careersSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));

        const groupsSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"));
        setGroups(groupsSnapshot.docs.map(doc => ({ id: doc.id, codigoGrupo: doc.data().codigoGrupo })));
      } catch (error) {
        console.error("Error fetching filters data:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los filtros." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiltersData();
  }, [toast]);

  const handleGenerateReport = async () => {
    if (!reportType) {
        toast({ variant: "destructive", title: "Selección requerida", description: "Por favor, selecciona un tipo de reporte." });
        return;
    }

    if (reportType === 'enrollment_list' && careerFilter === 'all') {
        toast({ variant: "destructive", title: "Filtro Requerido", description: "Para este reporte, es obligatorio seleccionar una carrera." });
        return;
    }

    setIsGenerating(true);
    toast({ title: "Generando Reporte", description: "Tu reporte se está procesando y la descarga comenzará en breve." });
    
    try {
        const gestorName = localStorage.getItem('userEmail') || 'Gestor Académico';
        await generatePdfReport({
            reportType,
            careerId: careerFilter,
            groupId: groupFilter,
            generatedBy: gestorName,
            careers, 
            groups 
        });
    } catch (error) {
        console.error("Error generating report: ", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo generar el reporte." });
    } finally {
        setIsGenerating(false);
    }
  };

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
                <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger id="report-type">
                        <SelectValue placeholder="Seleccionar tipo de reporte..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="academic_performance">Rendimiento Académico por Carrera</SelectItem>
                        <SelectItem value="enrollment_list">Listado de Alumnos Matriculados</SelectItem>
                        <SelectItem value="dropout_report">Reporte de Deserción Escolar</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="filter-career">Filtrar por Carrera</Label>
                    <Select value={careerFilter} onValueChange={setCareerFilter} disabled={isLoading}>
                        <SelectTrigger id="filter-career">
                            <SelectValue placeholder="Todas las carreras" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">Todas las carreras</SelectItem>
                             {careers.map(career => (
                                 <SelectItem key={career.id} value={career.id}>{career.nombre}</SelectItem>
                             ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="filter-group">Filtrar por Grupo</Label>
                    <Select value={groupFilter} onValueChange={setGroupFilter} disabled={isLoading}>
                        <SelectTrigger id="filter-group">
                            <SelectValue placeholder="Todos los grupos" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">Todos los grupos</SelectItem>
                             {groups.map(group => (
                                 <SelectItem key={group.id} value={group.id}>{group.codigoGrupo}</SelectItem>
                             ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="format">Formato de Exportación</Label>
                <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger id="format">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                        <SelectItem value="csv" disabled>CSV (Próximamente)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
        </CardContent>
        <CardFooter className="flex justify-end pt-4">
             <Button onClick={handleGenerateReport} disabled={isGenerating}>
                <Download className="mr-2 h-4 w-4" />
                {isGenerating ? "Generando..." : "Generar Reporte"}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
