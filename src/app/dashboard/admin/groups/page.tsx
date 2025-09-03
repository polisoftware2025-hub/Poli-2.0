
"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { PageHeader } from "@/components/page-header";
import { Users, Plus, Edit, Trash2, MoreVertical, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const groupSchema = z.object({
  nombreGrupo: z.string().min(1, "El nombre del grupo es requerido."),
  idSede: z.string().min(1, "La sede es requerida."),
  idCarrera: z.string().min(1, "La carrera es requerida."),
  ciclo: z.coerce.number().min(1, "El ciclo debe ser al menos 1.").max(12, "El ciclo no puede ser mayor a 12."),
  estado: z.string().min(1, "El estado es requerido."),
});

type GroupFormValues = z.infer<typeof groupSchema>;

interface Sede { id: string; nombre: string; }
interface Carrera { id: string; nombre: string; }
interface Group extends GroupFormValues {
  id: string;
  sedeNombre?: string;
  carreraNombre?: string;
}

export default function GroupsAdminPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [filterSede, setFilterSede] = useState("all");
  const [filterCarrera, setFilterCarrera] = useState("all");
  const { toast } = useToast();

  const fetchSedesAndCarreras = async () => {
    try {
      const sedesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes"));
      setSedes(sedesSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));
      
      const carrerasSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
      setCarreras(carrerasSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar sedes o carreras." });
    }
  };

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const groupsSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"));
      const sedesMap = new Map(sedes.map(s => [s.id, s.nombre]));
      const carrerasMap = new Map(carreras.map(c => [c.id, c.nombre]));

      const groupsList = groupsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as GroupFormValues),
        sedeNombre: sedesMap.get(doc.data().idSede) || 'N/A',
        carreraNombre: carrerasMap.get(doc.data().idCarrera) || 'N/A',
      }));
      setGroups(groupsList);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los grupos." });
    } finally {
      setIsLoading(false);
    }
  }, [sedes, carreras, toast]);

  useEffect(() => {
    fetchSedesAndCarreras();
  }, []);

  useEffect(() => {
    if (sedes.length > 0 && carreras.length > 0) {
      fetchGroups();
    }
  }, [sedes, carreras, fetchGroups]);
  
  const handleOpenDialog = (group: Group | null = null) => {
    setEditingGroup(group);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (groupId: string) => {
    try {
      await deleteDoc(doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", groupId));
      toast({ title: "Éxito", description: "El grupo ha sido eliminado." });
      fetchGroups();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el grupo." });
    }
  };
  
  const filteredGroups = groups.filter(group => 
    (filterSede === 'all' || group.idSede === filterSede) &&
    (filterCarrera === 'all' || group.idCarrera === filterCarrera)
  );


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de Grupos"
        description="Administra los grupos académicos de cada carrera y sede."
        icon={<Users className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado de Grupos</CardTitle>
          <div className="flex justify-between items-center">
            <CardDescription>Visualiza, crea, edita y elimina los grupos académicos.</CardDescription>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Grupo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
             <Select value={filterSede} onValueChange={setFilterSede}>
              <SelectTrigger className="w-full sm:w-56">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Sedes</SelectItem>
                {sedes.map(sede => (
                    <SelectItem key={sede.id} value={sede.id}>{sede.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
             <Select value={filterCarrera} onValueChange={setFilterCarrera}>
              <SelectTrigger className="w-full sm:w-56">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por carrera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Carreras</SelectItem>
                {carreras.map(carrera => (
                    <SelectItem key={carrera.id} value={carrera.id}>{carrera.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Grupo</TableHead>
                  <TableHead>Carrera</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.nombreGrupo}</TableCell>
                    <TableCell>{group.carreraNombre}</TableCell>
                    <TableCell>{group.sedeNombre}</TableCell>
                    <TableCell>{group.ciclo}</TableCell>
                    <TableCell>
                      <Badge variant={group.estado === 'activo' ? 'secondary' : 'outline'}
                          className={group.estado === 'activo' ? "bg-green-100 text-green-800" : ""}>
                        {group.estado.charAt(0).toUpperCase() + group.estado.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDialog(group)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                           <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el grupo <strong>{group.nombreGrupo}</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(group.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                       </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {filteredGroups.length === 0 && !isLoading && (
                <p className="text-center text-muted-foreground py-10">No se encontraron grupos para los filtros seleccionados.</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isDialogOpen && (
        <GroupFormDialog 
          isOpen={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          sedes={sedes}
          carreras={carreras}
          group={editingGroup}
          onSuccess={fetchGroups}
        />
      )}
    </div>
  );
}


interface GroupFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sedes: Sede[];
  carreras: Carrera[];
  group: Group | null;
  onSuccess: () => void;
}

function GroupFormDialog({ isOpen, onOpenChange, sedes, carreras, group, onSuccess }: GroupFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: group ? {
      nombreGrupo: group.nombreGrupo,
      idSede: group.idSede,
      idCarrera: group.idCarrera,
      ciclo: group.ciclo,
      estado: group.estado,
    } : {
      nombreGrupo: "",
      idSede: "",
      idCarrera: "",
      ciclo: 1,
      estado: "activo",
    },
  });

  const onSubmit = async (values: GroupFormValues) => {
    setIsSubmitting(true);
    try {
      if (group) {
        // Update
        const groupRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", group.id);
        await updateDoc(groupRef, values);
        toast({ title: "Éxito", description: "Grupo actualizado correctamente." });
      } else {
        // Create
        await addDoc(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"), {
          ...values,
          fechaCreacion: serverTimestamp()
        });
        toast({ title: "Éxito", description: "Grupo creado correctamente." });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el grupo." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{group ? 'Editar Grupo' : 'Crear Nuevo Grupo'}</DialogTitle>
          <DialogDescription>Completa la información del grupo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="idSede"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sede</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una sede..." /></SelectTrigger></FormControl>
                    <SelectContent>{sedes.map(sede => <SelectItem key={sede.id} value={sede.id}>{sede.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="idCarrera"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrera</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una carrera..." /></SelectTrigger></FormControl>
                    <SelectContent>{carreras.map(carrera => <SelectItem key={carrera.id} value={carrera.id}>{carrera.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nombreGrupo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Grupo</FormLabel>
                  <FormControl><Input placeholder="Ej: G1-Matutino" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ciclo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciclo</FormLabel>
                  <FormControl><Input type="number" placeholder="Ej: 1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
