
"use client";

import { PageHeader } from "@/components/page-header";
import { Newspaper } from "lucide-react";

export default function NewsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Noticias y Anuncios"
        description="Mantente al día con las últimas noticias y anuncios de la institución."
        icon={<Newspaper className="h-8 w-8 text-primary" />}
      />
      <div className="text-center text-muted-foreground">
        <p>El contenido para la página de noticias y anuncios estará disponible próximamente.</p>
      </div>
    </div>
  );
}
