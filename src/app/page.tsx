import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <SidebarInset>
      <PageHeader title="Panel" />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Bienvenido a Poli 2.0</h1>
        </div>
        <div
          className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
          x-chunk="dashboard-02-chunk-1"
        >
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Tu Aplicación Moderna</CardTitle>
              <CardDescription>
                Esta es Poli 2.0, una aplicación diseñada con un diseño receptivo, barra lateral personalizable y sugerencias inteligentes de IA para mejorar tu flujo de trabajo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src="https://placehold.co/1280x720.png"
                  alt="Imagen de marcador de posición para el panel"
                  data-ai-hint="abstract geometric"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="mt-4 text-muted-foreground">
                Explora la navegación a la izquierda para descubrir diferentes secciones. En la barra lateral, puedes interactuar con nuestra IA para obtener contenido personalizado y sugerencias de enlaces basadas en tu actividad.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarInset>
  );
}
