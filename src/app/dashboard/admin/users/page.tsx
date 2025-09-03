
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Users, MoreHorizontal, FilePenLine, UserX, Search } from "lucide-react";
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

interface User {
    id: string;
    nombreCompleto: string;
    correoInstitucional: string;
    rol: { id: string, descripcion: string };
    estado: string;
    fechaRegistro: Timestamp;
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
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
      setIsLoading(true);
      try {
          const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
          const querySnapshot = await getDocs(usersRef);
          const fetchedUsers = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          } as User));
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
  }, []);

  const handleDisableUser = async (userId: string) => {
    try {
      const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
      await updateDoc(userRef, { estado: "inactivo" });
      toast({ title: "Usuario Deshabilitado", description: "El estado del usuario ha sido cambiado a inactivo." });
      fetchUsers(); // Refresh data
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
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="docente">Docente</SelectItem>
                <SelectItem value="estudiante">Estudiante</SelectItem>
                <SelectItem value="aspirante">Aspirante</SelectItem>
              </SelectContent>
            </Select>
             <Button asChild>
                <Link href="/dashboard/admin/add-user">Agregar Usuario</Link>
             </Button>
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
                ) : (
                  filteredUsers.map((user) => (
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
                        <Badge variant={roleBadgeVariant[user.rol.id] || "default"}>
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
                        {user.fechaRegistro?.toDate().toLocaleDateString('es-ES', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        }) || 'No disponible'}
                      </TableCell>
                      <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
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
                          <DropdownMenuItem onClick={() => handleDisableUser(user.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={user.estado === 'inactivo'}>
                            <UserX className="mr-2 h-4 w-4" />
                            Deshabilitar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                 {filteredUsers.length === 0 && !isLoading && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No se encontraron usuarios para los filtros seleccionados.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
