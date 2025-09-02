
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { DollarSign, Search, Filter, TrendingUp, AlertCircle, Bell, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

interface Invoice {
  id: string;
  idEstudiante: string;
  nombreEstudiante?: string;
  ciclo: number;
  monto: number;
  estado: "pendiente" | "pagado" | "vencido" | "incompleta";
  fechaGeneracion: Timestamp;
  fechaMaximaPago: Timestamp;
}

const getInitials = (name: string = "") => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name ? name.substring(0, 2).toUpperCase() : 'U';
}

const statusBadgeVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "pendiente": "outline",
  "pagado": "secondary",
  "vencido": "destructive",
  "incompleta": "default",
};

const statusColors: { [key: string]: string } = {
    "pendiente": "bg-yellow-100 text-yellow-800",
    "pagado": "bg-green-100 text-green-800",
    "vencido": "bg-red-100 text-red-800",
    "incompleta": "bg-gray-100 text-gray-800",
};


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};


export default function PaymentsAdminPage() {
  const [filter, setFilter] = useState("all");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch all users to map IDs to names
            const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
            const usersSnapshot = await getDocs(usersRef);
            const userMap = new Map<string, string>();
            usersSnapshot.forEach(doc => {
                userMap.set(doc.id, doc.data().nombreCompleto || 'Nombre no disponible');
            });

            // 2. Fetch invoices and apply filter if not 'all'
            const invoicesRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/pagos");
            let q = query(invoicesRef);
            if (filter !== "all") {
                q = query(invoicesRef, where("estado", "==", filter));
            }
            const invoicesSnapshot = await getDocs(q);

            const fetchedInvoices = invoicesSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    nombreEstudiante: userMap.get(data.idEstudiante) || 'Estudiante Desconocido',
                } as Invoice;
            });
            
            setInvoices(fetchedInvoices);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setIsLoading(false);
        }
    }
    fetchInvoices();
  }, [filter]);

  const totalRecaudado = invoices.filter(i => i.estado === 'pagado').reduce((sum, i) => sum + i.monto, 0);
  const totalPendiente = invoices.filter(i => i.estado === 'pendiente' || i.estado === 'incompleta').reduce((sum, i) => sum + i.monto, 0);
  const facturasVencidas = invoices.filter(i => i.estado === 'vencido').reduce((sum, i) => sum + i.monto, 0);


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de Pagos"
        description="Administra y supervisa todas las facturas y transacciones de los estudiantes."
        icon={<DollarSign className="h-8 w-8 text-primary" />}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRecaudado)}</div>
                <p className="text-xs text-muted-foreground">Suma de facturas pagadas</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalPendiente)}</div>
                <p className="text-xs text-muted-foreground">Suma de facturas por pagar</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Facturas Vencidas</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(facturasVencidas)}</div>
                <p className="text-xs text-muted-foreground">Total en facturas vencidas</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Facturas</CardTitle>
          <CardDescription>
            Visualiza y gestiona las facturas generadas para los estudiantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Buscar por estudiante o ID de factura..." className="pl-9" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-48">
                 <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="incompleta">Incompleta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Factura ID</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Fecha Máx. Pago</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    Array.from({length: 4}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell className="text-center"><Skeleton className="h-6 w-24" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                            <AvatarFallback>{getInitials(invoice.nombreEstudiante)}</AvatarFallback>
                            </Avatar>
                            <div>
                            <p className="font-medium">{invoice.nombreEstudiante}</p>
                            <p className="text-sm text-muted-foreground">{invoice.idEstudiante}</p>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
                        <TableCell className="text-center">{invoice.ciclo}</TableCell>
                        <TableCell>
                        {invoice.fechaMaximaPago.toDate().toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(invoice.monto)}</TableCell>
                        <TableCell className="text-center">
                        <Badge variant={statusBadgeVariant[invoice.estado]} className={statusColors[invoice.estado]}>
                            {invoice.estado.charAt(0).toUpperCase() + invoice.estado.slice(1)}
                        </Badge>
                        </TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
