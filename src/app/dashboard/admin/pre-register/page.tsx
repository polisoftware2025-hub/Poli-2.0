"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ClipboardList, MoreHorizontal, Check, X, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const preRegisteredUsers = [
  {
    id: "pre_1",
    name: "Laura Gómez",
    email: "laura.gomez@email.com",
    program: "Ingeniería de Sistemas",
    requestDate: "2024-08-15",
    status: "Pendiente",
    avatar: "/avatars/07.png",
  },
  {
    id: "pre_2",
    name: "David Martínez",
    email: "david.martinez@email.com",
    program: "Administración de Empresas",
    requestDate: "2024-08-14",
    status: "Aprobado",
    avatar: "/avatars/08.png",
  },
  {
    id: "pre_3",
    name: "Sofia Castro",
    email: "sofia.castro@email.com",
    program: "Mercadeo y Publicidad",
    requestDate: "2024-08-13",
    status: "Rechazado",
    avatar: "/avatars/09.png",
  },
  {
    id: "pre_4",
    name: "Mateo Vargas",
    email: "mateo.vargas@email.com",
    program: "Contaduría Pública",
    requestDate: "2024-08-12",
    status: "Pendiente",
    avatar: "/avatars/10.png",
  },
];

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const statusBadgeVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "Pendiente": "outline",
  "Aprobado": "secondary",
  "Rechazado": "destructive",
};


export default function PreRegisterPage() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Pre-registro de Estudiantes"
        description="Gestiona las solicitudes de los aspirantes que han completado el formulario de pre-registro."
        icon={<ClipboardList className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Pre-registro</CardTitle>
          <CardDescription>
            Aprueba o rechaza las solicitudes de los nuevos aspirantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Buscar por nombre o correo..." className="pl-9" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-48">
                 <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Aprobado">Aprobado</SelectItem>
                <SelectItem value="Rechazado">Rechazado</SelectItem>
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
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preRegisteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.program}</TableCell>
                     <TableCell>
                      {new Date(user.requestDate).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[user.status]}>
                        {user.status}
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
                          <DropdownMenuItem className="text-green-600 focus:text-green-600 focus:bg-green-50">
                            <Check className="mr-2 h-4 w-4" />
                            Aprobar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            <X className="mr-2 h-4 w-4" />
                            Rechazar
                          </DropdownMenuItem>
                           <DropdownMenuItem>
                            Ver Detalles
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
