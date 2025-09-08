
"use client";

import { PageHeader } from "@/components/page-header";
import { BarChart3, Users, TrendingDown, BookCheck, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

const performanceData = [
  { program: "Sistemas", average: 4.1 },
  { program: "Admin", average: 3.8 },
  { program: "Mercadeo", average: 4.3 },
  { program: "Contaduría", average: 3.5 },
  { program: "Gastronomía", average: 4.5 },
];

interface CareerStudentData {
    name: string;
    students: number;
}

const staticCareerData: CareerStudentData[] = [
    { name: "Tecnología", students: 50 },
    { name: "Medicina", students: 100 },
    { name: "Salud", students: 150 },
    { name: "Cocina", students: 200 },
    { name: "Diseño", students: 250 },
];


export default function AnalyticsPage() {
  const [careerData, setCareerData] = useState<CareerStudentData[]>(staticCareerData);
  const [isLoading, setIsLoading] = useState(false); // Set to false as we are using static data now


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Analíticas y Reportes"
        description="Visualiza datos clave sobre el rendimiento y uso de la plataforma."
        icon={<BarChart3 className="h-8 w-8 text-primary" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,482</div>
            <p className="text-xs text-muted-foreground">+2.5% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Deserción</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">8.5%</div>
            <p className="text-xs text-muted-foreground">Tasa promedio del último ciclo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
            <BookCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">3.9 / 5.0</div>
            <p className="text-xs text-muted-foreground">Promedio de todos los estudiantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sesiones Activas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">152</div>
            <p className="text-xs text-muted-foreground">Usuarios conectados ahora</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Rendimiento por Carrera</CardTitle>
            <CardDescription>Promedio de notas de los estudiantes por programa académico.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={performanceData}>
                <XAxis dataKey="program" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                    }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="average" name="Promedio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
           <CardHeader>
            <CardTitle>Generador de Reportes</CardTitle>
            <CardDescription>Selecciona un tipo de reporte para exportar los datos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Reporte</label>
                 <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="usage">Uso de Salones</SelectItem>
                        <SelectItem value="teacher-eval">Evaluación Docente</SelectItem>
                        <SelectItem value="student-grades">Notas por Estudiante</SelectItem>
                        <SelectItem value="dropout-rate">Tasa de Deserción por Carrera</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Formato</label>
                 <Select defaultValue="pdf">
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV (Excel)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button className="w-full">
                <Download className="mr-2 h-4 w-4"/>
                Generar Reporte
            </Button>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Distribución de Estudiantes por Carrera</CardTitle>
          <CardDescription>
            Visualización del número de estudiantes inscritos en cada programa académico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <Skeleton className="w-full h-[350px]" />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={careerData.map(item => ({ ...item, name: item.name.substring(0,10) + (item.name.length > 10 ? "." : "") }))}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} interval={0} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                      contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                      }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="students" name="Estudiantes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
