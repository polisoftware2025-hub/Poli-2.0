
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { DollarSign, Search, Filter, TrendingUp, AlertCircle, Bell, FileText, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData, Timestamp, doc, getDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { generateInvoicePdf } from "@/lib/invoice-generator";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface Invoice {
  id: string;
  idEstudiante: string;
  nombreEstudiante?: string;
  carreraId?: string;
  carreraNombre?: string;
  ciclo: number;
  monto: number;
  estado: "pendiente" | "pagado" | "vencido" | "incompleta" | "pendiente-validacion";
  fechaGeneracion: Timestamp;
  fechaMaximaPago: Timestamp;
  fechaPago?: Timestamp;
}

interface StudentInfo {
    nombreCompleto: string;
    identificacion: string;
    carreraNombre: string;
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
  "pendiente-validacion": "default",
};

const statusColors: { [key: string]: string } = {
    "pendiente": "bg-yellow-100 text-yellow-800",
    "pagado": "bg-green-100 text-green-800",
    "vencido": "bg-red-100 text-red-800",
    "incompleta": "bg-gray-100 text-gray-800",
    "pendiente-validacion": "bg-blue-100 text-blue-800",
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
            const usersSnapshot = await getDocs(usersRef);
            const userMap = new Map<string, string>();
            usersSnapshot.forEach(doc => {
                userMap.set(doc.id, doc.data().nombreCompleto || 'Nombre no disponible');
            });
            
            const careersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
            const careersSnapshot = await getDocs(careersRef);
            const careerMap = new Map<string, string>();
            careersSnapshot.forEach(doc => careerMap.set(doc.id, doc.data().nombre || 'N/A'));

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
                    carreraNombre: careerMap.get(data.carreraId) || 'Carrera no asignada'
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
  
  const handleDownload = async (invoice: Invoice) => {
    setIsDownloading(invoice.id);
    try {
        const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", invoice.idEstudiante);
        const studentSnap = await getDoc(userRef);
        
        let studentInfo: StudentInfo = { nombreCompleto: "N/A", identificacion: "N/A", carreraNombre: "N/A" };

        if (studentSnap.exists()) {
            const userData = studentSnap.data();
            studentInfo.nombreCompleto = userData.nombreCompleto;
            studentInfo.identificacion = userData.identificacion;
        }
        studentInfo.carreraNombre = invoice.carreraNombre || 'N/A';
        
        const invoiceToPdf = {
            ...invoice,
            fechaPago: invoice.fechaPago || invoice.fechaGeneracion, 
        };

        generateInvoicePdf(invoiceToPdf, studentInfo);
    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({ variant: "destructive", title: "Error de descarga", description: "No se pudo generar la factura." });
    } finally {
        setIsDownloading(null);
    }
  };


  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
        const term = searchTerm.toLowerCase();
        const studentName = invoice.nombreEstudiante?.toLowerCase() || "";
        const studentId = invoice.idEstudiante.toLowerCase();
        return studentName.includes(term) || studentId.includes(term) || invoice.id.toLowerCase().includes(term);
    })
  }, [invoices, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedInvoices = useMemo(() => filteredInvoices.slice(startIndex, startIndex + rowsPerPage), [filteredInvoices, startIndex, rowsPerPage]);
  const endIndex = Math.min(startIndex + rowsPerPage, filteredInvoices.length);

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
                <Input 
                    placeholder="Buscar por estudiante, ID de estudiante o ID de factura..." 
                    className="pl-9" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                <SelectItem value="pendiente-validacion">En Validación</SelectItem>
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
                  <TableHead>Fecha de Pago</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    Array.from({length: rowsPerPage}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                        </TableRow>
                    ))
                ) : paginatedInvoices.length > 0 ? (
                    paginatedInvoices.map((invoice) => (
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
                        <TableCell>
                            {invoice.fechaPago ? invoice.fechaPago.toDate().toLocaleDateString('es-ES') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(invoice.monto)}</TableCell>
                        <TableCell className="text-center">
                        <Badge variant={statusBadgeVariant[invoice.estado]} className={statusColors[invoice.estado]}>
                            {invoice.estado.charAt(0).toUpperCase() + invoice.estado.slice(1)}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.estado === 'pagado' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(invoice)} disabled={isDownloading === invoice.id}>
                                    <Download className="h-4 w-4" />
                                </Button>
                            )}
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center h-24">No se encontraron facturas con los filtros actuales.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
           <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1}-{endIndex} de {filteredInvoices.length} facturas.
                </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Filas:</span>
                        <Select value={String(rowsPerPage)} onValueChange={(value) => { setRowsPerPage(Number(value)); setCurrentPage(1); }}>
                            <SelectTrigger className="w-20 h-8 rounded-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
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


    