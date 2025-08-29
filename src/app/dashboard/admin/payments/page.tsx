"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { DollarSign, Search, Filter, MoreHorizontal, Eye, CheckCircle, Bell, TrendingUp, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  },
  {
    id: "INV-002",
    studentName: "David Martínez",
    studentId: "est008",
    program: "Administración de Empresas",
    issueDate: "2024-08-01",
    dueDate: "2024-08-31",
    status: "Pendiente",
    amount: 3200000,
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
                <CardTitle className="text-sm font-medium">Total Recaudado (Mes)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(3500000)}</div>
                <p className="text-xs text-muted-foreground">+5.2% vs el mes pasado</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(6000000)}</div>
                <p className="text-xs text-muted-foreground">Total en 2 facturas pendientes</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Facturas Vencidas</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(3000000)}</div>
                <p className="text-xs text-muted-foreground">1 factura vencida</p>
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
                <SelectItem value="Pagado">Pagado</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
            <Button>
                <FileText className="mr-2 h-4 w-4" />
                Generar Factura
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura ID</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Fecha de Vencimiento</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
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
                    <TableCell>
                      {new Date(invoice.dueDate).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusBadgeVariant[invoice.status]} className={
                          invoice.status === 'Pagado' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                      }>
                        {invoice.status}
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-green-600 focus:text-green-600 focus:bg-green-50">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marcar como Pagado
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Bell className="mr-2 h-4 w-4" />
                            Enviar Recordatorio
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
