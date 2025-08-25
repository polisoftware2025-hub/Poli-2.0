
"use client";

import { PageHeader } from "@/components/page-header";
import { GraduationCap } from "lucide-react";

export default function GradesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis Calificaciones"
        description="Consulta tus notas y el progreso en tus materias."
        icon={<GraduationCap className="h-8 w-8 text-primary" />}
      />
      <div className="text-center text-muted-foreground">
        <p>El contenido para la página de calificaciones estará disponible próximamente.</p>
      </div>
    </div>
  );
}
