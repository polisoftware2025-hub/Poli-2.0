"use client";

import { PageHeader } from "@/components/page-header";
import { SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function GlobalSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Configuración del Sistema"
        description="Gestiona parámetros globales que afectan a toda la aplicación."
        icon={<SlidersHorizontal className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Parámetros Globales</CardTitle>
          <CardDescription>
            Próximamente: Opciones para configurar límites de créditos, plantillas de PDF, y más.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-10">
            <p>El módulo de configuración global está en construcción.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
