
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Users, Filter, Search, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type UserRole = "admin" | "gestor" | "docente" | "estudiante";
type UserStatus = "activo" | "inactivo";
type SortDirection = "asc" | "desc";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

const mockUsers: User[] = [
  { id: "usr_001", name: "Ana Pérez", email: "docente@example.com", role: "docente", status: "activo" },
  { id: "usr_002", name: "Carlos Rivas", email: "carlos.rivas@example.com", role: "docente", status: "inactivo" },
  { id: "usr_003", name: "Laura Gómez", email: "gestor@example.com", role: "gestor", status: "activo" },
  { id: "usr_004", name: "Juan Perez", email: "estudiante@example.com", role: "estudiante", status: "activo" },
  { id: "usr_005", name: "Admin User", email: "admin@example.com", role: "admin", status: "activo" },
  { id: "usr_006", name: "Maria Lopez", email: "maria.lopez@pi.edu.co", role: "estudiante", status: "inactivo" },
  { id: "usr_007", name: "Sofia Castro", email: "sofia.castro@pi.edu.co", role: "estudiante", status: "activo" },
];

export default function ManageUsersPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: SortDirection } | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    if (role !== "admin") {
      // For visual restriction simulation
      console.warn("Acceso denegado: este módulo es solo para administradores.");
    }
  }, []);

  const sortedAndFilteredUsers = useMemo(() => {
    let filteredUsers = mockUsers.filter(user => {
      const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = roleFilter === "todos" || user.role === roleFilter;
      return searchMatch && roleMatch;
    });

    if (sortConfig !== null) {
      filteredUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredUsers;
  }, [searchTerm, roleFilter, sortConfig]);

  const requestSort = (key: keyof User) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (userRole === null) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><p>Cargando...</p></div>;
  }

  if (userRole !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <div>
          <h2 className="text-2xl font-bold text-destructive">Acceso Denegado</h2>
          <p className="text-muted-foreground">Este módulo es solo para administradores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Panel de Usuarios"
        description="Gestiona todos los usuarios del sistema, sus roles y estados."
        icon={<Users className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>Busca, filtra y administra los usuarios registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative w-full md:flex-grow">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o correo..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full md:w-auto items-center gap-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por rol..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="docente">Docente</SelectItem>
                  <SelectItem value="estudiante">Estudiante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>Agregar Usuario</Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('name')}>
                      Nombre <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('email')}>
                      Correo Electrónico <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                     <Button variant="ghost" onClick={() => requestSort('role')}>
                      Rol <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.status === "activo" ? "secondary" : "destructive"}
                        className={user.status === "activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {user.status === "activo" ? "Activo" : "Inactivo"}
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
                           <DropdownMenuItem>Editar</DropdownMenuItem>
                           <DropdownMenuItem>Cambiar Rol</DropdownMenuItem>
                           <DropdownMenuItem className="text-destructive">Desactivar</DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {sortedAndFilteredUsers.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    <p>No se encontraron usuarios que coincidan con la búsqueda.</p>
                </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
