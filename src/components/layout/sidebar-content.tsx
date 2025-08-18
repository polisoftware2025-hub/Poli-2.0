import {
  Sidebar,
  SidebarContent as Content,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Nav } from "@/components/layout/nav";
import { AiSuggestions } from "@/components/ai/ai-suggestions";

export function SidebarContent() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-between group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
           <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6 text-primary"
            >
              <path d="M4.03 4.21a2.13 2.13 0 0 1 2.8-1.58l3.62 1.45a2.13 2.13 0 0 1 1.25 2.53l-1.2 4.22a2.13 2.13 0 0 1-2.2 1.5l-4.24-1.2a2.13 2.13 0 0 1-1.5-2.2l1.46-3.92Z" />
              <path d="m10.1 9.4-4.24-1.2" />
              <path d="m14.29 14.73 3.62 1.45a2.13 2.13 0 0 0 2.8-1.58l1.2-4.24a2.13 2.13 0 0 0-1.5-2.2l-4.22-1.2a2.13 2.13 0 0 0-2.53 1.25l-1.45 3.62" />
              <path d="m15.5 12.5-4.22-1.2" />
            </svg>
          <span className="text-lg font-semibold">Poli 2.0</span>
        </div>
        <SidebarTrigger />
      </SidebarHeader>
      <Content>
        <Nav />
      </Content>
      <SidebarSeparator />
      <AiSuggestions />
    </Sidebar>
  );
}
