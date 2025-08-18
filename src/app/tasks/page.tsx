import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SidebarInset } from "@/components/ui/sidebar";
import { CheckSquare, PlusCircle } from "lucide-react";

export default function TasksPage() {
  const tasks = [
    { id: "task1", label: "Finalizar informe del tercer trimestre", done: false },
    { id: "task2", label: "Programar reunión de equipo", done: false },
    { id: "task3", label: "Incorporar nuevo diseñador", done: true },
    { id: "task4", label: "Revisar propuesta de proyecto", done: false },
    { id: "task5", label: "Enviar informe de gastos", done: true },
  ];

  return (
    <SidebarInset>
      <PageHeader title="Tareas" />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6" />
          <h1 className="text-lg font-semibold md:text-2xl">Mis Tareas</h1>
        </div>
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lista de Tareas</CardTitle>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Tarea
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
