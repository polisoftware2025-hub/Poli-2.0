
"use client";

import { PageHeader } from "@/components/page-header";
import { BarChart3, Users, TrendingUp, CheckCircle, Download, BookCopy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  CartesianGrid,
} from "recharts";
import { useEffect, useState }from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, DocumentData } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    icon: React.ElementType;
    color?: string;
}

interface PerformanceData {
    name: string;
    Promedio: number;
}

interface DistributionData {
    name: string;
    Estudiantes: number;
}

const StatCard = ({ title, value, description, icon: Icon, color }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color || ""}`}>{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {label}
            </span>
            <span className="font-bold text-muted-foreground">
              {payload[0].name}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Valor
            </span>
            <span className="font-bold">
              {payload[0].value}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};


export default function AnalyticsPage() {
  const [stats, setStats] = useState({
      totalUsers: 0,
      totalStudents: 0,
      averageGrade: "0.0",
      approvalRate: "0%",
  });
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [distributionData, setDistributionData] = useState<DistributionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const usersSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios"));
            const studentsSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes"));
            const careersSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
            const notesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/notas"));
            
            const careersMap = new Map(careersSnapshot.docs.map(doc => [doc.id, doc.data().nombre]));
            const studentsMap = new Map(studentsSnapshot.docs.map(doc => [doc.id, doc.data()]));

            // Calculate Stats
            const totalUsers = usersSnapshot.size;
            const totalStudents = studentsSnapshot.docs.filter(doc => doc.data().estado === 'aprobado').length;
            const notes = notesSnapshot.docs.map(doc => doc.data().nota);
            const averageGrade = notes.length ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(2) : "0.0";
            const approvedNotes = notes.filter(n => n >= 3.0).length;
            const approvalRate = notes.length ? `${((approvedNotes / notes.length) * 100).toFixed(0)}%` : "0%";
            
            setStats({ totalUsers, totalStudents, averageGrade, approvalRate });

            // Calculate Performance Data
            const gradesByCareer: { [key: string]: number[] } = {};
            notesSnapshot.forEach(doc => {
                const note = doc.data();
                const student = studentsMap.get(note.estudianteId);
                if (student && student.carreraId) {
                    if (!gradesByCareer[student.carreraId]) {
                        gradesByCareer[student.carreraId] = [];
                    }
                    gradesByCareer[student.carreraId].push(note.nota);
                }
            });
            
            const perfData = Object.entries(gradesByCareer).map(([careerId, grades]) => ({
                name: (careersMap.get(careerId) || "Desconocida").substring(0, 10) + ".",
                Promedio: grades.reduce((a, b) => a + b, 0) / grades.length,
            }));
            setPerformanceData(perfData);

            // Calculate Distribution Data
            const studentsByCareer: { [key: string]: number } = {};
            studentsMap.forEach(student => {
                 if (student.estado === 'aprobado' && student.carreraId) {
                    studentsByCareer[student.carreraId] = (studentsByCareer[student.carreraId] || 0) + 1;
                }
            });
            const distData = Object.entries(studentsByCareer).map(([careerId, count]) => ({
                name: (careersMap.get(careerId) || "Desconocida").substring(0, 10) + ".",
                Estudiantes: count,
            }));
            setDistributionData(distData);

        } catch (error) {
            console.error("Error fetching analytics data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Analíticas y Reportes"
        description="Visualiza datos clave sobre el rendimiento y uso de la plataforma."
        icon={<BarChart3 className="h-8 w-8 text-primary" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
            <>
                <StatCard title="Total de Usuarios" value={stats.totalUsers.toString()} description="Todos los roles registrados" icon={Users} />
                <StatCard title="Estudiantes Activos" value={stats.totalStudents.toString()} description="Estudiantes con estado aprobado" icon={BookCopy} />
                <StatCard title="Promedio General" value={stats.averageGrade} description="Nota promedio de todas las materias" icon={TrendingUp} color="text-blue-600" />
                <StatCard title="Tasa de Aprobación" value={stats.approvalRate} description="% de notas >= 3.0" icon={CheckCircle} color="text-green-600" />
            </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Rendimiento por Carrera</CardTitle>
            <CardDescription>Promedio de notas de los estudiantes por programa académico.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[350px] w-full" /> : (
                <ResponsiveContainer width="100%" height={350}>
                <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 5]} tickFormatter={(value) => `${value}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" />
                    <Bar dataKey="Promedio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            )}
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
              <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} interval={0} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" />
                  <Bar dataKey="Estudiantes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );

    