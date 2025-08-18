"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SidebarInset } from "@/components/ui/sidebar";
import { CheckSquare, PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function TasksPage() {
  const [language, setLanguage] = useState("es");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "es";
    setLanguage(savedLanguage);
  }, []);

  const t = (text: string) => {
    if (language === 'en') {
      const translations: {[key: string]: string} = {
        "Tareas": "Tasks",
        "Mis Tareas": "My Tasks",
        "Lista de Tareas": "Task List",
        "Añadir Tarea": "Add Task",
        "Finalizar informe del tercer trimestre": "Finalize Q3 report",
        "Programar reunión de equipo": "Schedule team meeting",
        "Incorporar nuevo diseñador": "Onboard new designer",
        "Revisar propuesta de proyecto": "Review project proposal",
        "Enviar informe de gastos": "Submit expense report",
      };
      return translations[text] || text;
    }
    return text;
  }

  const tasks = [
    { id: "task1", label: t("Finalizar informe del tercer trimestre"), done: false },
    { id: "task2", label: t("Programar reunión de equipo"), done: false },
    { id: "task3", label: t("Incorporar nuevo diseñador"), done: true },
    { id: "task4", label: t("Revisar propuesta de proyecto"), done: false },
    { id: "task5", label: t("Enviar informe de gastos"), done: true },
  ];

  return (
    <SidebarInset>
      <PageHeader title={t("Tareas")} />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6" />
          <h1 className="text-lg font-semibold md:text-2xl">{t("Mis Tareas")}</h1>
        </div>
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("Lista de Tareas")}</CardTitle>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("Añadir Tarea")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-4 rounded-md border p-4">
                  <Checkbox id={task.id} checked={task.done} />
                  <label
                    htmlFor={task.id}
                    className={`flex-1 text-sm font-medium leading-none ${
                      task.done ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {task.label}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  );
}
