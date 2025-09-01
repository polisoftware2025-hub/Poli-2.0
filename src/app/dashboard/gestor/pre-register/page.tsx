
"use client";

import { PageHeader } from "@/components/page-header";
import { ClipboardList, Filter, MoreHorizontal, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const requests = [
    { id: 'req001', studentName: 'Laura Gómez', studentId: 'est007', type: 'Ingeniería de Sistemas', date: '2024-08-18', status: 'Pendiente' },
    { id: 'req002', studentName: 'David Martínez', studentId: 'est008', type: 'Administración de Empresas', date: '2024-08-15', status: 'Aprobado' },
    { id: 'req003', studentName: 'Sofia Castro', studentId: 'est009', type: 'Mercadeo y Publicidad', date: '2024-08-12', status: 'Rechazado' },
    { id: 'req004', studentName: 'Mateo Vargas', studentId: 'est010', type: 'Contaduría Pública', date: '2024-08-10', status: 'Pendiente' },
];

const getInitials = (name: string) => {
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
}

const statusBadgeVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "Pendiente": "outline",
  "Aprobado": "secondary",
  "Rechazado": "destructive",
};

export default function PreRegisterPage() {

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de Preinscripciones"
        description="Revisa, aprueba o rechaza las solicitudes de los nuevos aspirantes."
        icon={<ClipboardList className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Bandeja de Solicitudes de Preinscripción</CardTitle>
          <CardDescription>
            Listado de aspirantes pendientes de revisión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input placeholder="Buscar por aspirante o carrera..." className="flex-grow" />
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-56">
                 <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aspirante</TableHead>
                  <TableHead>Carrera de Interés</TableHead>
                  <TableHead>Fecha de Solicitud</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>{getInitials(request.studentName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{request.studentName}</p>
                                <p className="text-sm text-muted-foreground font-mono">{request.studentId}</p>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>{new Date(request.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusBadgeVariant[request.status]}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver Detalle</DropdownMenuItem>
                          <DropdownMenuItem className="text-green-600 focus:text-green-600 focus:bg-green-50">
                            <Check className="mr-2 h-4 w-4" />
                            Aprobar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            <X className="mr-2 h-4 w-4" />
                            Rechazar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
