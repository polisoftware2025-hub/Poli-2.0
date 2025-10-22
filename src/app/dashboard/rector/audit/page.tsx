"use client";

import { PageHeader } from "@/components/page-header";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AuditPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Auditoría de Cambios"
        description="Panel de registros para ver qué cambios ha hecho cada administrador."
        icon={<ShieldAlert className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoría</CardTitle>
          <CardDescription>
            Próximamente: Un listado detallado de todas las acciones importantes realizadas por los administradores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-10">
            <p>El módulo de auditoría está en construcción.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
