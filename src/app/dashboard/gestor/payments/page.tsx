
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { DollarSign, Search, Filter, MoreHorizontal, Eye, CheckCircle, Bell, TrendingUp, AlertCircle, FileText, Check, X, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData, Timestamp, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Invoice {
  id: string;
  idEstudiante: string;
  nombreEstudiante?: string;
  carreraNombre?: string;
  ciclo: number;
  monto: number;
  estado: "pendiente" | "pagado" | "vencido" | "pendiente-validacion" | "rechazado";
  fechaGeneracion: Timestamp;
  fechaMaximaPago: Timestamp;
  comprobanteURL?: string;
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
  "pendiente-validacion": "default",
  "rechazado": "destructive"
};

const statusText: { [key: string]: string } = {
    "pendiente": "Pendiente",
    "pagado": "Pagado",
    "vencido": "Vencido",
    "pendiente-validacion": "Pendiente de Validación",
    "rechazado": "Rechazado",
};

const statusColors: { [key: string]: string } = {
    "pendiente": "bg-yellow-100 text-yellow-800",
    "pagado": "bg-green-100 text-green-800",
    "vencido": "bg-red-100 text-red-800",
    "rechazado": "bg-red-200 text-red-900",
    "pendiente-validacion": "bg-blue-100 text-blue-800",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};


export default function PaymentsReviewPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [filter, setFilter] = useState("pendiente-validacion");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchInvoices = async () => {
      setIsLoading(true);
      try {
          const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
          const usersSnapshot = await getDocs(usersRef);
          const userMap = new Map<string, string>();
          usersSnapshot.forEach(doc => userMap.set(doc.id, doc.data().nombreCompleto || 'N/A'));
          
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
          
          fetchedInvoices.sort((a,b) => b.fechaGeneracion.toMillis() - a.fechaGeneracion.toMillis());
          setInvoices(fetchedInvoices);
          if (fetchedInvoices.length > 0) {
              setSelectedInvoice(fetchedInvoices[0]);
          } else {
              setSelectedInvoice(null);
          }

      } catch (error) {
          console.error("Error fetching invoices:", error);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchInvoices();
  }, [filter]);
  
  const handleUpdateStatus = async (invoiceId: string, newStatus: "pagado" | "rechazado") => {
      setIsActionLoading(true);
      try {
          const invoiceRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/pagos", invoiceId);
          await updateDoc(invoiceRef, { 
              estado: newStatus,
              ...(newStatus === "pagado" && { fechaPago: Timestamp.now() })
           });
          toast({ title: "Éxito", description: `La factura ha sido marcada como ${statusText[newStatus]}.` });
          fetchInvoices(); // Refresh list
      } catch (error) {
          console.error("Error updating invoice status:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la factura." });
      } finally {
          setIsActionLoading(false);
      }
  };
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
        const term = searchTerm.toLowerCase();
        return (
            invoice.nombreEstudiante?.toLowerCase().includes(term) ||
            invoice.id.toLowerCase().includes(term)
        );
    });
  }, [invoices, searchTerm]);


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Revisión de Pagos"
        description="Supervisa y valida los pagos realizados por los estudiantes."
        icon={<DollarSign className="h-8 w-8 text-primary" />}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
            <CardHeader>
            <CardTitle>Listado de Estudiantes y Estado Financiero</CardTitle>
            <CardDescription>
                Filtra y busca estudiantes para revisar el estado de sus facturas.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="Buscar por estudiante o ID de factura..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-56">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                    <SelectItem value="pendiente-validacion">Pendiente de Validación</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
                </Select>
                 <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Exportar Reporte
                </Button>
            </div>
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Factura ID</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({length: 4}).map((_, i) => (
                           <TableRow key={i}>
                             <TableCell colSpan={5}><Skeleton className="h-10 w-full"/></TableCell>
                           </TableRow>
                        ))
                    ) : filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedInvoice(invoice)}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                            <AvatarFallback>{getInitials(invoice.nombreEstudiante)}</AvatarFallback>
                            </Avatar>
                            <div>
                            <p className="font-medium">{invoice.nombreEstudiante}</p>
                            <p className="text-sm text-muted-foreground">{invoice.carreraNombre}</p>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
                        <TableCell>
                        {invoice.fechaMaximaPago.toDate().toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}
                        </TableCell>
                        <TableCell className="text-center">
                        <Badge variant={statusBadgeVariant[invoice.estado]} className={statusColors[invoice.estado]}>
                            {statusText[invoice.estado] || "N/A"}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
                 {filteredInvoices.length === 0 && !isLoading && (
                    <p className="text-center py-8 text-muted-foreground">No se encontraron facturas con los filtros actuales.</p>
                )}
            </div>
            </CardContent>
        </Card>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6 sticky top-20">
             {selectedInvoice ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Detalle de Factura</CardTitle>
                        <CardDescription>{selectedInvoice.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Estudiante:</span>
                            <span className="font-semibold text-right">{selectedInvoice.nombreEstudiante}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Monto:</span>
                            <span className="font-semibold">{formatCurrency(selectedInvoice.monto)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Fecha Venc.:</span>
                            <span className="font-semibold">{selectedInvoice.fechaMaximaPago.toDate().toLocaleDateString('es-ES')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Estado:</span>
                            <Badge variant={statusBadgeVariant[selectedInvoice.estado]} className={statusColors[selectedInvoice.estado]}>{statusText[selectedInvoice.estado]}</Badge>
                        </div>

                        {selectedInvoice.comprobanteURL ? (
                             <Button asChild variant="outline" className="w-full">
                                <a href={selectedInvoice.comprobanteURL} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4"/>
                                    Descargar Recibo
                                </a>
                             </Button>
                        ) : <p className="text-xs text-center text-muted-foreground pt-2">No se ha adjuntado un comprobante de pago.</p>}

                        {selectedInvoice.estado === 'pendiente-validacion' && (
                            <div className="flex gap-2 pt-2">
                               <Button variant="destructive" className="w-full" onClick={() => handleUpdateStatus(selectedInvoice!.id, 'rechazado')} disabled={isActionLoading}>
                                   <X className="mr-2 h-4 w-4"/> {isActionLoading ? "Rechazando..." : "Rechazar"}
                               </Button>
                               <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(selectedInvoice!.id, 'pagado')} disabled={isActionLoading}>
                                   <Check className="mr-2 h-4 w-4"/> {isActionLoading ? "Aprobando..." : "Aprobar"}
                               </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
             ) : (
                <Card>
                    <CardContent className="p-8 flex flex-col items-center justify-center text-center text-muted-foreground">
                        <DollarSign className="h-12 w-12 mb-4"/>
                        <p>Selecciona una factura de la lista para ver sus detalles y realizar acciones.</p>
                    </CardContent>
                </Card>
             )}
        </div>
      </div>

    </div>
  );
}
