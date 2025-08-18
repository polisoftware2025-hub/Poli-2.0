"use client";

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
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [language, setLanguage] = useState("es");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "es";
    setLanguage(savedLanguage);
  }, []);

  const t = (text: string) => {
    if (language === 'en') {
      const translations: {[key: string]: string} = {
        "Panel": "Dashboard",
        "Bienvenido a Poli 2.0": "Welcome to Poli 2.0",
        "Tu Aplicación Moderna": "Your Modern Application",
        "Esta es Poli 2.0, una aplicación diseñada con un diseño receptivo, barra lateral personalizable y sugerencias inteligentes de IA para mejorar tu flujo de trabajo.": "This is Poli 2.0, an application designed with a responsive layout, customizable sidebar, and intelligent AI suggestions to enhance your workflow.",
        "Imagen de marcador de posición para el panel": "Placeholder image for the dashboard",
        "Explora la navegación a la izquierda para descubrir diferentes secciones. En la barra lateral, puedes interactuar con nuestra IA para obtener contenido personalizado y sugerencias de enlaces basadas en tu actividad.": "Explore the navigation on the left to discover different sections. On the sidebar, you can interact with our AI to get personalized content and link suggestions based on your activity.",
      };
      return translations[text] || text;
    }
    return text;
  }

  return (
    <SidebarInset>
      <PageHeader title={t("Panel")} />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">{t("Bienvenido a Poli 2.0")}</h1>
        </div>
        <div
          className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
          x-chunk="dashboard-02-chunk-1"
        >
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{t("Tu Aplicación Moderna")}</CardTitle>
              <CardDescription>
                {t("Esta es Poli 2.0, una aplicación diseñada con un diseño receptivo, barra lateral personalizable y sugerencias inteligentes de IA para mejorar tu flujo de trabajo.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src="https://placehold.co/1280x720.png"
                  alt={t("Imagen de marcador de posición para el panel")}
                  data-ai-hint="abstract geometric"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="mt-4 text-muted-foreground">
                {t("Explora la navegación a la izquierda para descubrir diferentes secciones. En la barra lateral, puedes interactuar con nuestra IA para obtener contenido personalizado y sugerencias de enlaces basadas en tu actividad.")}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarInset>
  );
}
