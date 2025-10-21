
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { CreditCard, DollarSign, CalendarClock, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, doc, updateDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Invoice {
    id: string;
    ciclo: number;
    monto: number;
    estado: "pendiente" | "pagado" | "vencido" | "incompleta" | "pendiente-validacion";
    fechaGeneracion: Timestamp;
    fechaMaximaPago: Timestamp;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
        setUserId(storedUserId);
    } else {
        setIsLoading(false);
    }
  }, []);

  const fetchInvoices = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
        const invoicesRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/pagos");
        const q = query(invoicesRef, where("idEstudiante", "==", userId));
        const querySnapshot = await getDocs(q);
        const fetchedInvoices = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Invoice));
        setInvoices(fetchedInvoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar tus facturas." });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
        fetchInvoices();
    }
  }, [userId]);


  const totalPaid = invoices
    .filter(p => p.estado === "pagado")
    .reduce((acc, p) => acc + p.monto, 0);
  
  const totalPending = invoices
    .filter(p => ["pendiente", "incompleta", "vencido", "pendiente-validacion"].includes(p.estado))
    .reduce((acc, p) => acc + p.monto, 0);
  
  const nextDueDate = invoices
    .filter(p => p.estado === "pendiente")
    .sort((a,b) => a.fechaMaximaPago.toMillis() - b.fechaMaximaPago.toMillis())[0]?.fechaMaximaPago.toDate();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis Pagos"
        description="Consulta tu historial de pagos y realiza pagos en línea."
        icon={<CreditCard className="h-8 w-8 text-primary" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                <p className="text-xs text-muted-foreground">Suma de todos los pagos realizados.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</div>
                <p className="text-xs text-muted-foreground">Suma de todas las cuotas pendientes.</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Próximo Vencimiento</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {nextDueDate ? nextDueDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric'}) : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Fecha límite para tu próxima cuota.</p>
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
                <CardTitle>Historial de Transacciones</CardTitle>
                <CardDescription>Aquí puedes ver todos tus movimientos financieros.</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : invoices.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Factura ID</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Fecha Máx. Pago</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
                        <TableCell className="font-medium">Matrícula Ciclo {invoice.ciclo}</TableCell>
                        <TableCell>
                        {invoice.fechaMaximaPago.toDate().toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.monto)}</TableCell>
                        <TableCell className="text-center">
                        <Badge
                            className={
                                invoice.estado === "pagado" ? "bg-green-100 text-green-800" : 
                                invoice.estado === "pendiente" ? "bg-yellow-100 text-yellow-800" :
                                invoice.estado === "vencido" ? "bg-red-100 text-red-800" :
                                invoice.estado === "pendiente-validacion" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                            }
                        >
                            {invoice.estado === 'pendiente-validacion' ? 'En Validación' : (invoice.estado.charAt(0).toUpperCase() + invoice.estado.slice(1))}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                        {invoice.estado === 'pendiente' ? (
                           <Button asChild size="sm">
                               <Link href={`/dashboard/pagos/${invoice.id}/checkout`}>Pagar</Link>
                           </Button>
                        ) : invoice.estado === 'pagado' ? (
                            <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4"/>
                                <span className="sr-only">Descargar Comprobante</span>
                            </Button>
                        ) : null}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    No tienes facturas pendientes ni historial de pagos.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
