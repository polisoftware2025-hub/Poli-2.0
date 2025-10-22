"use client";

import { PageHeader } from "@/components/page-header";
import { BarChart3, Users, TrendingUp, CheckCircle, BookCopy, Library } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { collection, getDocs } from "firebase/firestore";
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

interface ChartData {
    name: string;
    total: number;
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
  const [careerChartData, setCareerChartData] = useState<ChartData[]>([]);
  const [subjectChartData, setSubjectChartData] = useState<ChartData[]>([]);
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
                name: careersMap.get(careerId) || "Desconocida",
                Promedio: parseFloat((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2)),
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
                name: careersMap.get(careerId) || "Desconocida",
                Estudiantes: count,
            }));
            setDistributionData(distData);
            
            // New: Calculate Total Careers and Subjects for Charts
            const totalCareers = careersSnapshot.size;
            let totalSubjects = 0;
            careersSnapshot.forEach(doc => {
                const careerData = doc.data();
                if (careerData.ciclos && Array.isArray(careerData.ciclos)) {
                    careerData.ciclos.forEach((ciclo: any) => {
                        if (ciclo.materias && Array.isArray(ciclo.materias)) {
                            totalSubjects += ciclo.materias.length;
                        }
                    });
                }
            });

            setCareerChartData([{ name: "Carreras", total: totalCareers }]);
            setSubjectChartData([{ name: "Materias", total: totalSubjects }]);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Carrera</CardTitle>
            <CardDescription>Promedio de notas de los estudiantes por programa académico.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[350px] w-full" /> : (
                <ResponsiveContainer width="100%" height={350}>
                <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 5]} tickFormatter={(value) => `${value.toFixed(1)}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" />
                    <Bar dataKey="Promedio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

         <Card>
            <CardHeader>
            <CardTitle>Distribución de Estudiantes por Carrera</CardTitle>
            <CardDescription>
                Visualización del número de estudiantes inscritos en cada programa.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <Skeleton className="w-full h-[350px]" />
            ) : (
                <ResponsiveContainer width="100%" height={350}>
                <BarChart data={distributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
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

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Total de Carreras Registradas</CardTitle>
                    <CardDescription>Conteo total de programas académicos activos.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-[350px] w-full" /> : (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={careerChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                                <YAxis type="number" stroke="#888888" fontSize={12} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={80} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Total de Materias Registradas</CardTitle>
                    <CardDescription>Suma de todas las materias en todos los pensums.</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? <Skeleton className="h-[350px] w-full" /> : (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={subjectChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                                <YAxis type="number" stroke="#888888" fontSize={12} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={80} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
       </div>

    </div>
  );
}
