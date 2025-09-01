
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { DollarSign, Search, Filter, MoreHorizontal, Eye, CheckCircle, Bell, TrendingUp, AlertCircle, FileText, Check, X, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const invoices = [
  {
    id: "INV-001",
    studentName: "Laura Gómez",
    studentId: "est007",
    program: "Ingeniería de Sistemas",
    issueDate: "2024-08-01",
    dueDate: "2024-08-31",
    amount: 3500000,
    status: "Pagado",
    receiptUrl: "/receipts/rec-001.pdf"
  },
  {
    id: "INV-002",
    studentName: "David Martínez",
    studentId: "est008",
    program: "Administración de Empresas",
    issueDate: "2024-08-01",
    dueDate: "2024-08-31",
    status: "Pendiente de Validación",
    amount: 3200000,
    receiptUrl: "/receipts/rec-002.pdf"
  },
  {
    id: "INV-003",
    studentName: "Sofia Castro",
    studentId: "est009",
    program: "Mercadeo y Publicidad",
    issueDate: "2024-07-15",
    dueDate: "2024-08-15",
    status: "Vencido",
    amount: 3000000,
    receiptUrl: null
  },
  {
    id: "INV-004",
    studentName: "Mateo Vargas",
    studentId: "est010",
    program: "Contaduría Pública",
    issueDate: "2024-08-05",
    dueDate: "2024-09-05",
    status: "Pendiente",
    amount: 2800000,
    receiptUrl: null
  },
];

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const statusBadgeVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "Pendiente": "outline",
  "Pagado": "secondary",
  "Vencido": "destructive",
  "Pendiente de Validación": "default",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};


export default function PaymentsReviewPage() {
  const [filter, setFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState(invoices[1]); // Default to one with receipt

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
                    <Input placeholder="Buscar por estudiante o ID de factura..." className="pl-9" />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-56">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Pagado">Pagado</SelectItem>
                    <SelectItem value="Pendiente de Validación">Pendiente de Validación</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Vencido">Vencido</SelectItem>
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
                    {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedInvoice(invoice)}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                            <AvatarFallback>{getInitials(invoice.studentName)}</AvatarFallback>
                            </Avatar>
                            <div>
                            <p className="font-medium">{invoice.studentName}</p>
                            <p className="text-sm text-muted-foreground">{invoice.program}</p>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
                        <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}
                        </TableCell>
                        <TableCell className="text-center">
                        <Badge variant={statusBadgeVariant[invoice.status]} className={
                            invoice.status === 'Pagado' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'Pendiente de Validación' ? 'bg-blue-100 text-blue-800' :
                            invoice.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }>
                            {invoice.status}
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
            </div>
            </CardContent>
        </Card>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Detalle de Factura</CardTitle>
                    <CardDescription>{selectedInvoice.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Estudiante:</span>
                        <span className="font-semibold">{selectedInvoice.studentName}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Monto:</span>
                        <span className="font-semibold">{formatCurrency(selectedInvoice.amount)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Fecha Venc.:</span>
                        <span className="font-semibold">{new Date(selectedInvoice.dueDate).toLocaleDateString('es-ES')}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Estado:</span>
                        <Badge variant={statusBadgeVariant[selectedInvoice.status]}>{selectedInvoice.status}</Badge>
                    </div>

                    {selectedInvoice.receiptUrl && (
                        <>
                        <Button variant="outline" className="w-full">
                            <Download className="mr-2 h-4 w-4"/>
                            Descargar Recibo
                        </Button>
                        <div className="flex gap-2 pt-2">
                           <Button variant="destructive" className="w-full"><X className="mr-2 h-4 w-4"/> Rechazar</Button>
                           <Button className="w-full bg-green-600 hover:bg-green-700"><Check className="mr-2 h-4 w-4"/> Aprobar</Button>
                        </div>
                        </>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Últimos Pagos Validados</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3 text-sm">
                       <li className="flex justify-between">
                           <span>Carlos Rivas</span>
                           <Badge variant="secondary">Aprobado</Badge>
                       </li>
                        <li className="flex justify-between">
                           <span>Ana Martínez</span>
                           <Badge variant="secondary">Aprobado</Badge>
                       </li>
                       <li className="flex justify-between">
                           <span>Pedro Vargas</span>
                           <Badge variant="destructive">Rechazado</Badge>
                       </li>
                    </ul>
                </CardContent>
             </Card>
        </div>
      </div>

    </div>
  );
}
