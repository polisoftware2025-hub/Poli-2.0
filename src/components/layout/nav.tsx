"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  KanbanSquare,
  Settings,
  CheckSquare,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const navigationItems = [
  { href: "/", label: "Panel", icon: LayoutDashboard },
  { href: "/projects", label: "Proyectos", icon: KanbanSquare },
  { href: "/tasks", label: "Tareas", icon: CheckSquare },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navigationItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={{ children: item.label }}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
