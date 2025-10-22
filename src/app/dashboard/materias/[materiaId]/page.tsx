
"use client";

import { PageHeader } from "@/components/page-header";
import { 
    BookCopy, 
    CalendarCheck, 
    ClipboardList, 
    MessageCircle, 
    User, 
    Mail, 
    Clock, 
    Users, 
    Laptop, 
    Video, 
    FileText, 
    Link as LinkIcon,
    AlertCircle,
    CheckCircle,
    MoreVertical,
    Filter,
    ChevronRight,
    Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Image from "next/image";

// --- Mock Data ---

const courseDetails = {
    name: "Bases de Datos Avanzadas",
    code: "BD-401",
    teacher: {
        name: "Carlos Rivas",
        email: "carlos.rivas@pi.edu.co"
    },
    cycle: "Cuarto Ciclo",
    group: "BD-C4-001",
    modality: "Presencial"
};

const attendanceData = {
    totalClasses: 16,
    attended: 14,
    absences: 2,
    history: [
        { date: "2024-08-05", status: "attended" },
        { date: "2024-08-07", status: "attended" },
        { date: "2024-08-12", status: "absent" },
        { date: "2024-08-14", status: "attended" },
    ]
};

const activitiesData = [
    { id: "1", type: "Examen", title: "Primer Parcial", dueDate: "2024-08-20", status: "Calificada", grade: "4.5" },
    { id: "2", type: "Taller", title: "Taller de Normalización", dueDate: "2024-08-28", status: "Entregada" },
    { id: "3", type: "Tarea", title: "Investigación NoSQL", dueDate: "2024-09-05", status: "Pendiente" },
];

const contentData = [
    { id: "u1", title: "Unidad 1: Normalización y Modelado", description: "Conceptos avanzados de normalización, formas normales (FNBC, 4FN).", resources: [{type: "pdf", title: "Guía de Normalización"}, {type: "video", title: "Videotutorial: 3ra Forma Normal"}] },
    { id: "u2", title: "Unidad 2: Transacciones y Concurrencia", description: "Propiedades ACID, niveles de aislamiento, control de concurrencia.", resources: [{type: "link", title: "Artículo: ACID vs BASE"}] },
];

const communityData = [
    { id: "c1", user: "Laura Gómez", avatar: "LG", message: "¿Alguien tiene un buen recurso para entender la diferencia entre 4FN y 5FN?", time: "hace 2 horas" },
    { id: "c2", user: "Carlos Rivas", avatar: "CR", message: "Hola Laura, te recomiendo el capítulo 7 del libro guía. La sección 7.3 lo explica muy bien. ¡Avísame si tienes más dudas!", time: "hace 1 hora", isTeacher: true },
];

// --- Sub-components for each Tab ---

const AttendanceTab = () => {
    const attendancePercentage = (attendanceData.attended / attendanceData.totalClasses) * 100;
    const statusIcons = {
        attended: <CheckCircle className="h-5 w-5 text-green-500" />,
        absent: <AlertCircle className="h-5 w-5 text-red-500" />,
        pending: <Clock className="h-5 w-5 text-gray-400" />
    };

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Registro de Asistencia</CardTitle>
                <CardDescription>Tu asistencia es del {attendancePercentage.toFixed(1)}%. Tienes {attendanceData.absences} inasistencias.</CardDescription>
            </CardHeader>
            <CardContent>
                <Progress value={attendancePercentage} className="mb-6 h-3" />
                <div className="space-y-3">
                    {attendanceData.history.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">Clase del {new Date(item.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                            <div className="flex items-center gap-2 text-sm">
                                {statusIcons[item.status as keyof typeof statusIcons]}
                                <span className={item.status === 'absent' ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                    {item.status === 'attended' ? 'Asistió' : 'Inasistencia'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const ActivitiesTab = () => {
    const statusStyles: {[key: string]: string} = {
        "Calificada": "bg-blue-100 text-blue-800",
        "Entregada": "bg-green-100 text-green-800",
        "Pendiente": "bg-yellow-100 text-yellow-800",
    }
    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Actividades y Evaluaciones</CardTitle>
                <CardDescription>Aquí encontrarás todas tus tareas, talleres y exámenes.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-grow">
                        <Input placeholder="Buscar actividad..." className="pl-8"/>
                    </div>
                    <Button variant="outline"><Filter className="mr-2 h-4 w-4"/>Filtrar</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activitiesData.map(activity => (
                        <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-base">{activity.title}</CardTitle>
                                    <Badge className={statusStyles[activity.status]}>{activity.status}</Badge>
                                </div>
                                <CardDescription>Fecha de Entrega: {activity.dueDate}</CardDescription>
                            </CardHeader>
                             <CardFooter className="flex justify-between">
                                {activity.status === 'Calificada' && <span className="font-bold text-lg text-primary">Nota: {activity.grade}</span>}
                                <Button variant="ghost" size="sm" className="ml-auto">Ver detalles <ChevronRight className="h-4 w-4 ml-1"/></Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

const ContentTab = () => {
    const resourceIcons = {
        pdf: <FileText className="h-5 w-5 text-red-500" />,
        video: <Video className="h-5 w-5 text-blue-500" />,
        link: <LinkIcon className="h-5 w-5 text-green-500" />,
    }
    return (
         <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Contenidos Temáticos</CardTitle>
                <CardDescription>Material de estudio, guías y recursos para cada unidad.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {contentData.map(unit => (
                    <Card key={unit.id} className="bg-gray-50/50">
                        <CardHeader>
                            <CardTitle className="text-lg">{unit.title}</CardTitle>
                            <CardDescription>{unit.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <h4 className="font-semibold mb-2 text-sm">Recursos:</h4>
                            <div className="space-y-2">
                                {unit.resources.map((resource, i) => (
                                    <Button key={i} variant="outline" className="w-full justify-start gap-3">
                                        {resourceIcons[resource.type as keyof typeof resourceIcons]}
                                        {resource.title}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
};

const CommunityTab = () => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Comunidad / Foro</CardTitle>
        <CardDescription>Espacio para preguntas, debates y colaboración con tus compañeros y el docente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="max-h-96 overflow-y-auto space-y-4 pr-4">
          {communityData.map(post => (
            <div key={post.id} className={`flex items-start gap-3 ${post.isTeacher ? 'justify-end' : ''}`}>
               {!post.isTeacher && (
                <Avatar>
                    <AvatarFallback>{post.avatar}</AvatarFallback>
                </Avatar>
               )}
              <div className={`p-3 rounded-2xl max-w-sm ${post.isTeacher ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{post.user}</span>
                    {post.isTeacher && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400"/>}
                </div>
                <p className="text-sm">{post.message}</p>
                 <p className="text-xs opacity-70 mt-1 text-right">{post.time}</p>
              </div>
              {post.isTeacher && (
                <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">{post.avatar}</AvatarFallback>
                </Avatar>
               )}
            </div>
          ))}
        </div>
        <Separator/>
        <div className="flex items-center gap-3">
            <Input placeholder="Escribe un mensaje o una pregunta..." />
            <Button>Enviar</Button>
        </div>
      </CardContent>
    </Card>
  );
};


export default function SubjectDetailPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <Card className="rounded-2xl overflow-hidden shadow-lg border-primary/20 bg-gradient-to-br from-primary to-blue-800 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-white/20 rounded-xl">
              <BookCopy className="h-10 w-10" />
            </div>
            <div className="flex-1">
              <Badge variant="secondary" className="mb-2">{courseDetails.code}</Badge>
              <h1 className="text-3xl font-bold">{courseDetails.name}</h1>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm opacity-90">
                <div className="flex items-center gap-2"><User className="h-4 w-4"/><span>{courseDetails.teacher.name} ({courseDetails.teacher.email})</span></div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4"/><span>{courseDetails.cycle}</span></div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4"/><span>Grupo: {courseDetails.group}</span></div>
                <div className="flex items-center gap-2"><Laptop className="h-4 w-4"/><span>Modalidad: {courseDetails.modality}</span></div>
              </div>
            </div>
            <Button variant="secondary" size="lg" className="shrink-0 mt-4 md:mt-0">
                {courseDetails.modality === 'Virtual' ? "Asistir a Clase Virtual" : "Ver Horario de Clase"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
       <Tabs defaultValue="asistencia" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1.5 bg-muted rounded-xl">
                <TabsTrigger value="asistencia" className="py-2.5 flex items-center gap-2"><CalendarCheck className="h-5 w-5"/>Asistencia</TabsTrigger>
                <TabsTrigger value="actividades" className="py-2.5 flex items-center gap-2"><ClipboardList className="h-5 w-5"/>Actividades</TabsTrigger>
                <TabsTrigger value="contenidos" className="py-2.5 flex items-center gap-2"><BookCopy className="h-5 w-5"/>Contenidos</TabsTrigger>
                <TabsTrigger value="comunidad" className="py-2.5 flex items-center gap-2"><MessageCircle className="h-5 w-5"/>Comunidad</TabsTrigger>
            </TabsList>
            <TabsContent value="asistencia" className="mt-6">
                <AttendanceTab />
            </TabsContent>
            <TabsContent value="actividades" className="mt-6">
                <ActivitiesTab />
            </TabsContent>
            <TabsContent value="contenidos" className="mt-6">
                <ContentTab/>
            </TabsContent>
            <TabsContent value="comunidad" className="mt-6">
                <CommunityTab />
            </TabsContent>
        </Tabs>

    </div>
  );
}
