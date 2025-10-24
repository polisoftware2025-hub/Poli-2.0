
"use client";

import { useState, useEffect } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { 
    BookCopy, 
    Users, 
    ClipboardCheck, 
    UserCheck, 
    Plus, 
    FileText, 
    Search, 
    Upload,
    Video,
    Link as LinkIcon,
    Calendar,
    Star,
    BarChart,
    Filter,
    FileDown
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

// --- Mock Data ---
const courseDetails = {
    subjectName: "Bases de Datos Avanzadas",
    groupCode: "BD-C4-001",
    cycle: 4,
    modality: "Presencial",
    sede: "Sede Norte",
    studentCount: 28,
    activityCount: 5,
    averageGrade: 3.8
};

const students = [
    { id: "st001", name: "Laura Gómez", code: "2021102001", status: "activo", attendance: 95, average: 4.2 },
    { id: "st002", name: "David Martínez", code: "2021102002", status: "activo", attendance: 88, average: 3.5 },
    { id: "st003", name: "Ana Pérez", code: "2021102003", status: "inactivo", attendance: 75, average: 2.8 },
];

const activities = [
    { id: 'act01', title: 'Taller de Normalización', dueDate: '2024-09-15', status: 'Cerrada', submissions: 27 },
    { id: 'act02', title: 'Parcial 1', dueDate: '2024-09-22', status: 'Cerrada', submissions: 28 },
    { id: 'act03', title: 'Proyecto: Modelo E-R', dueDate: '2024-10-10', status: 'Activa', submissions: 15 },
];

const materials = [
    { id: 'mat01', title: 'Guía de Normalización', type: 'pdf', uploadDate: '2024-08-10' },
    { id: 'mat02', title: 'Vídeo: Índices en SQL', type: 'video', uploadDate: '2024-08-15' },
    { id: 'mat03', title: 'Artículo: ACID vs BASE', type: 'link', uploadDate: '2024-08-20' },
];

const resourceIcons: { [key: string]: React.ElementType } = {
    pdf: FileText,
    video: Video,
    link: LinkIcon
};

// --- Sub-components for each Tab ---

const StudentsTab = () => (
    <Card>
        <CardHeader>
            <CardTitle>Estudiantes Inscritos</CardTitle>
            <div className="flex justify-between items-center">
                <CardDescription>{students.length} estudiantes en este grupo.</CardDescription>
                <div className="flex gap-2">
                    <Input placeholder="Buscar estudiante..." className="w-64"/>
                    <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/>Exportar Lista</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>% Asistencia</TableHead>
                        <TableHead>Promedio</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map(student => (
                        <TableRow key={student.id}>
                            <TableCell className="font-medium flex items-center gap-3">
                                <Avatar><AvatarFallback>{student.name.substring(0,2)}</AvatarFallback></Avatar>
                                {student.name}
                            </TableCell>
                            <TableCell>{student.code}</TableCell>
                            <TableCell>
                                <Badge variant={student.status === 'activo' ? 'secondary' : 'destructive'} className={student.status === 'activo' ? 'bg-green-100 text-green-800' : ''}>
                                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Progress value={student.attendance} className="w-24 h-2"/>
                                    <span>{student.attendance}%</span>
                                </div>
                            </TableCell>
                            <TableCell>
                               <Badge className={student.average >= 3.0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                                   {student.average.toFixed(1)}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

const ActivitiesTab = () => (
    <div className="space-y-6">
        <div className="flex justify-end">
            <Dialog>
                <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" /> Crear Nueva Actividad</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva Actividad/Evaluación</DialogTitle>
                        <DialogDescription>Completa los detalles de la nueva actividad.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Form fields for new activity */}
                        <div className="space-y-2"><Label>Título</Label><Input placeholder="Ej: Parcial Final"/></div>
                        <div className="space-y-2"><Label>Descripción</Label><Textarea placeholder="Detalles sobre la actividad..."/></div>
                        <div className="space-y-2"><Label>Fecha de Entrega</Label><Input type="date"/></div>
                        <div className="space-y-2"><Label>Tipo</Label><Select><SelectTrigger><SelectValue placeholder="Seleccionar tipo..."/></SelectTrigger><SelectContent><SelectItem value="tarea">Tarea</SelectItem><SelectItem value="examen">Examen</SelectItem><SelectItem value="proyecto">Proyecto</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Valor (%)</Label><Input type="number" placeholder="Ej: 25"/></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline">Cancelar</Button>
                        <Button>Crear Actividad</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map(activity => (
                <Card key={activity.id} className="hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle>{activity.title}</CardTitle>
                        <CardDescription>Entrega: {activity.dueDate}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center">
                            <Badge variant={activity.status === 'Activa' ? 'default' : 'secondary'}>{activity.status}</Badge>
                            <div className="text-right">
                                <p className="font-bold text-lg">{activity.submissions}</p>
                                <p className="text-xs text-muted-foreground">Entregas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);

const AttendanceTab = () => (
    <Card>
        <CardHeader>
            <CardTitle>Toma de Asistencia - {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}</CardTitle>
            <div className="flex justify-between items-center">
                <CardDescription>Marca el estado de cada estudiante para la clase de hoy.</CardDescription>
                <Button variant="outline" size="sm">Marcar todos como presentes</Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Estudiante</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map(student => (
                        <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>
                                <RadioGroup defaultValue="presente" className="flex justify-center gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="presente" id={`p-${student.id}`}/><Label htmlFor={`p-${student.id}`}>✅ Presente</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="ausente" id={`a-${student.id}`}/><Label htmlFor={`a-${student.id}`}>❌ Ausente</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="tarde" id={`t-${student.id}`}/><Label htmlFor={`t-${student.id}`}>⏰ Tarde</Label></div>
                                </RadioGroup>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="flex justify-end mt-6">
                <Button size="lg">Guardar Asistencia</Button>
            </div>
        </CardContent>
    </Card>
);

const GradesTab = () => (
     <Card>
        <CardHeader>
            <CardTitle>Registro de Notas</CardTitle>
            <div className="flex justify-between items-center">
                <CardDescription>Ingresa y modifica las notas de las actividades evaluativas.</CardDescription>
                <Button>💾 Guardar Notas</Button>
            </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
            <Table className="min-w-[800px]">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px] sticky left-0 bg-card z-10">Estudiante</TableHead>
                        {activities.map(a => <TableHead key={a.id} className="text-center">{a.title}</TableHead>)}
                        <TableHead className="text-center font-bold">Promedio Final</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map(student => (
                        <TableRow key={student.id}>
                            <TableCell className="font-medium sticky left-0 bg-card z-10">{student.name}</TableCell>
                            {activities.map(a => (
                                <TableCell key={`${student.id}-${a.id}`} className="text-center">
                                    <Input type="number" defaultValue={(Math.random() * 4 + 1).toFixed(1)} className="w-20 mx-auto text-center"/>
                                </TableCell>
                            ))}
                            <TableCell className="text-center font-bold">{student.average.toFixed(1)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

const MaterialsTab = () => (
     <div className="space-y-6">
        <div className="flex justify-end">
            <Button><Upload className="mr-2 h-4 w-4" /> Subir Nuevo Material</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map(material => {
                 const Icon = resourceIcons[material.type];
                 return (
                    <Card key={material.id}>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-muted rounded-lg">
                                <Icon className="h-6 w-6 text-primary"/>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">{material.title}</p>
                                <p className="text-xs text-muted-foreground">Subido: {material.uploadDate}</p>
                            </div>
                            <Button variant="ghost" size="icon"><FileText className="h-4 w-4"/></Button>
                        </CardContent>
                    </Card>
                 )
            })}
        </div>
    </div>
);


export default function CourseDetailPage() {
  const params = useParams();
  const cursoId = params.cursoId as string;
  const breadcrumbs = [{ name: "Mis Cursos", href: "/dashboard/docente/cursos" }, { name: courseDetails.subjectName }];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={courseDetails.subjectName}
        description={`Gestión del grupo ${courseDetails.groupCode}`}
        icon={<BookCopy className="h-8 w-8 text-primary" />}
        breadcrumbs={breadcrumbs}
      />
      
      <Card className="rounded-2xl overflow-hidden shadow-lg">
          <CardContent className="p-6 bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16"><AvatarFallback>CR</AvatarFallback></Avatar>
                        <div>
                            <p className="text-sm text-muted-foreground">Docente a cargo</p>
                            <h3 className="text-xl font-bold">Carlos Rivas</h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div><p className="text-muted-foreground">Código</p><p className="font-semibold">{courseDetails.groupCode}</p></div>
                        <div><p className="text-muted-foreground">Ciclo</p><p className="font-semibold">{courseDetails.cycle}</p></div>
                        <div><p className="text-muted-foreground">Modalidad</p><p className="font-semibold">{courseDetails.modality}</p></div>
                        <div><p className="text-muted-foreground">Sede</p><p className="font-semibold">{courseDetails.sede}</p></div>
                      </div>
                  </div>
                  <div className="md:col-span-1 grid grid-cols-3 md:grid-cols-1 gap-4">
                       <div className="p-4 bg-card rounded-lg text-center shadow-sm">
                           <p className="text-2xl font-bold">{courseDetails.studentCount}</p>
                           <p className="text-xs text-muted-foreground">Estudiantes</p>
                       </div>
                       <div className="p-4 bg-card rounded-lg text-center shadow-sm">
                           <p className="text-2xl font-bold">{courseDetails.activityCount}</p>
                           <p className="text-xs text-muted-foreground">Actividades</p>
                       </div>
                       <div className="p-4 bg-card rounded-lg text-center shadow-sm">
                           <p className="text-2xl font-bold text-primary">{courseDetails.averageGrade}</p>
                           <p className="text-xs text-muted-foreground">Promedio</p>
                       </div>
                  </div>
              </div>
          </CardContent>
          <CardFooter className="p-2 bg-muted/50">
             <div className="flex gap-2">
                <Button size="sm"><Plus className="mr-2 h-4 w-4"/>Crear Actividad</Button>
                <Button size="sm" variant="outline"><UserCheck className="mr-2 h-4 w-4"/>Tomar Asistencia</Button>
                <Button size="sm" variant="outline"><BarChart className="mr-2 h-4 w-4"/>Reportes</Button>
             </div>
          </CardFooter>
      </Card>
      
       <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1.5 bg-muted rounded-xl">
              <TabsTrigger value="students" className="py-2.5 flex items-center gap-2"><Users className="h-5 w-5"/>Estudiantes</TabsTrigger>
              <TabsTrigger value="activities" className="py-2.5 flex items-center gap-2"><ClipboardCheck className="h-5 w-5"/>Actividades</TabsTrigger>
              <TabsTrigger value="attendance" className="py-2.5 flex items-center gap-2"><UserCheck className="h-5 w-5"/>Asistencia</TabsTrigger>
              <TabsTrigger value="grades" className="py-2.5 flex items-center gap-2"><Star className="h-5 w-5"/>Notas</TabsTrigger>
              <TabsTrigger value="materials" className="py-2.5 flex items-center gap-2"><BookCopy className="h-5 w-5"/>Materiales</TabsTrigger>
          </TabsList>
          <TabsContent value="students" className="mt-6"><StudentsTab /></TabsContent>
          <TabsContent value="activities" className="mt-6"><ActivitiesTab /></TabsContent>
          <TabsContent value="attendance" className="mt-6"><AttendanceTab /></TabsContent>
          <TabsContent value="grades" className="mt-6"><GradesTab /></TabsContent>
          <TabsContent value="materials" className="mt-6"><MaterialsTab /></TabsContent>
       </Tabs>
    </div>
  );
}
