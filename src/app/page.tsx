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
      <PageHeader title="Dashboard" />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Welcome to Poli 2.0</h1>
        </div>
        <div
          className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
          x-chunk="dashboard-02-chunk-1"
        >
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Your Modern Application</CardTitle>
              <CardDescription>
                This is Poli 2.0, an application designed with a responsive layout, customizable sidebar, and intelligent AI suggestions to enhance your workflow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src="https://placehold.co/1280x720.png"
                  alt="Placeholder image for the dashboard"
                  data-ai-hint="abstract geometric"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="mt-4 text-muted-foreground">
                Explore the navigation on the left to discover different sections. On the sidebar, you can interact with our AI to get personalized content and link suggestions based on your activity.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarInset>
  );
}
