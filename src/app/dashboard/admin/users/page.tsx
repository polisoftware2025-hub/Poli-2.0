
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Users, MoreHorizontal, FilePenLine, UserX, Search, ChevronLeft, ChevronRight } from "lucide-react";
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
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, Timestamp, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface User {
    id: string;
    nombreCompleto: string;
    correoInstitucional: string;
    rol: { id: string, descripcion: string };
    estado: string;
    fechaRegistro: Timestamp | Date;
}

const getInitials = (name: string = "") => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name ? name.substring(0, 2).toUpperCase() : 'U';
}

const roleBadgeVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "admin": "destructive",
  "docente": "secondary",
  "estudiante": "default",
  "gestor": "outline",
  "aspirante": "default",
  "rector": "outline",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
      const role = localStorage.getItem('userRole');
      setCurrentUserRole(role);
  }, []);

  const fetchUsers = async () => {
      setIsLoading(true);
      try {
          const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
          const querySnapshot = await getDocs(usersRef);
          const fetchedUsers = querySnapshot.docs.map(doc => {
              const data = doc.data();
              if (data.fechaRegistro && typeof data.fechaRegistro.toDate === 'function') {
                  data.fechaRegistro = data.fechaRegistro.toDate();
              }
              return {
                  id: doc.id,
                  ...data
              } as User;
          });
          setUsers(fetchedUsers);
      } catch (error) {
          console.error("Error fetching users:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los usuarios." });
      } finally {
          setIsLoading(false);
      }
  };
  
  useEffect(() => {
    fetchUsers();
  }, [toast]);

  const handleDisableUser = async (userId: string) => {
    try {
      const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
      await updateDoc(userRef, { estado: "inactivo" });
      toast({ title: "Usuario Deshabilitado", description: "El estado del usuario ha sido cambiado a inactivo." });
      fetchUsers();
    } catch (error) {
      console.error("Error disabling user:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo deshabilitar al usuario." });
    }
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        if (roleFilter === 'all') return true;
        return user.rol.id === roleFilter;
      })
      .filter(user => {
        const term = searchTerm.toLowerCase();
        return (
          user.nombreCompleto?.toLowerCase().includes(term) ||
          user.correoInstitucional?.toLowerCase().includes(term)
        );
      });
  }, [users, roleFilter, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredUsers.length);

  const paginatedUsers = useMemo(() => {
      return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, startIndex, endIndex]);

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
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Buscar por nombre o correo..." 
                className="pl-9 rounded-full"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                }}
              />
            </div>
            <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-48 rounded-full">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="rector">Rector</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="docente">Docente</SelectItem>
                <SelectItem value="estudiante">Estudiante</SelectItem>
                <SelectItem value="aspirante">Aspirante</SelectItem>
              </SelectContent>
            </Select>
             <Button asChild className="rounded-full">
                <Link href="/dashboard/admin/add-user">Agregar Usuario</Link>
             </Button>
          </div>
          <div className="relative w-full overflow-auto">
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => {
                    const isProtected = (user.rol.id === 'admin' || user.rol.id === 'rector') && currentUserRole !== 'rector';
                    const isRector = user.rol.id === 'rector';
                    return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(user.nombreCompleto)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.nombreCompleto}</p>
                            <p className="text-sm text-muted-foreground">{user.correoInstitucional || user.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant[user.rol.id] || "default"}
                           className={cn({
                              'bg-yellow-100 text-yellow-800 border-yellow-300': isRector,
                          })}
                        >
                          {user.rol.descripcion}
                        </Badge>
                      </TableCell>
                      <TableCell>
                       <Badge variant={user.estado === "activo" ? "secondary" : "destructive"}
                          className={user.estado === "activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {user.estado}
                       </Badge>
                      </TableCell>
                      <TableCell>
                        {user.fechaRegistro instanceof Date ? user.fechaRegistro.toLocaleDateString('es-ES', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        }) : 'No disponible'}
                      </TableCell>
                      <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isProtected}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem asChild>
                                <Link href={`/dashboard/admin/edit-user/${user.id}`}>
                                    <FilePenLine className="mr-2 h-4 w-4" />
                                    Editar
                                </Link>
                            </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDisableUser(user.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={isProtected || user.estado === 'inactivo'}>
                            <UserX className="mr-2 h-4 w-4" />
                            Deshabilitar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    )
                })
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No se encontraron usuarios para los filtros seleccionados.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
            <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1}-{endIndex} de {filteredUsers.length} usuarios.
                </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Filas:</span>
                        <Select value={String(rowsPerPage)} onValueChange={(value) => { setRowsPerPage(Number(value)); setCurrentPage(1); }}>
                            <SelectTrigger className="w-20 h-8 rounded-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <span className="text-sm font-medium">Página {currentPage} de {totalPages > 0 ? totalPages : 1}</span>
                    <div className="flex items-center gap-2">
                         <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                             <ChevronLeft className="h-4 w-4" />
                         </Button>
                         <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0}>
                             <ChevronRight className="h-4 w-4" />
                         </Button>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );

    

}
