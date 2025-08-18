"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import { KanbanSquare } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProjectsPage() {
  const [language, setLanguage] = useState("es");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "es";
    setLanguage(savedLanguage);
  }, []);

  const t = (text: string) => {
    if (language === 'en') {
      const translations: {[key: string]: string} = {
        "Proyectos": "Projects",
        "Por Hacer": "To Do",
        "Diseñar página de inicio": "Design homepage",
        "Vence en 2 días": "Due in 2 days",
        "Desarrollar integración de API": "Develop API integration",
        "Vence en 5 días": "Due in 5 days",
        "En Progreso": "In Progress",
        "Corregir error de autenticación": "Fix authentication bug",
        "Prioridad Alta": "High Priority",
        "Hecho": "Done",
        "Configurar repositorio del proyecto": "Set up project repository",
        "Completado ayer": "Completed yesterday",
      };
      return translations[text] || text;
    }
    return text;
  }
  
  return (
    <SidebarInset>
      <PageHeader title={t("Proyectos")} />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center gap-2">
          <KanbanSquare className="h-6 w-6" />
          <h1 className="text-lg font-semibold md:text-2xl">{t("Proyectos")}</h1>
        </div>
        <div className="flex-1 rounded-lg border border-dashed p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{t("Por Hacer")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-md border bg-card p-3">
                  <p className="font-medium">{t("Diseñar página de inicio")}</p>
                  <p className="text-sm text-muted-foreground">{t("Vence en 2 días")}</p>
                </div>
                <div className="rounded-md border bg-card p-3">
                  <p className="font-medium">{t("Desarrollar integración de API")}</p>
                  <p className="text-sm text-muted-foreground">{t("Vence en 5 días")}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("En Progreso")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-md border bg-card p-3">
                  <p className="font-medium">{t("Corregir error de autenticación")}</p>
                  <p className="text-sm text-muted-foreground">{t("Prioridad Alta")}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("Hecho")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-md border bg-card p-3 opacity-70">
                  <p className="font-medium line-through">{t("Configurar repositorio del proyecto")}</p>
                  <p className="text-sm text-muted-foreground">{t("Completado ayer")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </SidebarInset>
  );
}
