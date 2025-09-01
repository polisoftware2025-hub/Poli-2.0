"use client";

import { PageHeader } from "@/components/page-header";
import { Edit, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const auditLog = [
    { id: 'log001', student: 'Ana Martínez', subject: 'Cálculo Diferencial', oldGrade: '3.5', newGrade: '4.0', user: 'gestor@example.com', date: '2024-08-20 10:30', reason: 'Corrección de error en la suma de parciales.'},
    { id: 'log002', student: 'Carlos Rodriguez', subject: 'Bases de Datos', oldGrade: '2.8', newGrade: '3.1', user: 'admin@example.com', date: '2024-08-19 15:00', reason: 'Se recalificó el proyecto final por apelación del estudiante.'},
];


export default function GradeManagementPage() {

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de Calificaciones"
        description="Modifica notas de los estudiantes y consulta el registro de cambios."
        icon={<Edit className="h-8 w-8 text-primary" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Corregir Nota</CardTitle>
                    <CardDescription>
                        Busca al estudiante y la materia para realizar una corrección.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="student-search">Buscar Estudiante</Label>
                        <Input id="student-search" placeholder="Nombre o ID del estudiante..." />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="subject">Materia</Label>
                        <Select>
                            <SelectTrigger id="subject">
                                <SelectValue placeholder="Seleccionar materia..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="calculo">Cálculo Diferencial</SelectItem>
                                <SelectItem value="bd">Bases de Datos</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="old-grade">Nota Actual</Label>
                            <Input id="old-grade" value="3.5" disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-grade">Nueva Nota</Label>
                            <Input id="new-grade" type="number" step="0.1" min="0" max="5" placeholder="0.0 - 5.0" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="reason">Motivo de la Corrección</Label>
                        <Textarea id="reason" placeholder="Describe brevemente el motivo del cambio..." />
                     </div>
                     <Button className="w-full">
                        <Edit className="mr-2 h-4 w-4" />
                        Guardar Corrección
                     </Button>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-3">
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <ClipboardList className="h-6 w-6 text-primary"/>
                        <CardTitle>Registro de Auditoría de Notas</CardTitle>
                    </div>
                    <CardDescription>
                        Historial de todas las correcciones de notas realizadas en el sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Estudiante</TableHead>
                                <TableHead>Nota Anterior</TableHead>
                                <TableHead>Nota Nueva</TableHead>
                                <TableHead>Modificado por</TableHead>
                                <TableHead>Fecha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auditLog.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <div className="font-medium">{log.student}</div>
                                        <div className="text-xs text-muted-foreground">{log.subject}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.oldGrade}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-green-100 text-green-800">{log.newGrade}</Badge>
                                    </TableCell>
                                    <TableCell>{log.user}</TableCell>
                                    <TableCell className="text-xs">{log.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}
