
"use client";

import {
  Sidebar,
  SidebarContent as Content,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Nav } from "@/components/layout/nav";
import { GraduationCap } from "lucide-react";

export function SidebarContent() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-2">
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
            <GraduationCap className="size-6 text-primary" />
            <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">Poli 2.0</span>
          </div>
        </div>
      </SidebarHeader>
      <Content>
        <Nav />
      </Content>
    </Sidebar>
  );
}
