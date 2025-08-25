
"use client";

import { PageHeader } from "@/components/page-header";
import { Calendar } from "lucide-react";

export default function SchedulePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mi Horario"
        description="Consulta tu horario de clases por día, semana o mes."
        icon={<Calendar className="h-8 w-8 text-primary" />}
      />
      <div className="text-center text-muted-foreground">
        <p>El contenido para la página de horarios estará disponible próximamente.</p>
      </div>
    </div>
  );
}
