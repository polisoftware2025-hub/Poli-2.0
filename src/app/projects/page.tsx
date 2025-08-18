import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import { KanbanSquare } from "lucide-react";

export default function ProjectsPage() {
  return (
    <SidebarInset>
      <PageHeader title="Projects" />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center gap-2">
          <KanbanSquare className="h-6 w-6" />
          <h1 className="text-lg font-semibold md:text-2xl">Projects</h1>
        </div>
        <div className="flex-1 rounded-lg border border-dashed p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>To Do</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-md border bg-card p-3">
                  <p className="font-medium">Design landing page</p>
                  <p className="text-sm text-muted-foreground">Due in 2 days</p>
                </div>
                <div className="rounded-md border bg-card p-3">
                  <p className="font-medium">Develop API integration</p>
                  <p className="text-sm text-muted-foreground">Due in 5 days</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>In Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-md border bg-card p-3">
                  <p className="font-medium">Fix authentication bug</p>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Done</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-md border bg-card p-3 opacity-70">
                  <p className="font-medium line-through">Setup project repository</p>
                  <p className="text-sm text-muted-foreground">Completed yesterday</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </SidebarInset>
  );
}
