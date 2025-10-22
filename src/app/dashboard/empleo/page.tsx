"use client";

import { PageHeader } from "@/components/page-header";
import { BotMessageSquare } from "lucide-react";

export default function JobBoardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Bolsa de Empleo"
        description="Encuentra ofertas laborales y oportunidades profesionales."
        icon={<BotMessageSquare className="h-8 w-8 text-primary" />}
      />
      <div className="text-center text-muted-foreground">
        <p>El contenido para la página de bolsa de empleo estará disponible próximamente.</p>
      </div>
    </div>
  );
}
