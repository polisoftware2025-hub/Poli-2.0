
"use client";

import { PageHeader } from "@/components/page-header";
import { CreditCard, DollarSign, CalendarClock, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const paymentHistory = [
  {
    id: "TRN-001",
    concept: "Matrícula 2024-2",
    date: "2024-07-15",
    amount: 3500000,
    status: "Pagado",
  },
  {
    id: "TRN-002",
    concept: "Cuota 1 - Ingeniería de Sistemas",
    date: "2024-08-01",
    amount: 875000,
    status: "Pagado",
  },
  {
    id: "TRN-003",
    concept: "Cuota 2 - Ingeniería de Sistemas",
    date: "2024-09-01",
    amount: 875000,
    status: "Pendiente",
  },
  {
    id: "TRN-004",
    concept: "Derechos de grado",
    date: "2025-06-01",
    amount: 450000,
    status: "Pendiente",
  },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function PaymentsPage() {
  const totalPaid = paymentHistory
    .filter(p => p.status === "Pagado")
    .reduce((acc, p) => acc + p.amount, 0);
  
  const totalPending = paymentHistory
    .filter(p => p.status === "Pendiente")
    .reduce((acc, p) => acc + p.amount, 0);

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
                <div className="text-2xl font-bold">01 de Sept, 2024</div>
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
            <Button className="mt-4 md:mt-0">
                <CreditCard className="mr-2 h-4 w-4"/>
                Realizar un Pago
            </Button>
        </CardHeader>
        <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Transacción</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Fecha de Pago</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                    <TableCell className="font-medium">{payment.concept}</TableCell>
                    <TableCell>
                      {new Date(payment.date).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={payment.status === "Pagado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-right">
                       <Button variant="ghost" size="icon">
                           <Download className="h-4 w-4"/>
                           <span className="sr-only">Descargar Comprobante</span>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

    </div>
  );
}
