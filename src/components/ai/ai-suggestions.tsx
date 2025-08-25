
"use client";

import { suggestContent } from "@/ai/flows/suggest-content";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRight, LayoutDashboard, BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";
import React, { useState, useTransition, useEffect } from "react";

type Suggestions = {
  content: string[];
  links: string[];
};

export function AiSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [activity, setActivity] = useState("");
  const [isPending, startTransition] = useTransition();
  const [language, setLanguage] = useState("es");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "es";
    setLanguage(savedLanguage);
  }, []);
  
  const t = (text: string) => {
    if (language === 'en') {
      const translations: { [key: string]: string } = {
        "Más Utilizados": "Most Used",
        "Panel": "Dashboard",
        "Materias": "Subjects",
        "Calificaciones": "Grades",
        "Para Ti": "For You",
        "Sugerencias basadas en tu actividad:": "Suggestions based on your activity:",
        "Simular Actividad:": "Simulate Activity:",
        "Vio Proyectos": "Viewed Projects",
        "Viendo el tablero de gestión de proyectos": "Viewing the project management board",
        "Revisó Tareas": "Reviewed Tasks",
        "Revisando la lista de tareas pendientes": "Reviewing the to-do list",
        "Actualizó Ajustes": "Updated Settings",
        "Cambió la configuración de perfil y notificaciones": "Changed profile and notification settings",
      };
      return translations[text] || text;
    }
    return text;
  }
  
  const activities = [
    { label: t("Vio Proyectos"), value: t("Viendo el tablero de gestión de proyectos") },
    { label: t("Revisó Tareas"), value: t("Revisando la lista de tareas pendientes") },
    { label: t("Actualizó Ajustes"), value: t("Cambió la configuración de perfil y notificaciones") },
  ];

  const handleSuggestion = (newActivity: string) => {
    setActivity(newActivity);
    startTransition(async () => {
      const result = await suggestContent({
        userActivity: newActivity,
        contentTypes: language === 'en' ? "Documentation, Blog Posts, Community Q&A" : "Documentación, Publicaciones de blog, Preguntas y respuestas de la comunidad",
        navigationLinks: "/,/projects,/tasks,/settings",
      });
      setSuggestions({
        content: result.suggestedContent.split(",").map((s) => s.trim()),
        links: result.suggestedLinks.split(",").map((s) => s.trim()),
      });
    });
  };

  return (
    <SidebarGroup>
      <Card className="border-0 shadow-none group-data-[collapsible=icon]:bg-transparent">
        <div className="group-data-[collapsible=icon]:hidden">
          <h4 className="px-3 text-xs font-semibold text-muted-foreground mb-2">{t("Más Utilizados")}</h4>
          <SidebarMenu className="px-0">
             <SidebarMenuItem>
                 <SidebarMenuButton asChild size="sm">
                     <Link href="/dashboard"><LayoutDashboard/> <span>{t("Panel")}</span></Link>
                 </SidebarMenuButton>
             </SidebarMenuItem>
             <SidebarMenuItem>
                 <SidebarMenuButton asChild size="sm">
                     <Link href="/dashboard/materias"><BookOpen/> <span>{t("Materias")}</span></Link>
                 </SidebarMenuButton>
             </SidebarMenuItem>
             <SidebarMenuItem>
                 <SidebarMenuButton asChild size="sm">
                     <Link href="/dashboard/calificaciones"><GraduationCap/> <span>{t("Calificaciones")}</span></Link>
                 </SidebarMenuButton>
             </SidebarMenuItem>
          </SidebarMenu>
        </div>


        <CardHeader className="p-0 pt-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
          <div className="hidden items-center gap-2 text-base font-semibold group-data-[collapsible=icon]:flex">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden px-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              {t("Para Ti")}
            </div>
            {activity && <p className="text-xs text-muted-foreground mt-1">
               {t("Simulando:")} <span className="font-semibold text-primary">{activity}</span>
            </p>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-0 pt-4 group-data-[collapsible=icon]:hidden px-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("Simular Actividad:")}
            </p>
            <div className="flex flex-col gap-2">
              {activities.map((act) => (
                <Button
                  key={act.value}
                  variant="outline"
                  size="sm"
                  className="h-auto w-full justify-start whitespace-normal text-xs"
                  onClick={() => handleSuggestion(act.value)}
                  disabled={isPending}
                >
                  {act.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </SidebarGroup>
  );
}
