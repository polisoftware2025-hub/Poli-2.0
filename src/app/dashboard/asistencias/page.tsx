
"use client";

import { PageHeader } from "@/components/page-header";
import { CheckSquare } from "lucide-react";

export default function AttendancePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis Asistencias"
        description="Revisa tu registro de asistencias y faltas."
        icon={<CheckSquare className="h-8 w-8 text-primary" />}
      />
      <div className="text-center text-muted-foreground">
        <p>El contenido para la página de asistencias estará disponible próximamente.</p>
      </div>
    </div>
  );
}
