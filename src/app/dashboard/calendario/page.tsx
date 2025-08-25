
"use client";

import { PageHeader } from "@/components/page-header";
import { Calendar } from "lucide-react";

export default function AcademicCalendarPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Calendario Académico"
        description="Consulta las fechas importantes, festivos y eventos académicos."
        icon={<Calendar className="h-8 w-8 text-primary" />}
      />
      <div className="text-center text-muted-foreground">
        <p>El contenido para la página del calendario académico estará disponible próximamente.</p>
      </div>
    </div>
  );
}
