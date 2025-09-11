
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { FileText, Download, Users } from "lucide-react";
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
import { collection, getDocs } from "firebase/firestore";
import { generatePdfReport } from "@/lib/report-generator";

interface Career {
  id: string;
  nombre: string;
}

interface Group {
  id: string;
  codigoGrupo: string;
  idCarrera: string;
  idSede: string;
  sedeNombre?: string;
  estudiantes?: any[];
}

interface Sede {
    id: string;
    nombre: string;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState("");
  const [careerFilter, setCareerFilter] = useState("all");
  
  const [careers, setCareers] = useState<Career[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const fetchFiltersData = useCallback(async () => {
    setIsLoading(true);
    try {
      const careersSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
      setCareers(careersSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));

      const sedesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes"));
      const sedesData = sedesSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));
      setSedes(sedesData);
      const sedesMap = new Map(sedesData.map(s => [s.id, s.nombre]));

      const groupsSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"));
      setAllGroups(groupsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              codigoGrupo: data.codigoGrupo,
              idCarrera: data.idCarrera,
              idSede: data.idSede,
              sedeNombre: sedesMap.get(data.idSede) || "Sede Desconocida",
              estudiantes: data.estudiantes || []
          };
      }));

    } catch (error) {
      console.error("Error fetching filters data:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los filtros." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFiltersData();
  }, [fetchFiltersData]);

  const filteredGroups = useMemo(() => {
    if (careerFilter === 'all') {
      return [];
    }
    return allGroups.filter(group => group.idCarrera === careerFilter);
  }, [allGroups, careerFilter]);


  const handleGenerateReport = async (groupId: string = "all") => {
    if (!reportType) {
        toast({ variant: "destructive", title: "Selección requerida", description: "Por favor, selecciona un tipo de reporte." });
        return;
    }

    if (reportType === 'enrollment_list' && careerFilter === 'all' && groupId === 'all') {
        toast({ variant: "destructive", title: "Filtro Requerido", description: "Para el listado de alumnos, debes seleccionar una carrera." });
        return;
    }

    setIsGenerating(true);
    toast({ title: "Generando Reporte", description: "Tu reporte se está procesando y la descarga comenzará en breve." });
    
    try {
        const gestorName = localStorage.getItem('userEmail') || 'Gestor Académico';
        await generatePdfReport({
            reportType,
            careerId: careerFilter,
            groupId: groupId,
            generatedBy: gestorName,
            careers, 
            groups: allGroups
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card className="w-full">
            <CardHeader>
            <CardTitle>Configuración del Informe</CardTitle>
            <CardDescription>
                Selecciona el tipo de reporte y los filtros deseados.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="report-type">1. Tipo de Reporte</Label>
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

                <div className="space-y-2">
                    <Label htmlFor="filter-career">2. Filtrar por Carrera</Label>
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
            </CardContent>
             <CardFooter>
                 <Button onClick={() => handleGenerateReport()} disabled={isGenerating || !reportType || (reportType === 'enrollment_list' && careerFilter === 'all')}>
                    <Download className="mr-2 h-4 w-4" />
                    {isGenerating ? "Generando..." : "Generar Reporte General"}
                </Button>
            </CardFooter>
        </Card>
        
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Grupos Disponibles en la Carrera Seleccionada</h3>
            {careerFilter === 'all' ? (
                <p className="text-sm text-muted-foreground">Selecciona una carrera para ver los grupos disponibles.</p>
            ) : isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando grupos...</p>
            ) : filteredGroups.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredGroups.map(group => (
                        <Card key={group.id}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="font-semibold">{group.codigoGrupo}</p>
                                    <p className="text-xs text-muted-foreground">{group.sedeNombre}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                        <Users className="h-3 w-3" />
                                        <span>{group.estudiantes?.length || 0} Estudiantes</span>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleGenerateReport(group.id)} disabled={isGenerating}>
                                    <Download className="mr-2 h-4 w-4"/>
                                    Reporte
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">No se encontraron grupos para la carrera seleccionada.</p>
            )}
        </div>
      </div>
    </div>
  );
}

