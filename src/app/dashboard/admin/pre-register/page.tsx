
"use client";

import { useState, useEffect } from "react";
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
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { processStudentEnrollment } from "@/ai/flows/enroll-student-flow";
import { useToast } from "@/hooks/use-toast";


interface PreRegisteredUser {
  id: string; // This will be the document ID from Firestore
  nombreCompleto: string;
  correo: string;
  carreraId: string; // The ID of the career
  carreraNombre?: string; // To be fetched
  fechaRegistro: any; // Firestore Timestamp
  estado: "pendiente" | "aprobado" | "rechazado";
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name ? name.substring(0, 2).toUpperCase() : 'U';
}

const statusBadgeVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "pendiente": "outline",
  "aprobado": "secondary",
  "rechazado": "destructive",
};

export default function PreRegisterPage() {
  const [filter, setFilter] = useState("pendiente");
  const [users, setUsers] = useState<PreRegisteredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
        const q = query(usersRef, where("estado", "==", filter));
        const querySnapshot = await getDocs(q);

        const fetchedUsers: PreRegisteredUser[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            nombreCompleto: doc.data().nombreCompleto,
            correo: doc.data().correo,
            carreraId: doc.data().carrera, // Assuming career ID is stored here
            fechaRegistro: doc.data().fechaRegistro,
            estado: doc.data().estado
        }));
        setUsers(fetchedUsers);
      } catch (error) {
          console.error("Error fetching pre-registered users:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las solicitudes."})
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, [filter, toast]);

  const handleApprove = async (studentId: string) => {
    try {
        const result = await processStudentEnrollment({ studentId });
        if (result.success) {
            toast({ title: "Éxito", description: result.message });
            setUsers(prev => prev.filter(u => u.id !== studentId)); // Remove from list
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error al Aprobar", description: error.message });
    }
  }

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
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">Cargando solicitudes...</TableCell>
                    </TableRow>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(user.nombreCompleto)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.nombreCompleto}</p>
                            <p className="text-sm text-muted-foreground">{user.correo}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.carreraId || 'No especificada'}</TableCell>
                       <TableCell>
                        {user.fechaRegistro?.toDate().toLocaleDateString('es-ES', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        }) || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[user.estado]}>
                          {user.estado}
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
                            <DropdownMenuItem onSelect={() => handleApprove(user.id)} className="text-green-600 focus:text-green-600 focus:bg-green-50">
                              <Check className="mr-2 h-4 w-4" />
                              Aprobar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                              <X className="mr-2 h-4 w-4" />
                              Rechazar
                            </DropdownMenuItem>
                             <DropdownMenuItem asChild>
                                 <Link href={`/dashboard/admin/pre-register/${user.id}`}>
                                  Ver Detalles
                                 </Link>
                             </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No hay solicitudes con el estado '{filter}'.</TableCell>
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
