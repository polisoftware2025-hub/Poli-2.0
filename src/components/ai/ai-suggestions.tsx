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
import React, { useState, useTransition } from "react";

type Suggestions = {
  content: string[];
  links: string[];
};

export function AiSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [activity, setActivity] = useState("Acaba de iniciar sesión");
  const [isPending, startTransition] = useTransition();

  const activities = [
    { label: "Vio Proyectos", value: "Viendo el tablero de gestión de proyectos" },
    { label: "Revisó Tareas", value: "Revisando la lista de tareas pendientes" },
    { label: "Actualizó Ajustes", value: "Cambió la configuración de perfil y notificaciones" },
  ];

  const handleSuggestion = (newActivity: string) => {
    setActivity(newActivity);
    startTransition(async () => {
      const result = await suggestContent({
        userActivity: newActivity,
        contentTypes: "Documentación, Publicaciones de blog, Preguntas y respuestas de la comunidad",
        navigationLinks: "/,/projects,/tasks,/settings",
      });
      setSuggestions({
        content: result.suggestedContent.split(",").map((s) => s.trim()),
        links: result.suggestedLinks.split(",").map((s) => s.trim()),
      });
    });
  };

  React.useEffect(() => {
    handleSuggestion("Acaba de iniciar sesión");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SidebarGroup>
      <Card className="border-0 shadow-none group-data-[collapsible=icon]:bg-transparent">
        <CardHeader className="p-0 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
          <CardTitle className="hidden items-center gap-2 text-base group-data-[collapsible=icon]:flex">
            <Sparkles className="size-4 text-primary" />
          </CardTitle>
          <div className="group-data-[collapsible=icon]:hidden">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Para Ti
            </CardTitle>
            <CardDescription className="text-xs">
              Sugerencias basadas en tu actividad:{" "}
              <span className="font-semibold text-primary">{activity}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 group-data-[collapsible=icon]:hidden">
          <div className="mt-2 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Simular Actividad:
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {activities.map((act) => (
                <Button
                  key={act.value}
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-normal text-xs"
                  onClick={() => handleSuggestion(act.value)}
                  disabled={isPending}
                >
                  {act.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {isPending && (
              <>
                <div>
                  <Skeleton className="h-4 w-24" />
                  <div className="mt-2 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-4 w-20" />
                  <div className="mt-2 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                </div>
              </>
            )}
            {!isPending && suggestions && (
              <>
                <div>
                  <h4 className="text-sm font-semibold">Contenido Sugerido</h4>
                  <ul className="mt-1 list-none space-y-1 text-sm text-muted-foreground">
                    {suggestions.content.map((item, i) => item && <li key={i}>- {item}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Enlaces Sugeridos</h4>
                  <ul className="mt-1 list-none space-y-1">
                    {suggestions.links.map((link, i) => (
                      link && <li key={i}>
                        <Link href={link} className="flex items-center gap-1 text-sm text-primary hover:underline">
                          Ir a {link === '/' ? 'Panel' : link.replace('/', '')} <ArrowRight className="size-3" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </SidebarGroup>
  );
}
