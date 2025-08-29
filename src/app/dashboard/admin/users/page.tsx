
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Users, MoreHorizontal, FilePenLine, Trash2 } from "lucide-react";
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

const users = [
  {
    id: "usr_1",
    name: "Ana Pérez",
    email: "docente@example.com",
    role: "Docente",
    status: "Activo",
    createdAt: "2023-01-15",
    avatar: "/avatars/01.png",
  },
  {
    id: "usr_2",
    name: "Carlos Rivas",
    email: "carlos.rivas@example.com",
    role: "Docente",
    status: "Activo",
    createdAt: "2023-02-20",
    avatar: "/avatars/02.png",
  },
  {
    id: "usr_3",
    name: "Juan Perez",
    email: "juan.perez@pi.edu.co",
    role: "Estudiante",
    status: "Activo",
    createdAt: "2023-08-10",
    avatar: "/avatars/03.png",
  },
  {
    id: "usr_4",
    name: "Maria Lopez",
    email: "maria.lopez@pi.edu.co",
    role: "Estudiante",
    status: "Inactivo",
    createdAt: "2023-08-11",
    avatar: "/avatars/04.png",
  },
  {
    id: "usr_5",
    name: "Pedro Ramirez",
    email: "admin@example.com",
    role: "Admin",
    status: "Activo",
    createdAt: "2023-01-01",
    avatar: "/avatars/05.png",
  },
  {
    id: "usr_6",
    name: "Luisa Fernandez",
    email: "gestor@example.com",
    role: "Gestor",
    status: "Activo",
    createdAt: "2023-01-05",
    avatar: "/avatars/06.png",
  },
];

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const roleBadgeVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "Admin": "destructive",
  "Docente": "secondary",
  "Estudiante": "default",
  "Gestor": "outline",
};

export default function UsersPage() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de Usuarios"
        description="Administra los usuarios del sistema, sus roles y permisos."
        icon={<Users className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Aquí puedes ver y gestionar todos los usuarios registrados en la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input placeholder="Buscar por nombre o correo..." className="flex-grow" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Gestor">Gestor</SelectItem>
                <SelectItem value="Docente">Docente</SelectItem>
                <SelectItem value="Estudiante">Estudiante</SelectItem>
              </SelectContent>
            </Select>
             <Button>Agregar Usuario</Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
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
                    <TableCell>
                      <Badge variant={roleBadgeVariant[user.role] || "default"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <Badge variant={user.status === "Activo" ? "secondary" : "destructive"}
                          className={user.status === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {user.status}
                       </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FilePenLine className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
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
