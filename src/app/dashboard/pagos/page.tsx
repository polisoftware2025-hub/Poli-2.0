
"use client";

import { PageHeader } from "@/components/page-header";
import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis Pagos"
        description="Consulta tu historial de pagos y realiza pagos en línea."
        icon={<CreditCard className="h-8 w-8 text-primary" />}
      />
      <div className="text-center text-muted-foreground">
        <p>El contenido para la página de pagos estará disponible próximamente.</p>
      </div>
    </div>
  );
}
