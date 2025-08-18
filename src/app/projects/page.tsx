import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import { KanbanSquare } from "lucide-react";

export default function ProjectsPage() {
  return (
    <SidebarInset>
      <PageHeader title="Proyectos" />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center gap-2">
          <KanbanSquare className="h-6 w-6" />
          <h1 className="text-lg font-semibold md:text-2xl">Proyectos</h1>
        </div>
        <div className="flex-1 rounded-lg border border-dashed p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Por Hacer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-md border bg-card p-3">
                  <p className="font-medium">Diseñar página de inicio</p>
                  <p className="text-sm text-muted-foreground">Vence en 2 días</p>
                </div>
                <div className="rounded-md border bg-card p-3">
                  <p className="font-medium">Desarrollar integración de API</p>
                  <p className="text-sm text-muted-foreground">Vence en 5 días</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>En Progreso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-md border bg-card p-3">
                  <p className="font-medium">Corregir error de autenticación</p>
                  <p className="text-sm text-muted-foreground">Prioridad Alta</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Hecho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-md border bg-card p-3 opacity-70">
                  <p className="font-medium line-through">Configurar repositorio del proyecto</p>
                  <p className="text-sm text-muted-foreground">Completado ayer</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </SidebarInset>
  );
}
