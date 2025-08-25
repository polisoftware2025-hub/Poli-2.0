
"use client";

import { suggestContent } from "@/ai/flows/suggest-content";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarGroup } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRight } from "lucide-react";
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

  useEffect(() => {
    const initialActivity = language === 'en' ? "Just logged in" : "Acaba de iniciar sesión";
    handleSuggestion(initialActivity);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);
  
  const t = (text: string) => {
    if (language === 'en') {
      const translations: { [key: string]: string } = {
        "Para Ti": "For You",
        "Sugerencias basadas en tu actividad:": "Suggestions based on your activity:",
        "Simular Actividad:": "Simulate Activity:",
        "Vio Proyectos": "Viewed Projects",
        "Viendo el tablero de gestión de proyectos": "Viewing the project management board",
        "Revisó Tareas": "Reviewed Tasks",
        "Revisando la lista de tareas pendientes": "Reviewing the to-do list",
        "Actualizó Ajustes": "Updated Settings",
        "Cambió la configuración de perfil y notificaciones": "Changed profile and notification settings",
        "Enlaces Sugeridos": "Suggested Links",
        "Ir a": "Go to",
        "Panel": "Dashboard",
        "Proyectos": "Projects",
        "Tareas": "Tasks",
        "Configuración": "Settings",
        "Acaba de iniciar sesión": "Just logged in",
      };
      return translations[text] || text;
    }
    return text;
  }
  
  const linkLabel = (path: string) => {
    if (language === 'en') {
      switch (path) {
        case '/': return 'Dashboard';
        case '/projects': return 'Projects';
        case '/tasks': return 'Tasks';
        case '/settings': return 'Settings';
        default: return path.replace('/', '');
      }
    }
    switch (path) {
      case '/': return 'Panel';
      case '/projects': return 'Proyectos';
      case '/tasks': return 'Tareas';
      case '/settings': return 'Configuración';
      default: return path.replace('/', '');
    }
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
        <CardHeader className="p-0 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
          <div className="hidden items-center gap-2 text-base font-semibold group-data-[collapsible=icon]:flex">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="size-4 text-primary" />
              {t("Para Ti")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Sugerencias basadas en tu actividad:")}{" "}
              <span className="font-semibold text-primary">{activity}</span>
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-0 pt-4 group-data-[collapsible=icon]:hidden">
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
         
          <div className="space-y-4">
            {isPending && (
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-20" />
                  <div className="mt-2 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                </div>
              </div>
            )}
            {!isPending && suggestions && (
              <div>
                <h4 className="text-sm font-semibold">{t("Enlaces Sugeridos")}</h4>
                <ul className="mt-2 list-none space-y-1">
                  {suggestions.links.map((link, i) => (
                    link && <li key={i}>
                      <Link href={link} className="flex items-center gap-1 text-sm text-primary hover:underline">
                        {t("Ir a")} {linkLabel(link)} <ArrowRight className="size-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </SidebarGroup>
  );
}
